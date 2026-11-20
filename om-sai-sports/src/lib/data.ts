import type { Client, Design } from "../types";
import { supabase } from "./supabase";

const pics = [
  "photo-1523398002811-999ca8dec234", "photo-1576566588028-4147f3842f27", "photo-1517466787929-bc90951d0974",
  "photo-1517649763962-0c623066013b", "photo-1579952363873-27f3bade9f55", "photo-1521412644187-c49fa049e84d",
  "photo-1519861531473-9200262188bf", "photo-1577223625816-7546f13df25d", "photo-1540747913346-19e32dc3e97e",
  "photo-1566577739112-5180d4bf9390", "photo-1517466787929-bc90951d0974", "photo-1579952363873-27f3bade9f55"
];
const titles = ["Match Day Energy", "The School Spirit", "Built for the Game", "Weekend Warriors", "All In, Together", "Fast. Focused. Fearless", "Home Ground", "The Winning Eleven", "Team First", "Made to Move", "Club Colours", "The Big Match"];
const cats = ["Cricket", "School", "Football", "Club", "College", "Running", "Kabaddi", "Football", "School", "Custom", "Club", "Cricket"] as const;

export const seedDesigns: Design[] = pics.map((p, i) => ({
  id: `OSS-${String(124 - i).padStart(4, "0")}`,
  title: titles[i],
  category: cats[i],
  description: "A custom teamwear concept made for movement, identity and the moments that bring a team together.",
  imageUrl: `https://images.unsplash.com/${p}?auto=format&fit=crop&w=1000&q=85`,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  featured: i < 3,
  alt: `${titles[i]} custom sportswear design`
}));

export const clients: Client[] = ["MNR", "NHPS", "St Augustine", "St Xavier’s", "Ryan International", "Vishwajyot", "Apeejay", "Uran Education", "Don Bosco", "Reliance", "Hiranandani", "CCHS", "Sterling", "BVPT", "Saraswati College", "SNG International School", "Pillai College", "Cambridge", "Indo Scot", "St Mary Convent", "Higher School Alibaug"].map((name, i) => ({ id: String(i), name }));

type DesignRow = {
  design_id: string; title: string; category: Design["category"]; description: string | null;
  image_url: string; created_at: string; featured: boolean | null; alt_text: string | null;
};

type GetDesignOptions = { seedFallback?: boolean };

export async function getDesigns({ seedFallback = true }: GetDesignOptions = {}): Promise<Design[]> {
  if (!supabase) return seedFallback ? seedDesigns : [];
  const { data, error } = await supabase.from("designs").select("*").order("created_at", { ascending: false });
  if (error) {
    if (seedFallback) return seedDesigns;
    throw error;
  }
  if (!data?.length) return seedFallback ? seedDesigns : [];
  return (data as DesignRow[]).map((d) => ({
    id: d.design_id,
    title: d.title,
    category: d.category,
    description: d.description ?? "",
    imageUrl: d.image_url,
    createdAt: d.created_at,
    featured: d.featured ?? false,
    alt: d.alt_text ?? undefined
  }));
}

export async function saveDesign(d: Design) {
  if (!supabase) throw new Error("Connect Supabase to publish designs.");
  const { error } = await supabase.from("designs").upsert({
    design_id: d.id,
    title: d.title,
    category: d.category,
    description: d.description,
    image_url: d.imageUrl,
    created_at: d.createdAt,
    featured: d.featured,
    alt_text: d.alt
  }, { onConflict: "design_id" });
  if (error) throw error;
}

export async function deleteDesign(id: string) {
  if (!supabase) throw new Error("Connect Supabase first.");
  const { error } = await supabase.from("designs").delete().eq("design_id", id);
  if (error) throw error;
}
