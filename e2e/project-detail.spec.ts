import { test, expect } from '@playwright/test';

const PROJECTS = [
  { id: '1', name: '智能垃圾分类助手', intro: '基于计算机视觉的垃圾自动分类系统' },
  { id: '2', name: '社区互助养老平台', intro: '连接社区老年人与志愿者的服务平台' },
  { id: '3', name: 'VR虚拟博物馆', intro: '足不出户游览世界名馆' },
  { id: '4', name: '智慧农业监测系统', intro: '实时监控农田环境数据' },
  { id: '5', name: '校园二手交易集市', intro: '打造安全便捷的校园闲置物品流转平台' },
] as const;

test.describe('作品详情页', () => {
  test('应展示作品标题、简介与点赞按钮', async ({ page }) => {
    await page.goto('/zh/project/1');
    await expect(page).toHaveURL(/\/zh\/project\/1/);
    await expect(page.getByRole('heading', { name: '智能垃圾分类助手' })).toBeVisible();
    await expect(page.getByText('基于计算机视觉的垃圾自动分类系统')).toBeVisible();
    await expect(page.getByRole('button', { name: /为作品点赞|已点赞/ })).toBeVisible();
    await expect(page.getByRole('link', { name: '返回列表' })).toBeVisible();
  });

  for (const { id, name, intro } of PROJECTS) {
    test(`作品 ${id} (${name}) 详情页应正确展示`, async ({ page }) => {
      await page.goto(`/zh/project/${id}`);
      await expect(page).toHaveURL(new RegExp(`/zh/project/${id}`));
      await expect(page.getByRole('heading', { name })).toBeVisible();
      await expect(page.getByText(intro)).toBeVisible();
      await expect(page.getByRole('button', { name: /为作品点赞|已点赞/ })).toBeVisible();
    });
  }

  test('返回列表应回到首页', async ({ page }) => {
    await page.goto('/zh/project/1');
    await page.getByRole('link', { name: '返回列表' }).click();
    await expect(page).toHaveURL(/\/zh$/);
    await expect(page.getByRole('heading', { name: /Ship Faster|TRAE/i })).toBeVisible();
  });

  test('详情页应展示体验 Demo、代码仓库等操作按钮', async ({ page }) => {
    await page.goto('/zh/project/1');
    await expect(page.getByRole('button', { name: '体验 Demo' })).toBeVisible();
    await expect(page.getByRole('button', { name: '代码仓库' })).toBeVisible();
    await expect(page.getByRole('button', { name: '分享卡片' })).toBeVisible();
  });

  test('未登录点击点赞应跳转登录页并显示提示', async ({ page }) => {
    await page.goto('/zh/project/1');
    await page.getByRole('button', { name: /为作品点赞|已点赞/ }).click();
    await expect(page).toHaveURL(/\/sign-in|\/zh\/sign-in/);
    await expect(page.getByText(/请先登录|登录|Sign in/i)).toBeVisible();
  });

  test('不存在的作品 id 应显示未找到', async ({ page }) => {
    await page.goto('/zh/project/999');
    await expect(page.getByText('项目未找到')).toBeVisible();
    await expect(page.getByRole('link', { name: '返回首页' })).toBeVisible();
  });
});
