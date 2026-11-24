const { open } = require('node:fs/promises');
const { Readable } = require('node:stream');

// Chromium's media loader needs both the partial response status and the exact
// byte offsets. A 200 response containing only the requested slice is unseekable.
function parseByteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match || size === 0 || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  return start < size && start <= end ? { start, end } : null;
}

async function serveAudioFile(request, filePath) {
  let file;
  try {
    file = await open(filePath, 'r');
    const stat = await file.stat();
    if (!stat.isFile()) return new Response(null, { status: 404 });

    const size = stat.size;
    const headers = new Headers({ 'Accept-Ranges': 'bytes', 'Content-Type': 'audio/mp4' });
    const requested = request.headers.get('range');
    const range = requested === null ? null : parseByteRange(requested, size);
    if (requested !== null && !range) {
      headers.set('Content-Range', `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }

    const length = range ? range.end - range.start + 1 : size;
    headers.set('Content-Length', String(length));
    if (range) headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
    const init = { status: range ? 206 : 200, headers };
    if (request.method === 'HEAD' || length === 0) return new Response(null, init);

    const stream = file.createReadStream({ ...range, signal: request.signal });
    file = null; // The stream now owns the descriptor and closes it on completion or cancellation.
    const body = Readable.toWeb(stream, {
      strategy: { highWaterMark: stream.readableHighWaterMark, size: chunk => chunk.byteLength },
    });
    return new Response(body, init);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return new Response(null, { status: error.code === 'ENOENT' ? 404 : 500 });
  } finally {
    await file?.close();
  }
}

module.exports = { serveAudioFile };
