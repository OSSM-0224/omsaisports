export type DesignCategory = "sports" | "festival" | "commercial";

export interface JerseyDesign {
  id: string;
  title: string;
  category: DesignCategory;
  image: string;
  thumb: string;
  accent: string;
  silhouette?: "athletic" | "oversized" | "polo";
}

interface DesignManifest {
  designs: JerseyDesign[];
}

let manifestPromise: Promise<JerseyDesign[]> | null = null;

/** Loads the design manifest once. Adding a design only needs a manifest entry. */
export function getDesigns(): Promise<JerseyDesign[]> {
  if (!manifestPromise) {
    manifestPromise = fetch("/designs/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Design manifest failed: ${response.status}`);
        return response.json() as Promise<DesignManifest>;
      })
      .then((data) => (Array.isArray(data.designs) ? data.designs : []))
      .catch((error: unknown) => {
        manifestPromise = null;
        throw error;
      });
  }
  return manifestPromise;
}
