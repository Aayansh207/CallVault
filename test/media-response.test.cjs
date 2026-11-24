const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { serveAudioFile } = require('../electron/services/media-response');

test('audio byte offsets, response headers and payload agree', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'callvault-media-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, 'call.m4a');
  await writeFile(file, '0123456789');
  const request = (range, method = 'GET') => serveAudioFile(new Request('media://localhost/call.m4a', {
    method, headers: range ? { Range: range } : {},
  }), file);

  const full = await request();
  assert.equal(full.status, 200);
  assert.equal(full.headers.get('Content-Length'), '10');
  assert.equal(full.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(await full.text(), '0123456789');

  for (const [range, expected, offsets] of [
    ['bytes=3-6', '3456', '3-6'], ['bytes=8-', '89', '8-9'],
    ['bytes=-4', '6789', '6-9'], ['bytes=0-99', '0123456789', '0-9'],
  ]) {
    const res = await request(range);
    assert.equal(res.status, 206);
    assert.equal(res.headers.get('Content-Range'), `bytes ${offsets}/10`);
    assert.equal(res.headers.get('Content-Length'), String(expected.length));
    assert.equal(await res.text(), expected);
  }

  for (const range of ['bytes=10-', 'bytes=8-2', 'bytes=-0']) {
    const res = await request(range);
    assert.equal(res.status, 416);
    assert.equal(res.headers.get('Content-Range'), 'bytes */10');
  }
  const head = await request(null, 'HEAD');
  assert.equal(head.headers.get('Content-Length'), '10');
  assert.equal(head.body, null);
});
