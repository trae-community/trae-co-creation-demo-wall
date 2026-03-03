export interface Work {
  id: string;
  name: string;
  intro: string;
  city: string;
  team?: string[] | string | null;
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
