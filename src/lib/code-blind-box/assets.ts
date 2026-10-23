import type { BlindBoxDimension } from '@/lib/code-blind-box/words';

/** 1024 代码盲盒静态资源（public/box） */
export const BLIND_BOX_PUBLIC_BASE = '/box';

export const blindBoxAssets = {
  mascotInvite: `${BLIND_BOX_PUBLIC_BASE}/trae-bao.png`,
  mascotSelected: `${BLIND_BOX_PUBLIC_BASE}/trae-bao-selected.png`,
  bubbleTail: `${BLIND_BOX_PUBLIC_BASE}/bubble-tail.svg`,
  roundCardTexture: `${BLIND_BOX_PUBLIC_BASE}/round-card-texture.png`,
  radioEmpty: `${BLIND_BOX_PUBLIC_BASE}/radio-empty.svg`,
  radioSelected: `${BLIND_BOX_PUBLIC_BASE}/radio-selected.svg`,
  traeLogo: `${BLIND_BOX_PUBLIC_BASE}/trae-logo.svg`,
  traeLogoBack: `${BLIND_BOX_PUBLIC_BASE}/trae-logo-back.svg`,
  particles: [
    `${BLIND_BOX_PUBLIC_BASE}/particle-1.png`,
    `${BLIND_BOX_PUBLIC_BASE}/particle-2.png`,
    `${BLIND_BOX_PUBLIC_BASE}/particle-3.png`,
    `${BLIND_BOX_PUBLIC_BASE}/particle-4.png`,
  ] as const,
  keycap: {
    theme: {
      keycap: `${BLIND_BOX_PUBLIC_BASE}/keycap-theme.png`,
      glow: `${BLIND_BOX_PUBLIC_BASE}/glow-theme.svg`,
      letterImg: `${BLIND_BOX_PUBLIC_BASE}/letter-a.png`,
    },
    function: {
      keycap: `${BLIND_BOX_PUBLIC_BASE}/keycap-function.png`,
      glow: `${BLIND_BOX_PUBLIC_BASE}/glow-function.svg`,
      letterImg: `${BLIND_BOX_PUBLIC_BASE}/letter-b.png`,
    },
    style: {
      keycap: `${BLIND_BOX_PUBLIC_BASE}/keycap-style.png`,
      glow: `${BLIND_BOX_PUBLIC_BASE}/glow-style.svg`,
      letterImg: `${BLIND_BOX_PUBLIC_BASE}/letter-c.png`,
    },
  } satisfies Record<
    BlindBoxDimension,
    { keycap: string; glow: string; letterImg: string }
  >,
};
