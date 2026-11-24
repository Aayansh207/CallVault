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

const monthWords = Object.keys(MONTH_MAP).join('|');
const dayPhrase = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:(${monthWords})\\s+(\\d{1,2})|(?:([0-9]{1,2})(?:st|nd|rd|th)?\\s+)(${monthWords}))(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?(?![\\p{L}\\p{N}])`,
  'giu',
);

function nextDay(date) {
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== date) return null;
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function searchFilters(search, where, params) {
  const query = String(search || '').trim().slice(0, 240);
  if (!query) return;
  const digits = query.replace(/\D/g, '');
  if (digits.length >= 5 && /^[+\d().\s-]+$/.test(query) && !/^\d{4}-\d{2}(?:-\d{2})?$/.test(query)) {
    where.push("(instr(phone_digits(r.phone_number), ?) > 0 OR instr(r.file_name, ?) > 0 OR EXISTS (SELECT 1 FROM notes n WHERE n.recording_id = r.id AND instr(n.content, ?) > 0))");
    params.push(digits, query, query);
    return;
  }

  function appendDate(date) {
    const end = nextDay(date);
    if (!end) return false;
    where.push('(r.recorded_at >= ? AND r.recorded_at < ?)');
    params.push(date, end);
    return true;
  }

  // Preserve quoted terms as text even if they look like dates.
  const terms = [];
  let remaining = query.replace(/"([^"]+)"/g, (_, phrase) => {
    terms.push({ text: phrase });
    return ' ␟ ';
  });
  remaining = remaining.replace(dayPhrase, (phrase, monthBefore, dayAfter, dayBefore, monthAfter, year) => {
    const month = MONTH_MAP[(monthBefore || monthAfter).toLowerCase()];
    const day = Number(dayBefore || dayAfter);
    if (day < 1 || day > 31) return phrase;
    const monthDay = `${month}-${String(day).padStart(2, '0')}`;
    if (year) {
      if (!appendDate(`${year}-${monthDay}`)) return phrase;
    } else {
      where.push('substr(r.recorded_at, 6, 5) = ?');
      params.push(monthDay);
    }
    return ' ';
  });
  terms.push(...remaining.split(/\s+/).filter((text) => text && text !== '␟').map((text) => ({ text, allowDate: true })));

  for (const { text, allowDate } of terms) {
    const term = text.normalize('NFC').toLowerCase();
    if (allowDate && /^\d{4}-\d{2}-\d{2}$/.test(term) && appendDate(term)) continue;
    if (allowDate && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(term)) {
      const [year, month] = term.split('-').map(Number);
      const end = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
      where.push('(r.recorded_at >= ? AND r.recorded_at < ?)');
      params.push(term, end);
      continue;
    }

    const lower = /[^\x00-\x7f]/.test(term) ? 'search_lower' : 'lower';
    const conditions = [
      ...['r.person_name', 'r.phone_number', 'r.file_name'].map((field) => `instr(${lower}(${field}), ?) > 0`),
      `EXISTS (SELECT 1 FROM notes n WHERE n.recording_id = r.id AND instr(${lower}(n.content), ?) > 0)`,
      `EXISTS (SELECT 1 FROM recording_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.recording_id = r.id AND instr(${lower}(t.name), ?) > 0)`,
    ];
    params.push(term, term, term, term, term);
    if (allowDate && Object.hasOwn(MONTH_MAP, term)) {
      conditions.push('substr(r.recorded_at, 6, 2) = ?');
      params.push(MONTH_MAP[term]);
    } else if (allowDate && /^20\d{2}$/.test(term)) {
      conditions.push('substr(r.recorded_at, 1, 4) = ?');
      params.push(term);
    }
    where.push(`(${conditions.join(' OR ')})`);
  }
}

/**
 * Builds dynamic WHERE clause and parameters for list / count.
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
  if (options.personName && options.phoneNumber) {
    whereClauses.push('(r.person_name = ? OR r.phone_number = ?)');
    params.push(options.personName, options.phoneNumber);
  } else if (options.personName) {
    whereClauses.push('r.person_name = ?');
    params.push(options.personName);
  } else if (options.phoneNumber) {
    whereClauses.push('r.phone_number = ?');
    params.push(options.phoneNumber);
  } else if (options.person) {
    whereClauses.push('(r.person_name = ? OR r.phone_number = ?)');
    params.push(options.person, options.person);
  }


  const from = options.date || options.dateFrom;
  const through = options.date || options.dateTo;
  if (from) {
    whereClauses.push('r.recorded_at >= ?');
    params.push(from);
  }
  if (through) {
    const end = nextDay(through);
    whereClauses.push(end ? 'r.recorded_at < ?' : 'r.recorded_at <= ?');
    params.push(end || through);
  }

  // Tag filter
  if (options.tagId) {
    whereClauses.push('EXISTS (SELECT 1 FROM recording_tags rt WHERE rt.recording_id = r.id AND rt.tag_id = ?)');
    params.push(options.tagId);
  }

  searchFilters(options.search, whereClauses, params);

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
