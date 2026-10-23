/** 分享海报静态资源（public/posters） */
export const POSTER_PUBLIC_BASE = '/posters';

export const posterAssets = {
  template: `${POSTER_PUBLIC_BASE}/poster-template.svg`,
  defaultCover: (index: number) =>
    `${POSTER_PUBLIC_BASE}/poster-default-${index}.jpg`,
};
