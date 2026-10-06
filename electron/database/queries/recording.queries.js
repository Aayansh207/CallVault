/**
 * SQL queries and query builders for CallVault recordings
 */

const UPSERT_RECORDING = `
  INSERT INTO recordings (
    file_path,
    file_name,
    person_name,
    phone_number,
    recorded_at,
    duration_seconds,
    file_size,
    file_modified_at,
    file_hash,
    available,
    updated_at
  ) VALUES (
    @filePath,
    @fileName,
    @personName,
    @phoneNumber,
    @recordedAt,
    @durationSeconds,
    @fileSize,
    @fileModifiedAt,
    @fileHash,
    1,
    datetime('now')
  )
  ON CONFLICT(file_path) DO UPDATE SET
    file_name = excluded.file_name,
    person_name = excluded.person_name,
    phone_number = excluded.phone_number,
    recorded_at = excluded.recorded_at,
    duration_seconds = CASE WHEN excluded.duration_seconds > 0 THEN excluded.duration_seconds ELSE recordings.duration_seconds END,
    file_size = excluded.file_size,
    file_modified_at = excluded.file_modified_at,
    file_hash = COALESCE(excluded.file_hash, recordings.file_hash),
    available = 1,
    updated_at = datetime('now')
`;

const GET_RECORDING_BY_ID = `
  SELECT r.*, 
    COALESCE((
      SELECT json_group_array(json_object('id', t.id, 'name', t.name, 'color', t.color))
      FROM recording_tags rt
      JOIN tags t ON rt.tag_id = t.id
      WHERE rt.recording_id = r.id
    ), '[]') as tags_json,
    (
      SELECT content FROM notes WHERE recording_id = r.id ORDER BY updated_at DESC LIMIT 1
    ) as note_content
  FROM recordings r
  WHERE r.id = ?
`;

const GET_RECORDING_BY_PATH = `
  SELECT * FROM recordings WHERE file_path = ?
`;

const UPDATE_PLAYBACK_POSITION = `
  UPDATE recordings
  SET playback_position = ?,
      last_played_at = datetime('now'),
      updated_at = datetime('now')
  WHERE id = ?
`;

const TOGGLE_FAVORITE = `
  UPDATE recordings
  SET favorite = ?,
      updated_at = datetime('now')
  WHERE id = ?
`;

const SET_AVAILABILITY = `
  UPDATE recordings
  SET available = ?,
      updated_at = datetime('now')
  WHERE file_path = ?
`;

const DELETE_RECORDING = `
  DELETE FROM recordings WHERE id = ?
`;

const GET_LIBRARY_STATS = `
  SELECT 
    COUNT(*) as total_recordings,
    COALESCE(SUM(duration_seconds), 0) as total_duration_seconds,
    COALESCE(SUM(file_size), 0) as total_file_size,
    COUNT(DISTINCT COALESCE(person_name, phone_number)) as total_people,
    SUM(CASE WHEN favorite = 1 THEN 1 ELSE 0 END) as total_favorites,
    SUM(CASE WHEN available = 1 THEN 1 ELSE 0 END) as total_available,
    (SELECT COUNT(DISTINCT recording_id) FROM notes WHERE LENGTH(TRIM(content)) > 0) as total_with_notes
  FROM recordings
`;

const GET_PEOPLE_SUMMARY = `
  SELECT 
    COALESCE(person_name, phone_number, 'Unknown') as identifier,
    person_name,
    phone_number,
    COUNT(*) as total_recordings,
    SUM(duration_seconds) as total_duration_seconds,
    MAX(recorded_at) as last_recorded_at
  FROM recordings
  WHERE available = 1
  GROUP BY identifier
  ORDER BY total_recordings DESC, last_recorded_at DESC
`;

const MONTH_MAP = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
};

/**
 * Builds dynamic WHERE clause and parameters for list / count
 * with extensive date, month name, note content, and contact search
 */
function buildFilterClause(options = {}) {
  const whereClauses = [];
  const params = [];

  // Availability filter (default: only available unless specified)
  if (options.available !== undefined && options.available !== null) {
    whereClauses.push('r.available = ?');
    params.push(options.available ? 1 : 0);
  }

  // Favorite filter
  if (options.favorite) {
    whereClauses.push('r.favorite = 1');
  }

  // Has Notes filter
  if (options.hasNotes) {
    whereClauses.push('EXISTS (SELECT 1 FROM notes n WHERE n.recording_id = r.id AND LENGTH(TRIM(n.content)) > 0)');
  }

  // Person filter
  if (options.person) {
    whereClauses.push('(r.person_name = ? OR r.phone_number = ?)');
    params.push(options.person, options.person);
  }

  // Date filter (exact day YYYY-MM-DD)
  if (options.date) {
    whereClauses.push("strftime('%Y-%m-%d', r.recorded_at) = ?");
    params.push(options.date);
  }

  // Date range filter
  if (options.dateFrom) {
    whereClauses.push("r.recorded_at >= ?");
    params.push(options.dateFrom);
  }
  if (options.dateTo) {
    whereClauses.push("r.recorded_at <= ?");
    params.push(options.dateTo);
  }

  // Tag filter
  if (options.tagId) {
    whereClauses.push('EXISTS (SELECT 1 FROM recording_tags rt WHERE rt.recording_id = r.id AND rt.tag_id = ?)');
    params.push(options.tagId);
  }

  // Multi-attribute search (person, phone, filename, notes, month names, dates)
  if (options.search && options.search.trim()) {
    const rawSearch = options.search.trim();
    const lowerSearch = rawSearch.toLowerCase();
    const tokens = lowerSearch.split(/\s+/).filter(Boolean);

    // Check if the entire search or pairs of tokens match date formats
    // e.g. "October 6" or "6 October" or "2026-10-06"
    const monthAndDayMatch = lowerSearch.match(
      /(?:(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2}))|(?:(\d{1,2})(?:st|nd|rd|th)?\s+(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec))/i
    );

    if (monthAndDayMatch) {
      const monthStr = monthAndDayMatch[1] || monthAndDayMatch[4];
      const dayNum = parseInt(monthAndDayMatch[2] || monthAndDayMatch[3], 10);
      const mm = MONTH_MAP[monthStr.toLowerCase()];
      const dd = String(dayNum).padStart(2, '0');

      if (mm && dayNum >= 1 && dayNum <= 31) {
        whereClauses.push(
          "(strftime('%m-%d', r.recorded_at) = ? OR r.file_name LIKE ? OR EXISTS (SELECT 1 FROM notes n WHERE n.recording_id = r.id AND n.content LIKE ?))"
        );
        params.push(`${mm}-${dd}`, `%${rawSearch}%`, `%${rawSearch}%`);
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        return { whereSql, params };
      }
    }

    // Process each token
    for (const token of tokens) {
      const tokenConditions = [];

      // 1. Check if token is a month name
      if (MONTH_MAP[token]) {
        tokenConditions.push("strftime('%m', r.recorded_at) = ?");
        params.push(MONTH_MAP[token]);
      }

      // 2. Check if token is a 4-digit year (e.g. 2024, 2025, 2026)
      if (/^20\d{2}$/.test(token)) {
        tokenConditions.push("strftime('%Y', r.recorded_at) = ?");
        params.push(token);
      }

      // 3. Check if token is a 2-digit day number
      if (/^\d{1,2}$/.test(token)) {
        const d = parseInt(token, 10);
        if (d >= 1 && d <= 31) {
          tokenConditions.push("strftime('%d', r.recorded_at) = ?");
          params.push(String(d).padStart(2, '0'));
        }
      }

      // 4. Person name match
      tokenConditions.push('r.person_name LIKE ?');
      params.push(`%${token}%`);

      // 5. Phone number match
      tokenConditions.push('r.phone_number LIKE ?');
      params.push(`%${token}%`);

      // 6. File name match
      tokenConditions.push('r.file_name LIKE ?');
      params.push(`%${token}%`);

      // 7. Note content match!
      tokenConditions.push('EXISTS (SELECT 1 FROM notes n WHERE n.recording_id = r.id AND n.content LIKE ?)');
      params.push(`%${token}%`);

      whereClauses.push(`(${tokenConditions.join(' OR ')})`);
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  return { whereSql, params };
}

module.exports = {
  UPSERT_RECORDING,
  GET_RECORDING_BY_ID,
  GET_RECORDING_BY_PATH,
  UPDATE_PLAYBACK_POSITION,
  TOGGLE_FAVORITE,
  SET_AVAILABILITY,
  DELETE_RECORDING,
  GET_LIBRARY_STATS,
  GET_PEOPLE_SUMMARY,
  MONTH_MAP,
  buildFilterClause,
};
