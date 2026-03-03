import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh-CN', 'en-US', 'ja-JP'],
  defaultLocale: 'zh-CN'
});
