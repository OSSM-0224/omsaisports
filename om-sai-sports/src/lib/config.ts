export const BRAND = {
  name: "OM SAI SPORTS",
  foundedYear: 2000,
  founder: "Yashwant Namdeo Mhatre",
  region: "Navi Mumbai, Maharashtra",
  address: "Plot 14, Sector 7, Panvel – Navi Mumbai, Maharashtra 410206",
  phoneDisplay: "+91 98200 00000",
  email: "hello@omsaisports.in",
  instagramHandle: "@omsaisports.in",
  instagramUrl: "https://instagram.com",
  whatsappNumber:
    (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ||
    "919820000000",
};

export const ENV_CONFIG = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "",
  supabaseAnonKey:
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "",
  cloudinaryCloudName:
    (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) || "",
  cloudinaryUploadPreset:
    (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined) || "",
  adminEmail:
    (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ||
    "admin@omsaisports.in",
};

export function hasSupabaseConfigured(): boolean {
  return Boolean(ENV_CONFIG.supabaseUrl && ENV_CONFIG.supabaseAnonKey);
}

export function hasCloudinaryConfigured(): boolean {
  return Boolean(
    ENV_CONFIG.cloudinaryCloudName && ENV_CONFIG.cloudinaryUploadPreset,
  );
}

export function buildWhatsAppUrl(message: string): string {
  const cleanNumber = BRAND.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function buildDesignInquiryMessage(
  designId: string,
  title: string,
): string {
  return `Hi, I liked design ${designId} – ${title} on your website. I'd like to know more.`;
}

export function generateNextDesignId(existingIds: string[]): string {
  const maxNum = existingIds.reduce((max, id) => {
    const match = id.match(/OSS-(\d+)/i);
    if (!match) return max;
    const parsed = parseInt(match[1], 10);
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 111);
  return `OSS-${String(maxNum + 1).padStart(4, "0")}`;
}
