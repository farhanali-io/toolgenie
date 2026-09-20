export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolItem {
  name: string;
  slug: string;
  icon: string;
  shortDescription: string;
  longDescription: string;
  status: "live" | "coming-soon";
  faqs: ToolFaq[];
  categoryName?: string;
  categorySlug?: string;
  categoryAccentColor?: string;
}

export interface CategoryItem {
  name: string;
  slug: string;
  accentColor: string;
  status: "live" | "coming-soon";
  description: string;
  tools: ToolItem[];
}

export type ThemeId = 
  | "light" 
  | "dark" 
  | "midnight" 
  | "emerald" 
  | "sunset" 
  | "rose-gold" 
  | "cyberpunk";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  type: "light" | "dark";
  accent: string;
  bgSample: string;
  description: string;
}

