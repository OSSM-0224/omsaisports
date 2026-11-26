import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();
const pending = new Map<string, Promise<THREE.Texture>>();
const loader = new THREE.TextureLoader();

/**
 * Loads a full design texture. Only the active design and its immediate
 * neighbours are ever requested; the cache is kept small on purpose.
 */
export function loadDesignTexture(url: string, anisotropy = 8): Promise<THREE.Texture> {
  const cached = cache.get(url);
  if (cached) return Promise.resolve(cached);

  const inFlight = pending.get(url);
  if (inFlight) return inFlight;

  const promise = loader
    .loadAsync(url)
    .then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      // glTF textures use a top-left UV origin and must not be flipped.
      // TextureLoader defaults to flipY=true, which would mirror the artwork.
      texture.flipY = false;
      texture.anisotropy = anisotropy;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      cache.set(url, texture);
      pending.delete(url);
      return texture;
    })
    .catch((error: unknown) => {
      pending.delete(url);
      throw error;
    });

  pending.set(url, promise);
  return promise;
}

export function preloadDesignTextures(urls: Array<string | undefined>, anisotropy = 8): void {
  for (const url of urls) {
    if (!url || cache.has(url) || pending.has(url)) continue;
    void loadDesignTexture(url, anisotropy).catch(() => {});
  }
}

/** Disposes textures that are no longer active/adjacent. */
export function pruneDesignTextures(keepUrls: string[]): void {
  const keep = new Set(keepUrls);
  for (const [url, texture] of cache) {
    if (keep.has(url)) continue;
    texture.dispose();
    cache.delete(url);
  }
}
