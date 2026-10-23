/**
 * 海报 SVG 合成逻辑（共享库）
 *
 * 竖版模板 283.46×425.2（2:3），运行时注入封面/标题/简介/二维码。
 * 供海报制作页实时预览、橱窗列表、详情页、个人主页复用。
 */

import { posterAssets } from '@/lib/poster/assets';

export const POSTER_W = 283.46;
export const POSTER_H = 425.2;

const FONT_STACK =
  "c, t, 'JetBrains Mono', 'Source Han Sans CN', 'PingFang SC', 'Microsoft YaHei', sans-serif";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

let templateCache: string | null = null;
const coverCache = new Map<string, string>();

export interface PosterComposeOptions {
  nickname: string;
  description?: string | null;
  coverDataUrl?: string;
  demoUrl: string;
  fallbackTitle?: string;
  anonymousLabel?: string;
  qrText?: string;
}

export async function fetchPosterTemplate(): Promise<string> {
  if (templateCache) return templateCache;
  try {
    const res = await fetch(posterAssets.template);
    if (res.ok) {
      templateCache = await res.text();
      return templateCache;
    }
  } catch {
    // 模板加载失败时返回空，compose 会使用兜底底图
  }
  return '';
}

export async function fetchCoverDataUrl(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';
  const cached = coverCache.get(imageUrl);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(`/api/cover-proxy?url=${encodeURIComponent(imageUrl)}`);
    if (res.ok) {
      const dataUrl = await res.text();
      coverCache.set(imageUrl, dataUrl);
      return dataUrl;
    }
  } catch {
    // 代理失败时返回空，compose 会使用深色底
  }
  coverCache.set(imageUrl, '');
  return '';
}

export async function generateQrSvg(url: string): Promise<{ svg: string; viewBox: string }> {
  try {
    const QRCode = (await import('qrcode')).default;
    const raw = await QRCode.toString(url || 'https://traedemos.com', {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
    });
    const viewBoxMatch = raw.match(/viewBox="([^"]*)"/u);
    const svg = raw
      .replace(/<\?xml[^>]*\?>\s*/u, '')
      .replace(/\sxmlns="[^"]*"/u, '')
      .replace(/\sviewBox="[^"]*"/u, '');
    return { svg, viewBox: viewBoxMatch ? viewBoxMatch[1] : '' };
  } catch {
    return { svg: '', viewBox: '' };
  }
}

export function composePosterSvg(
  template: string,
  options: PosterComposeOptions,
  qr: { svg: string; viewBox: string }
): string {
  const {
    nickname,
    description,
    coverDataUrl,
    fallbackTitle = '我的作品',
    anonymousLabel = '匿名用户',
    qrText = '扫码浏览作品',
  } = options;

  const bgLayer = coverDataUrl
    ? `<image width="${POSTER_W}" height="${POSTER_H}" preserveAspectRatio="xMidYMid slice" href="${coverDataUrl}" xlink:href="${coverDataUrl}"/>`
    : `<rect width="${POSTER_W}" height="${POSTER_H}" fill="#1a1d23"/>`;

  let base = template;
  if (base) {
    base = base.replace(
      /(<g style="clip-path: url\(#clippath\);">[\s\S]*?)(<\/g>)/u,
      (_m, groupHead, groupClose) => groupHead + bgLayer + groupClose
    );
  } else {
    base = `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_W}" height="${POSTER_H}" viewBox="0 0 ${POSTER_W} ${POSTER_H}">${bgLayer}</svg>`;
  }

  const title = (nickname || fallbackTitle).slice(0, 21);
  const titleSvg = `<text x="24.6" y="304.8" fill="#ffffff" font-size="10" font-weight="800" font-family="${FONT_STACK}">${escapeXml(title)}</text>`;

  const intro = description || '';
  const introLines: string[] = [];
  for (let i = 0; i < intro.length && introLines.length < 3; i += 29) {
    introLines.push(intro.slice(i, i + 29));
  }
  const introSvg = introLines
    .map(
      (line, idx) =>
        `<text x="21.9" y="${330.5 + idx * 12.3}" fill="#1f2937" font-size="8" font-weight="700" font-family="${FONT_STACK}">${escapeXml(line)}</text>`
    )
    .join('\n  ');

  const authorLine = (nickname || anonymousLabel).slice(0, 15);
  const qrCardSvg = qr.svg
    ? `
  <g>
    <rect x="223.19" y="368.48" width="41.23" height="43.56" rx="2.47" fill="#ffffff"/>
    <g transform="translate(225.8, 372.26)"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="${qr.viewBox}"${qr.svg.slice('<svg'.length)}</g>
    <text x="218" y="399" text-anchor="end" fill="#4b5563" font-size="8" font-weight="700" font-family="${FONT_STACK}">${escapeXml(qrText)}</text>
    <text x="218" y="410.5" text-anchor="end" fill="#111827" font-size="9" font-weight="800" font-family="${FONT_STACK}">@${escapeXml(authorLine)}</text>
  </g>`
    : '';

  return base.replace('</svg>', `\n  ${titleSvg}\n  ${introSvg}\n  ${qrCardSvg}\n</svg>`);
}

export async function buildPosterDataUrl(
  imageUrl: string,
  options: PosterComposeOptions
): Promise<string> {
  const [template, coverDataUrl, qr] = await Promise.all([
    fetchPosterTemplate(),
    fetchCoverDataUrl(imageUrl),
    generateQrSvg(options.demoUrl),
  ]);
  const svg = composePosterSvg(template, { ...options, coverDataUrl }, qr);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function downloadPosterPng(dataUrl: string, filename: string): Promise<void> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 1134;
  canvas.height = 1701;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(img, 0, 0, 1134, 1701);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to export poster');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
