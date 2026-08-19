import { NextRequest, NextResponse } from 'next/server';

/**
 * 封面图代理：服务端 fetch 外部图床图片，返回 base64 data URL。
 * 彻底绕过浏览器 CORS 限制，分享卡片海报生成不再依赖图床 CORS 配置。
 *
 * GET /api/cover-proxy?url=<encoded-image-url>
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // 仅允许 http/https 协议，防止 SSRF
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid URL scheme' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TraeDemoWall/1.0)',
      },
      // 服务端 fetch 不受浏览器 CORS 限制
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString('base64');

    return new NextResponse(`data:${contentType};base64,${base64}`, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }
}
