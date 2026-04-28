export interface Work {
  id: string;
  name: string;
  intro: string;
  city: string;
  country: string;
  category: string;
  team?: unknown;
  teamIntro?: string;
  contactEmail?: string;
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
  tags: string[];
  honors?: string[];
  author: {
    id?: string;
    name: string;
    avatar: string | null;
    email?: string | null;
    bio?: string | null;
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
  parentValue?: string; // For hierarchical relationships (e.g., city belongs to country)
  sortOrder: number;
  lang: string;
}
