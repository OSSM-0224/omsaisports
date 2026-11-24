import type {
  ClientItem,
  FactItem,
  JerseyDesign,
  SiteSettings,
} from "../types/index";
import {
  ENV_CONFIG,
  hasCloudinaryConfigured,
  hasSupabaseConfigured,
} from "./config.ts";
import {
  HERO_DEFAULT_POSTER,
  SEED_CLIENTS,
  SEED_DESIGNS,
  SEED_FACTS,
  SEED_SITE_SETTINGS,
} from "./seedData.ts";

const STORAGE_KEYS = {
  designs: "oss_showcase_designs_v2",
  clients: "oss_showcase_clients_v1",
  facts: "oss_showcase_facts_v1",
  siteSettings: "oss_site_settings_v1",
  adminSession: "oss_admin_session_v1",
};

interface SupabaseDesignRow {
  id: string;
  design_id?: string;
  designId?: string;
  title: string;
  category: JerseyDesign["category"];
  description?: string;
  image_url?: string;
  front_image_url?: string;
  imageUrl?: string;
  back_image_url?: string;
  backImageUrl?: string;
  side_image_url?: string;
  sideImageUrl?: string;
  made_for?: string;
  madeFor?: string;
  season_year?: string;
  seasonYear?: string;
  accent_color?: string;
  accentColor?: string;
  colors?: string[];
  fabric?: string;
  created_at?: string;
  createdAt?: string;
  is_new?: boolean;
  isNew?: boolean;
  is_featured?: boolean;
  featured?: boolean;
}

interface SupabaseSiteSettingsRow {
  id?: string;
  hero_video_url?: string;
  heroVideoUrl?: string;
  hero_mobile_video_url?: string;
  heroMobileVideoUrl?: string;
  hero_poster_url?: string;
  heroPosterUrl?: string;
  hero_use_video?: boolean;
  heroUseVideo?: boolean;
}

function normalizeDesignRow(row: SupabaseDesignRow): JerseyDesign {
  const colors = Array.isArray(row.colors) ? row.colors : undefined;
  const resolvedAccent = row.accent_color || row.accentColor || colors?.[0];

  return {
    id: row.id,
    designId: row.design_id || row.designId || row.id.toUpperCase(),
    title: row.title,
    category: row.category,
    description: row.description || "",
    imageUrl: row.front_image_url || row.image_url || row.imageUrl || "",
    backImageUrl: row.back_image_url || row.backImageUrl || undefined,
    sideImageUrl: row.side_image_url || row.sideImageUrl || undefined,
    madeFor: row.made_for || row.madeFor || undefined,
    seasonYear: row.season_year || row.seasonYear || undefined,
    accentColor: resolvedAccent || undefined,
    colors,
    fabric: row.fabric || "160 GSM Dot-Knit Dry-Fit",
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    isNew: row.is_new ?? row.isNew ?? false,
    featured: row.is_featured ?? row.featured ?? false,
  };
}

function normalizeSiteSettingsRow(row: SupabaseSiteSettingsRow): SiteSettings {
  return {
    id: row.id || "default",
    heroVideoUrl: row.hero_video_url ?? row.heroVideoUrl ?? "",
    heroMobileVideoUrl:
      row.hero_mobile_video_url ?? row.heroMobileVideoUrl ?? "",
    heroPosterUrl:
      row.hero_poster_url || row.heroPosterUrl || HERO_DEFAULT_POSTER,
    heroUseVideo: row.hero_use_video ?? row.heroUseVideo ?? false,
  };
}

export function getResponsiveImageUrl(url: string, width = 800): string {
  if (
    !url ||
    !url.includes("res.cloudinary.com") ||
    !url.includes("/upload/")
  ) {
    return url;
  }
  return url.replace(
    /\/upload\/(?:[^/]+\/)?/,
    `/upload/f_auto,q_auto,w_${width}/`,
  );
}

export function getHeroVideoSources(
  videoUrl: string,
  mobileVideoUrl: string | undefined,
  isSmallMobile: boolean,
): { mp4?: string; webm?: string; hasLightMobileSource: boolean } {
  const cleanDesktop = videoUrl.trim();
  const cleanMobile = (mobileVideoUrl || "").trim();

  if (isSmallMobile) {
    if (cleanMobile) {
      return {
        mp4: cleanMobile,
        webm: cleanMobile.includes("res.cloudinary.com")
          ? cleanMobile.replace(
              /\/upload\/(?:[^/]+\/)?/,
              "/upload/f_webm,q_auto:eco,w_720,vc_auto/",
            )
          : undefined,
        hasLightMobileSource: true,
      };
    }
    if (
      cleanDesktop.includes("res.cloudinary.com") &&
      cleanDesktop.includes("/video/upload/")
    ) {
      return {
        mp4: cleanDesktop.replace(
          /\/upload\/(?:[^/]+\/)?/,
          "/upload/f_mp4,q_auto:eco,w_720,vc_auto/",
        ),
        webm: cleanDesktop.replace(
          /\/upload\/(?:[^/]+\/)?/,
          "/upload/f_webm,q_auto:eco,w_720,vc_auto/",
        ),
        hasLightMobileSource: true,
      };
    }
    return { hasLightMobileSource: false };
  }

  if (!cleanDesktop) return { hasLightMobileSource: false };

  if (
    cleanDesktop.includes("res.cloudinary.com") &&
    cleanDesktop.includes("/video/upload/")
  ) {
    return {
      mp4: cleanDesktop.replace(
        /\/upload\/(?:[^/]+\/)?/,
        "/upload/f_mp4,q_auto:good,vc_auto/",
      ),
      webm: cleanDesktop.replace(
        /\/upload\/(?:[^/]+\/)?/,
        "/upload/f_webm,q_auto:good,vc_auto/",
      ),
      hasLightMobileSource: true,
    };
  }

  if (cleanDesktop.toLowerCase().endsWith(".webm")) {
    return {
      webm: cleanDesktop,
      mp4: cleanDesktop,
      hasLightMobileSource: false,
    };
  }

  return { mp4: cleanDesktop, hasLightMobileSource: false };
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues in restricted browsers
  }
}

async function supabaseFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  if (!hasSupabaseConfigured()) return null;
  try {
    const res = await fetch(`${ENV_CONFIG.supabaseUrl}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: ENV_CONFIG.supabaseAnonKey,
        Authorization: `Bearer ${ENV_CONFIG.supabaseAnonKey}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadInitialShowcaseData(): Promise<{
  designs: JerseyDesign[];
  clients: ClientItem[];
  facts: FactItem[];
  siteSettings: SiteSettings;
}> {
  if (hasSupabaseConfigured()) {
    const [remoteDesigns, remoteClients, remoteFacts, remoteSettings] =
      await Promise.all([
        supabaseFetch<SupabaseDesignRow[]>(
          "designs?select=*&order=created_at.desc",
        ),
        supabaseFetch<ClientItem[]>("clients?select=*"),
        supabaseFetch<FactItem[]>("facts?select=*"),
        supabaseFetch<SupabaseSiteSettingsRow[]>(
          "site_settings?select=*&id=eq.default&limit=1",
        ),
      ]);

    const localSettings = safeRead<SiteSettings>(
      STORAGE_KEYS.siteSettings,
      SEED_SITE_SETTINGS,
    );
    const resolvedSettings =
      remoteSettings && remoteSettings.length > 0
        ? normalizeSiteSettingsRow(remoteSettings[0])
        : localSettings;

    if (remoteDesigns && remoteDesigns.length > 0) {
      return {
        designs: remoteDesigns.map(normalizeDesignRow),
        clients:
          remoteClients && remoteClients.length > 0
            ? remoteClients
            : SEED_CLIENTS,
        facts: remoteFacts && remoteFacts.length > 0 ? remoteFacts : SEED_FACTS,
        siteSettings: resolvedSettings,
      };
    }
  }

  const cachedDesigns = safeRead<JerseyDesign[]>(
    STORAGE_KEYS.designs,
    SEED_DESIGNS,
  ).map((d) => {
    const seedMatch = SEED_DESIGNS.find((s) => s.id === d.id);
    return {
      ...d,
      madeFor: d.madeFor ?? seedMatch?.madeFor,
      seasonYear: d.seasonYear ?? seedMatch?.seasonYear,
      accentColor: d.accentColor ?? d.colors?.[0] ?? seedMatch?.accentColor,
    };
  });

  return {
    designs: cachedDesigns,
    clients: safeRead<ClientItem[]>(STORAGE_KEYS.clients, SEED_CLIENTS),
    facts: safeRead<FactItem[]>(STORAGE_KEYS.facts, SEED_FACTS),
    siteSettings: safeRead<SiteSettings>(
      STORAGE_KEYS.siteSettings,
      SEED_SITE_SETTINGS,
    ),
  };
}

export function persistDesigns(designs: JerseyDesign[]): void {
  safeWrite(STORAGE_KEYS.designs, designs);
}

export function persistClients(clients: ClientItem[]): void {
  safeWrite(STORAGE_KEYS.clients, clients);
}

export function persistFacts(facts: FactItem[]): void {
  safeWrite(STORAGE_KEYS.facts, facts);
}

export function persistSiteSettings(settings: SiteSettings): void {
  safeWrite(STORAGE_KEYS.siteSettings, settings);
  if (hasSupabaseConfigured()) {
    void supabaseFetch("site_settings", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: settings.id || "default",
        hero_video_url: settings.heroVideoUrl,
        hero_mobile_video_url: settings.heroMobileVideoUrl || "",
        hero_poster_url: settings.heroPosterUrl,
        hero_use_video: settings.heroUseVideo,
        updated_at: new Date().toISOString(),
      }),
    });
  }
}

export function resetAllToSeed(): {
  designs: JerseyDesign[];
  clients: ClientItem[];
  facts: FactItem[];
  siteSettings: SiteSettings;
} {
  persistDesigns(SEED_DESIGNS);
  persistClients(SEED_CLIENTS);
  persistFacts(SEED_FACTS);
  persistSiteSettings(SEED_SITE_SETTINGS);
  return {
    designs: SEED_DESIGNS,
    clients: SEED_CLIENTS,
    facts: SEED_FACTS,
    siteSettings: SEED_SITE_SETTINGS,
  };
}

export function getAdminSession(): boolean {
  return safeRead<boolean>(STORAGE_KEYS.adminSession, false);
}

export function setAdminSession(loggedIn: boolean): void {
  safeWrite(STORAGE_KEYS.adminSession, loggedIn);
}

export async function uploadImageAsset(file: File): Promise<string> {
  if (hasCloudinaryConfigured()) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", ENV_CONFIG.cloudinaryUploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${ENV_CONFIG.cloudinaryCloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }
    const json = (await res.json()) as { secure_url?: string };
    if (json.secure_url) {
      return json.secure_url.replace(
        "/upload/",
        "/upload/f_auto,q_auto,w_1200/",
      );
    }
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read file"));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadVideoAsset(
  file: File,
): Promise<{ url: string; persistedLocally: boolean }> {
  if (hasCloudinaryConfigured()) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", ENV_CONFIG.cloudinaryUploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${ENV_CONFIG.cloudinaryCloudName}/video/upload`,
      { method: "POST", body: formData },
    );
    if (!res.ok) {
      throw new Error("Cloudinary video upload failed");
    }
    const json = (await res.json()) as { secure_url?: string };
    if (json.secure_url) {
      return { url: json.secure_url, persistedLocally: true };
    }
  }

  if (file.size <= 2 * 1024 * 1024) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Could not read video file"));
      };
      reader.onerror = () => reject(new Error("Could not read video file"));
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, persistedLocally: true };
  }

  return {
    url: URL.createObjectURL(file),
    persistedLocally: false,
  };
}
