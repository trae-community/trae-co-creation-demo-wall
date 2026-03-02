import { test, expect } from '@playwright/test';

test.describe('统计与浏览 API', () => {
  test('GET /api/works/stats?ids=1,2,3 应返回 200 及各作品统计', async ({ request }) => {
    const res = await request.get('/api/works/stats?ids=1,2,3');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('1');
    expect(data).toHaveProperty('2');
    expect(data).toHaveProperty('3');
    expect(data['1']).toMatchObject({ viewCount: expect.any(Number), likeCount: expect.any(Number) });
    expect(data['2']).toMatchObject({ viewCount: expect.any(Number), likeCount: expect.any(Number) });
    expect(data['3']).toMatchObject({ viewCount: expect.any(Number), likeCount: expect.any(Number) });
  });

  test('GET /api/works/[id]/stats 应返回 viewCount、likeCount、liked', async ({ request }) => {
    const res = await request.get('/api/works/1/stats');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('viewCount', expect.any(Number));
    expect(data).toHaveProperty('likeCount', expect.any(Number));
    expect(data).toHaveProperty('liked', expect.any(Boolean));
  });

  test('POST /api/works/[id]/view 未登录应成功（仅记录浏览）', async ({ request }) => {
    const res = await request.post('/api/works/1/view');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('ok', true);
  });

  test('POST /api/works/[id]/like 未登录应返回 401', async ({ request }) => {
    const res = await request.post('/api/works/1/like');
    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data).toHaveProperty('code', 'LOGIN_REQUIRED');
  });
});
