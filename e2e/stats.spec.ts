import { test, expect } from '@playwright/test';

test.describe('浏览量与点赞统计', () => {
  test('详情页应能加载并显示点赞数', async ({ page }) => {
    await page.goto('/zh/project/1');
    await expect(page).toHaveURL(/\/zh\/project\/1/);
    const likeButton = page.getByRole('button', { name: /为作品点赞|已点赞/ });
    await expect(likeButton).toBeVisible();
    await expect(likeButton).toContainText(/\d+/);
  });

  test('首页作品卡片应显示浏览/点赞数字', async ({ page }) => {
    await page.goto('/zh');
    await page.waitForLoadState('networkidle');
    const firstCard = page.getByRole('link', { name: /智能垃圾分类助手.*查看详情/ }).first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toContainText(/\d+/);
  });
});
