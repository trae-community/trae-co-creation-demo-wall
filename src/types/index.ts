export interface Project {
  id: string;
  name: string;
  intro: string;
  city: string;
  team?: string | null; // Changed from string[] to string | null (JSON stringified array or plain string)
  coverUrl: string;
  story?: string;
  features?: string;
  scenarios?: string;
  screenshots?: string[];
  techStack?: string;
  demoUrl?: string;
  repoUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isCitySelection?: boolean;
  isCommunityRecommended?: boolean;
  createdAt: Date | string; // Updated to accept Date object from Prisma
  views: number;
  likes: number;
  category: string;
  tags: string[];
  country: string;
  author: {
    name: string;
    avatar: string | null;
  };
}

export interface SubmissionFormData {
  name: string;
  intro: string;
  city: string;
  team: string; // Comma separated string for input, array for storage
  coverUrl: string; // URL input for simplicity
  story: string;
  features: string;
  scenarios: string;
  screenshots: string; // Comma separated URLs
  techStack: string;
  demoUrl: string;
  repoUrl?: string;
  category: string;
  tags: string;
  country: string;
}

export const COUNTRY_CITY_MAP: Record<string, string[]> = {
  "中国": ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安"],
  "美国": ["旧金山", "纽约", "西雅图", "硅谷"],
  "日本": ["东京", "大阪"],
  "新加坡": ["新加坡"],
};

export const CITIES = Object.values(COUNTRY_CITY_MAP).flat();

export const CATEGORIES = [
  "实用工具",
  "场景应用",
  "智能助手",
  "内容创作",
  "创意实验",
  "其他类型",
];

export const TAGS = [
  "自动化",
  "多模态",
  "对话交互",
  "内容生成",
  "数据处理",
  "工作流",
  "办公效率",
  "学习辅助",
  "企业应用",
  "内容创作",
  "个人工具",
  "已上线",
  "开源",
  "持续更新",
];

export interface Tag {
  id: number;
  name: string;
}

export interface DictionaryItem {
  id: string;
  dictCode: string;
  itemLabel: string;
  itemValue: string;
  sortOrder: number;
  lang: string;
}

export const COUNTRIES = Object.keys(COUNTRY_CITY_MAP);
