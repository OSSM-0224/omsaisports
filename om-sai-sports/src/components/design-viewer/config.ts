import type { JerseyDesign } from "../../lib/designs";

export type ViewerDesign = JerseyDesign & {
  hotspots?: Record<string, string>;
};

export type HotspotId = "collar" | "side" | "chest" | "hem";

export type CameraPreset =
  | "front"
  | "back"
  | "side"
  | "sidePanel"
  | "detail"
  | "home"
  | HotspotId;

export type HotspotConfig = {
  id: HotspotId;
  label: string;
  position: [number, number, number];
  normal: [number, number, number];
  cameraPreset: CameraPreset;
  note: string;
};

export type CameraPresetConfig = {
  position: [number, number, number];
  target: [number, number, number];
};

/** All stage offsets live here so the display can be tuned without touching JSX. */
export const STAGE_CONFIG = {
  jersey: {
    baseX: 0,
    baseY: -0.15,
  },
  stand: {
    baseY: -0.48,
    baseRadius: 0.55,
    baseHeight: 0.04,
    poleRadius: 0.025,
    poleHeight: 2.9,
    poleZ: -0.2,
    rimTube: 0.012,
  },
  camera: {
    position: [0, 1.35, 7.4] as [number, number, number],
    target: [0, 1.48, 0] as [number, number, number],
    fov: 34,
    minDistance: 1.6,
    maxDistance: 4.8,
    minPolarAngle: (65 * Math.PI) / 180,
    maxPolarAngle: (100 * Math.PI) / 180,
  },
  dust: {
    desktopCount: 40,
    mobileCount: 18,
    size: 2.6,
    speed: 0.16,
  },
} as const;

export const CAMERA_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  home: {
    position: STAGE_CONFIG.camera.position,
    target: STAGE_CONFIG.camera.target,
  },
  front: {
    position: [0, 1.35, 6.2],
    target: [0, 1.48, 0],
  },
  back: {
    position: [0, 1.35, -6.2],
    target: [0, 1.48, 0],
  },
  side: {
    position: [6, 1.45, 0.6],
    target: [0, 1.48, 0],
  },
  detail: {
    position: [0.25, 1.72, 4.35],
    target: [0, 1.72, 0],
  },
  collar: {
    position: [0.45, 2.5, 4.7],
    target: [0, 2.62, 0.12],
  },
  chest: {
    position: [-0.7, 1.95, 4.9],
    target: [-0.22, 1.9, 0.18],
  },
  sidePanel: {
    position: [5.2, 1.42, 1.5],
    target: [0.52, 1.28, 0.05],
  },
  hem: {
    position: [0.4, 0.72, 4.9],
    target: [0, 0.46, 0.16],
  },
};

export const jerseyHotspots: HotspotConfig[] = [
  {
    id: "collar",
    label: "Collar",
    position: [0, 2.66, 0.3],
    normal: [0, 0.2, 1],
    cameraPreset: "collar",
    note: "A clean neckline finish that holds its shape through play.",
  },
  {
    id: "chest",
    label: "Chest emblem",
    position: [-0.26, 1.92, 0.36],
    normal: [-0.2, 0, 1],
    cameraPreset: "chest",
    note: "Emblem placement is balanced against the chest panel.",
  },
  {
    id: "side",
    label: "Side panel",
    position: [0.62, 1.22, 0.08],
    normal: [1, 0, 0.2],
    cameraPreset: "sidePanel",
    note: "The panel line follows the silhouette from underarm to hem.",
  },
  {
    id: "hem",
    label: "Hem pattern",
    position: [0, 0.38, 0.31],
    normal: [0, -0.1, 1],
    cameraPreset: "hem",
    note: "A quiet pattern detail closes the design at the hem.",
  },
];

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function normalizeHex(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const raw = value.trim().replace("#", "");
  if (/^[\da-f]{3}$/i.test(raw)) {
    return `#${raw
      .split("")
      .map((char) => char + char)
      .join("")}`.toLowerCase();
  }
  if (/^[\da-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`;
  return fallback;
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = normalizeHex(hex, "#ff5a00").slice(1);
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function mixHex(a: string, b: string, amount: number) {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  const mixed = first.map((channel, index) =>
    clampChannel(channel * (1 - amount) + second[index] * amount),
  );
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string) {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

export function getViewerPalette(design: ViewerDesign) {
  const dc = normalizeHex(design.colors?.[0], normalizeHex(design.accent, "#8d2438"));
  const dc2 = normalizeHex(design.colors?.[1], "#e8dcc0");
  const [dcR, dcG, dcB] = hexToRgb(dc);
  const [dc2R, dc2G, dc2B] = hexToRgb(dc2);
  const glow = luminance(dc) >= luminance(dc2) ? dc : dc2;
  const counter = glow === dc ? dc2 : dc;
  const [glowR, glowG, glowB] = hexToRgb(glow);
  const edge = mixHex("#0c0c0d", counter, 0.15);
  const [edgeR, edgeG, edgeB] = hexToRgb(edge);

  return {
    dc,
    dc2,
    glow,
    edge,
    rgb: {
      dc: `${dcR} ${dcG} ${dcB}`,
      dc2: `${dc2R} ${dc2G} ${dc2B}`,
      glow: `${glowR} ${glowG} ${glowB}`,
      edge: `${edgeR} ${edgeG} ${edgeB}`,
    },
  } as const;
}

export function getHotspotNote(design: ViewerDesign, id: HotspotId) {
  const source = design.hotspots as Record<string, string> | undefined;
  return source?.[id] || jerseyHotspots.find((spot) => spot.id === id)?.note || "";
}

export function categoryLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
