import { create } from 'zustand';

type Language = 'zh' | 'en';

interface LanguageState {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'zh',
  toggleLanguage: () => set((state) => ({ language: state.language === 'zh' ? 'en' : 'zh' })),
  setLanguage: (lang) => set({ language: lang }),
}));
