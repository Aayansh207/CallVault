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
    SUM(CASE WHEN available = 1 THEN 1 ELSE 0 END) as total_available
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

/**
 * Builds dynamic WHERE clause and parameters for list / count
 */
function buildFilterClause(options = {}) {
  const whereClauses = [];
  const params = [];

  // Default: only available files unless specified
  if (options.available !== undefined && options.available !== null) {
    whereClauses.push('r.available = ?');
    params.push(options.available ? 1 : 0);
  }

  // Favorite filter
  if (options.favorite) {
    whereClauses.push('r.favorite = 1');
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

  // Search filter across person_name, phone_number, and file_name
  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    whereClauses.push('(r.person_name LIKE ? OR r.phone_number LIKE ? OR r.file_name LIKE ?)');
    params.push(term, term, term);
  }

  // Tag filter
  if (options.tagId) {
    whereClauses.push('EXISTS (SELECT 1 FROM recording_tags rt WHERE rt.recording_id = r.id AND rt.tag_id = ?)');
    params.push(options.tagId);
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
  buildFilterClause,
};
