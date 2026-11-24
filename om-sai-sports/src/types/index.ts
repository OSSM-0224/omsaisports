export type DesignCategory =
  | "School"
  | "College"
  | "Club"
  | "Cricket"
  | "Football"
  | "Kabaddi"
  | "Running"
  | "Custom";

export interface JerseyDesign {
  id: string;
  designId: string; // e.g., OSS-0123
  title: string;
  category: DesignCategory;
  description: string;
  imageUrl: string;
  backImageUrl?: string;
  sideImageUrl?: string;
  madeFor?: string;
  seasonYear?: string;
  accentColor?: string;
  colors?: string[];
  fabric: string;
  createdAt: string;
  isNew: boolean;
  featured: boolean;
}

export interface ClientItem {
  id: string;
  name: string;
  logoUrl?: string;
  since?: string;
}

export interface FactItem {
  id: string;
  number: string;
  label: string;
  detail: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  caption: string;
  imageUrl: string;
  imageAlt: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: "info" | "success" | "error";
}

export interface SiteSettings {
  id: string;
  heroVideoUrl: string;
  heroMobileVideoUrl?: string;
  heroPosterUrl: string;
  heroUseVideo: boolean;
}
