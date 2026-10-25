import assert from 'node:assert/strict';
import test from 'node:test';

const { detectImage, validateUploadImage, UPLOAD_IMAGE_MIME } = await import('../src/lib/upload-image.ts');

test('detectImage rejects empty buffer', () => {
  assert.equal(detectImage(Buffer.alloc(0)), null);
});

test('validateUploadImage enforces declared MIME', () => {
  // 1x1 PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const ok = validateUploadImage(png, {
    maxBytes: 1024 * 1024,
    allowedMime: [UPLOAD_IMAGE_MIME.png],
    declaredMime: 'image/png',
  });
  assert.equal(ok.ok, true);

  const bad = validateUploadImage(png, {
    maxBytes: 1024 * 1024,
    allowedMime: [UPLOAD_IMAGE_MIME.png],
    declaredMime: 'image/jpeg',
  });
  assert.equal(bad.ok, false);
});
