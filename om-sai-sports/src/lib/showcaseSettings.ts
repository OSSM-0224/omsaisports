export const DEFAULT_COLLAR_COLOR = "#ff5a24";

const HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i;

let collarColorPromise: Promise<string> | null = null;

/**
 * Edit public/designs/settings.json to change the collar/placket colour.
 * The same value drives the 3D material and the swatch in the showcase UI.
 */
export function getCollarColor(): Promise<string> {
  if (!collarColorPromise) {
    collarColorPromise = fetch("/designs/settings.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Settings failed: ${response.status}`);
        return response.json() as Promise<{ collarColor?: unknown }>;
      })
      .then((data) => {
        const value = typeof data.collarColor === "string" ? data.collarColor.trim() : "";
        return HEX_COLOR.test(value) ? value : DEFAULT_COLLAR_COLOR;
      })
      .catch(() => DEFAULT_COLLAR_COLOR);
  }
  return collarColorPromise;
}
