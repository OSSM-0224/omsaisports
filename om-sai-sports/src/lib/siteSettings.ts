import { supabase } from "./supabase";

export type SiteSettings = {
  hero_video_url: string;
  hero_poster_url: string;
  hero_use_video: boolean;
};

export const defaultSiteSettings: SiteSettings = {
  hero_video_url: "",
  hero_poster_url: "/hero-poster.svg",
  hero_use_video: false
};

type SettingsRow = {
  hero_video_url: string | null;
  hero_poster_url: string | null;
  hero_use_video: boolean | null;
};

type LoadOptions = { strict?: boolean };

export async function getSiteSettings({ strict = false }: LoadOptions = {}): Promise<SiteSettings> {
  if (!supabase) {
    if (strict) throw new Error("Connect Supabase to manage the hero background.");
    return defaultSiteSettings;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("hero_video_url, hero_poster_url, hero_use_video")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (strict) throw error;
    return defaultSiteSettings;
  }
  if (!data) return defaultSiteSettings;

  const row = data as SettingsRow;
  return {
    hero_video_url: row.hero_video_url?.trim() ?? "",
    hero_poster_url: row.hero_poster_url?.trim() || defaultSiteSettings.hero_poster_url,
    hero_use_video: Boolean(row.hero_use_video)
  };
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  if (!supabase) throw new Error("Connect Supabase before saving the hero background.");

  const { error } = await supabase.from("site_settings").upsert(
    {
      id: 1,
      hero_video_url: settings.hero_video_url.trim(),
      hero_poster_url: settings.hero_poster_url.trim(),
      hero_use_video: settings.hero_use_video,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}
