'use client';

import dynamic from 'next/dynamic';

/** 主内容加载后再拉取盲盒挂件（独立 chunk，不阻塞首屏） */
export const CodeBlindBoxLauncher = dynamic(
  () => import('./code-blind-box-entry').then((mod) => mod.CodeBlindBoxEntry),
  { ssr: false }
);
