import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh');
  });

  test('应展示 TRAE DEMO WALL 标题与作品列表', async ({ page }) => {
    await expect(page).toHaveURL(/\/zh/);
    await expect(page.getByRole('heading', { name: /Ship Faster with|TRAE/i })).toBeVisible();
    await expect(page.getByText('提交我的作品')).toBeVisible();
    await expect(page.getByText('浏览作品')).toBeVisible();
    await expect(page.getByRole('button', { name: '最新' })).toBeVisible();
    await expect(page.getByRole('button', { name: '点赞' })).toBeVisible();
    await expect(page.getByRole('button', { name: '热门' })).toBeVisible();
    const cards = page.getByRole('link', { name: /查看详情/ });
    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(5);
  });

  test('点击作品卡片应进入详情页', async ({ page }) => {
    await page.getByRole('link', { name: /智能垃圾分类助手.*查看详情/ }).first().click();
    await expect(page).toHaveURL(/\/zh\/project\/1/);
    await expect(page.getByRole('heading', { name: '智能垃圾分类助手' })).toBeVisible();
    await expect(page.getByText('为作品点赞')).toBeVisible();
  });

  test('搜索框输入应筛选作品列表', async ({ page }) => {
    await expect(page.getByPlaceholder('搜索项目...')).toBeVisible();
    await page.getByPlaceholder('搜索项目...').fill('垃圾分类');
    await page.waitForLoadState('networkidle');
    const cards = page.getByRole('link', { name: /查看详情/ });
    await expect(cards).toHaveCount(1);
    await expect(page.getByRole('link', { name: /智能垃圾分类助手/ })).toBeVisible();
  });

  test('搜索无结果时应显示清除筛选', async ({ page }) => {
    await page.getByPlaceholder('搜索项目...').fill('不存在的项目名xyz');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('没有找到符合条件的项目')).toBeVisible();
    await expect(page.getByRole('button', { name: '清除筛选条件' })).toBeVisible();
  });

  test('点击类型筛选应过滤作品', async ({ page }) => {
    await page.getByRole('button', { name: '智能助手' }).click();
    await page.waitForLoadState('networkidle');
    const cards = page.getByRole('link', { name: /查看详情/ });
    await expect(cards).toHaveCount(1);
    await expect(page.getByRole('link', { name: /智能垃圾分类助手/ })).toBeVisible();
  });

  test('切换排序为点赞、热门后列表仍为 5 条', async ({ page }) => {
    await page.getByRole('button', { name: '点赞' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: /查看详情/ })).toHaveCount(5);
    await page.getByRole('button', { name: '热门' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: /查看详情/ })).toHaveCount(5);
  });

  test('导航链接提交可点击并跳转（可能进入提交页或登录页）', async ({ page }) => {
    await page.getByRole('link', { name: '提交' }).first().click();
    await expect(page).toHaveURL(/\/(zh\/)?(submit|sign-in)/);
  });
});
