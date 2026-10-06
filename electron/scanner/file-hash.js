const fs = require('fs');
const crypto = require('crypto');

/**
 * Calculates SHA-256 hash of a file.
 * Kept optional to avoid scanning bottlenecks with tens of thousands of files.
 */
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  calculateFileHash,
};
