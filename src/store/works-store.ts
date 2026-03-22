import { create } from 'zustand';
import { Work } from '@/lib/types';

export type ListCacheEntry = {
  items: Work[];
  total: number;
  totalPages: number;
};

type WorksStore = {
  // List cache: key = serialized query params string
  listCache: Map<string, ListCacheEntry>;
  setListCache: (key: string, entry: ListCacheEntry) => void;

  // Detail cache: key = workId string
  detailCache: Map<string, Work>;
  setDetailCache: (id: string, work: Work) => void;
  getDetailCache: (id: string) => Work | undefined;
};

export const useWorksStore = create<WorksStore>((set, get) => ({
  listCache: new Map(),
  setListCache: (key, entry) =>
    set((state) => {
      const next = new Map(state.listCache);
      next.set(key, entry);
      return { listCache: next };
    }),

  detailCache: new Map(),
  setDetailCache: (id, work) =>
    set((state) => {
      const next = new Map(state.detailCache);
      next.set(id, work);
      return { detailCache: next };
    }),
  getDetailCache: (id) => get().detailCache.get(id),
}));
