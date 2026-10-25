/** 上传图片：魔数识别、尺寸上限（不依赖 sharp） */

export const UPLOAD_IMAGE_MIME = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
} as const;

export type UploadImageMime = (typeof UPLOAD_IMAGE_MIME)[keyof typeof UPLOAD_IMAGE_MIME];

export type DetectedImage = {
  mime: UploadImageMime;
  ext: 'jpg' | 'png' | 'webp' | 'gif';
  width: number;
  height: number;
};

const DEFAULT_MAX_WIDTH = 4096;
const DEFAULT_MAX_HEIGHT = 4096;
const DEFAULT_MAX_PIXELS = 16_777_216; // 4096²

export function getUploadImageLimits() {
  const maxWidth = Number(process.env.UPLOAD_IMAGE_MAX_WIDTH) || DEFAULT_MAX_WIDTH;
  const maxHeight = Number(process.env.UPLOAD_IMAGE_MAX_HEIGHT) || DEFAULT_MAX_HEIGHT;
  const maxPixels = Number(process.env.UPLOAD_IMAGE_MAX_PIXELS) || DEFAULT_MAX_PIXELS;
  return {
    maxWidth: Math.min(Math.max(maxWidth, 1), 8192),
    maxHeight: Math.min(Math.max(maxHeight, 1), 8192),
    maxPixels: Math.min(Math.max(maxPixels, 1), 67_108_864),
  };
}

function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readGifDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 10) return null;
  const sig = buffer.subarray(0, 6).toString('ascii');
  if (sig !== 'GIF87a' && sig !== 'GIF89a') return null;
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function readJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    if (offset + 3 >= buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2) break;

    const isSof =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;

    if (isSof && offset + 7 < buffer.length) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return null;

  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && buffer.length >= 30) {
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    return { width, height };
  }

  if (chunk === 'VP8 ' && buffer.length >= 30) {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  if (chunk === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >> 14) & 0x3fff);
    return { width, height };
  }

  return null;
}

export function detectImage(buffer: Buffer): DetectedImage | null {
  if (!buffer.length) return null;

  const png = readPngDimensions(buffer);
  if (png) {
    return { mime: UPLOAD_IMAGE_MIME.png, ext: 'png', ...png };
  }

  const gif = readGifDimensions(buffer);
  if (gif) {
    return { mime: UPLOAD_IMAGE_MIME.gif, ext: 'gif', ...gif };
  }

  const jpeg = readJpegDimensions(buffer);
  if (jpeg) {
    return { mime: UPLOAD_IMAGE_MIME.jpeg, ext: 'jpg', ...jpeg };
  }

  const webp = readWebpDimensions(buffer);
  if (webp) {
    return { mime: UPLOAD_IMAGE_MIME.webp, ext: 'webp', ...webp };
  }

  return null;
}

export type ValidateUploadImageOptions = {
  maxBytes: number;
  allowedMime: UploadImageMime[];
  maxWidth?: number;
  maxHeight?: number;
  maxPixels?: number;
  /** 浏览器声明的 MIME，需与魔数一致 */
  declaredMime?: string | null;
};

export type ValidateUploadImageResult =
  | { ok: true; detected: DetectedImage }
  | { ok: false; error: string };

export function validateUploadImage(
  buffer: Buffer,
  options: ValidateUploadImageOptions
): ValidateUploadImageResult {
  if (buffer.length > options.maxBytes) {
    return { ok: false, error: `File size exceeds ${Math.round(options.maxBytes / (1024 * 1024))}MB limit` };
  }

  const detected = detectImage(buffer);
  if (!detected) {
    return { ok: false, error: 'Unrecognized or invalid image file' };
  }

  if (!options.allowedMime.includes(detected.mime)) {
    return { ok: false, error: 'Image type not allowed for this upload' };
  }

  const declared = options.declaredMime?.trim().toLowerCase();
  if (declared && declared !== detected.mime) {
    return { ok: false, error: 'File content does not match declared type' };
  }

  const limits = getUploadImageLimits();
  const maxW = options.maxWidth ?? limits.maxWidth;
  const maxH = options.maxHeight ?? limits.maxHeight;
  const maxPx = options.maxPixels ?? limits.maxPixels;

  if (detected.width > maxW || detected.height > maxH) {
    return {
      ok: false,
      error: `Image dimensions exceed ${maxW}×${maxH}px`,
    };
  }

  if (detected.width * detected.height > maxPx) {
    return { ok: false, error: 'Image pixel count exceeds limit' };
  }

  return { ok: true, detected };
}
