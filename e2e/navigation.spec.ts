import { test, expect } from '@playwright/test';

test.describe('导航与流程', () => {
  test('首页 -> 作品详情 -> 返回列表 完整流程', async ({ page }) => {
    await page.goto('/zh');
    await expect(page).toHaveURL(/\/zh/);
    await page.getByRole('link', { name: /社区互助养老平台.*查看详情/ }).first().click();
    await expect(page).toHaveURL(/\/zh\/project\/2/);
    await expect(page.getByRole('heading', { name: '社区互助养老平台' })).toBeVisible();
    await page.getByRole('link', { name: '返回列表' }).click();
    await expect(page).toHaveURL(/\/zh$/);
    await expect(page.getByRole('link', { name: /查看详情/ })).toHaveCount(5);
  });

  test('直接访问 /zh 应展示中文首页', async ({ page }) => {
    await page.goto('/zh');
    await expect(page).toHaveURL(/\/zh/);
    await expect(page.getByText('提交我的作品')).toBeVisible();
    await expect(page.getByText('浏览作品')).toBeVisible();
  });

  test('顶部导航应包含首页、提交、控制台', async ({ page }) => {
    await page.goto('/zh');
    await expect(page.getByRole('link', { name: '首页' })).toBeVisible();
    await expect(page.getByRole('link', { name: '提交' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: '控制台' })).toBeVisible();
  });
});
