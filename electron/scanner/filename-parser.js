const path = require('path');

/**
 * Checks if a string looks like a phone number
 * (e.g., +919876543210, +1 555-123-4567, 9876543210, (123) 456-7890)
 */
function isPhoneNumber(str) {
  if (!str) return false;
  const trimmed = str.trim();
  // Strip allowed phone punctuation to count digits
  const digitsOnly = trimmed.replace(/[\s\-\(\)\+]/g, '');
  const hasOnlyPhoneChars = /^[\+]?[\d\s\-\(\)]+$/.test(trimmed);
  // Needs to be made of phone characters and contain at least 6 digits
  return hasOnlyPhoneChars && digitsOnly.length >= 6;
}

/**
 * Parses YYMMDD and HHMMSS into ISO 8601 string: YYYY-MM-DDTHH:MM:SS
 */
function parseDateTime(datePart, timePart) {
  if (!/^\d{6}$/.test(datePart) || !/^\d{6}$/.test(timePart)) {
    return null;
  }

  const yy = parseInt(datePart.substring(0, 2), 10);
  const mm = parseInt(datePart.substring(2, 4), 10);
  const dd = parseInt(datePart.substring(4, 6), 10);

  const hour = parseInt(timePart.substring(0, 2), 10);
  const min = parseInt(timePart.substring(2, 4), 10);
  const sec = parseInt(timePart.substring(4, 6), 10);

  // Validate ranges
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  if (hour < 0 || hour > 23) return null;
  if (min < 0 || min > 59) return null;
  if (sec < 0 || sec > 59) return null;

  // Assuming 2000-2099 for two-digit year
  const fullYear = 2000 + yy;
  const mmStr = String(mm).padStart(2, '0');
  const ddStr = String(dd).padStart(2, '0');
  const hhStr = String(hour).padStart(2, '0');
  const minStr = String(min).padStart(2, '0');
  const secStr = String(sec).padStart(2, '0');

  return `${fullYear}-${mmStr}-${ddStr}T${hhStr}:${minStr}:${secStr}`;
}

/**
 * Parses a recording filename according to CallVault conventions
 * Primary: Call Recording {IDENTIFIER}_{YYMMDD}_{HHMMSS}.m4a
 * 
 * Returns: {
 *   personName: string | null,
 *   phoneNumber: string | null,
 *   recordedAt: string,
 *   status: 'VALID' | 'PARTIAL' | 'INVALID'
 * }
 */
function parseFilename(filename, fileMtimeMs = null) {
  try {
    const basename = path.basename(filename, path.extname(filename));

    // Pattern 1: Call Recording {IDENTIFIER}_{YYMMDD}_{HHMMSS}
    // Also matches variations like "Call recording...", "Call Recording...", with optional spaces around underscore
    const primaryRegex = /^call\s+recording\s+(.+?)_(\d{6})_(\d{6})$/i;
    const match = basename.match(primaryRegex);

    if (match) {
      const identifier = match[1].trim();
      const datePart = match[2];
      const timePart = match[3];

      const recordedAt = parseDateTime(datePart, timePart);

      let personName = null;
      let phoneNumber = null;

      if (isPhoneNumber(identifier)) {
        phoneNumber = identifier;
      } else {
        personName = identifier;
      }

      if (recordedAt) {
        return {
          personName,
          phoneNumber,
          recordedAt,
          status: 'VALID',
        };
      } else {
        // Date numbers were out of bounds
        const fallbackDate = fileMtimeMs ? new Date(fileMtimeMs).toISOString().split('.')[0] : new Date().toISOString().split('.')[0];
        return {
          personName,
          phoneNumber,
          recordedAt: fallbackDate,
          status: 'PARTIAL',
        };
      }
    }

    // Pattern 2: Relaxed pattern e.g. "{IDENTIFIER}_{YYMMDD}_{HHMMSS}" without "Call Recording" prefix
    const relaxedRegex = /^(.+?)_(\d{6})_(\d{6})$/;
    const relaxedMatch = basename.match(relaxedRegex);
    if (relaxedMatch) {
      const identifier = relaxedMatch[1].replace(/^call\s+recording\s*/i, '').trim();
      const recordedAt = parseDateTime(relaxedMatch[2], relaxedMatch[3]);
      if (recordedAt) {
        return {
          personName: isPhoneNumber(identifier) ? null : identifier,
          phoneNumber: isPhoneNumber(identifier) ? identifier : null,
          recordedAt,
          status: 'PARTIAL',
        };
      }
    }

    // Fallback: Malformed filename
    const fallbackDate = fileMtimeMs
      ? new Date(fileMtimeMs).toISOString().split('.')[0]
      : new Date().toISOString().split('.')[0];

    // Clean up basename to guess a readable identifier
    let guessName = basename
      .replace(/^call\s+recording\s*/i, '')
      .replace(/[_\-]+/g, ' ')
      .trim();

    if (!guessName) {
      guessName = 'Unknown Recording';
    }

    const isPhone = isPhoneNumber(guessName);

    return {
      personName: isPhone ? null : guessName,
      phoneNumber: isPhone ? guessName : null,
      recordedAt: fallbackDate,
      status: 'INVALID',
    };
  } catch (err) {
    // Parser must never crash!
    const fallbackDate = fileMtimeMs
      ? new Date(fileMtimeMs).toISOString().split('.')[0]
      : new Date().toISOString().split('.')[0];

    return {
      personName: path.basename(filename),
      phoneNumber: null,
      recordedAt: fallbackDate,
      status: 'INVALID',
    };
  }
}

module.exports = {
  parseFilename,
  isPhoneNumber,
  parseDateTime,
};
