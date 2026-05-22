export type ThemeColor = "orange" | "blue" | "purple" | "green" | "rose" | "custom";

interface ColorPalette {
  "50": string;
  "100": string;
  "500": string;
  "600": string;
  "700": string;
}

const PALETTES: Record<Exclude<ThemeColor, "custom">, ColorPalette> = {
  orange: { "50": "#fff3ed", "100": "#ffe3d4", "500": "#FF5C00", "600": "#e84f00", "700": "#bd3f00" },
  blue: { "50": "#eff6ff", "100": "#dbeafe", "500": "#3B82F6", "600": "#2563eb", "700": "#1d4ed8" },
  purple: { "50": "#f5f3ff", "100": "#ede9fe", "500": "#8B5CF6", "600": "#7c3aed", "700": "#6d28d9" },
  green: { "50": "#ecfdf5", "100": "#d1fae5", "500": "#10B981", "600": "#059669", "700": "#047857" },
  rose: { "50": "#fff1f2", "100": "#ffe4e6", "500": "#EC4899", "600": "#db2777", "700": "#be185d" }
};

const STORAGE_KEY = "offerforge-theme";
const CUSTOM_COLOR_KEY = "offerforge-theme-custom";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
}

function generatePalette(baseHex: string): ColorPalette {
  const [r, g, b] = hexToRgb(baseHex);

  // 50: mix with 90% white — very light
  const mix50 = (c: number) => c + (255 - c) * 0.9;
  // 100: mix with 75% white — light
  const mix100 = (c: number) => c + (255 - c) * 0.75;
  // 600: darken by 12%
  const mix600 = (c: number) => c * 0.88;
  // 700: darken by 25%
  const mix700 = (c: number) => c * 0.75;

  return {
    "50": rgbToHex(mix50(r), mix50(g), mix50(b)),
    "100": rgbToHex(mix100(r), mix100(g), mix100(b)),
    "500": baseHex,
    "600": rgbToHex(mix600(r), mix600(g), mix600(b)),
    "700": rgbToHex(mix700(r), mix700(g), mix700(b))
  };
}

export function getStoredCustomColor(): string {
  try {
    return localStorage.getItem(CUSTOM_COLOR_KEY) || "#6366F1";
  } catch { return "#6366F1"; }
}

export function getStoredTheme(): ThemeColor {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "custom") return "custom";
    if (stored && stored in PALETTES) return stored as ThemeColor;
  } catch { /* ignore */ }
  return "orange";
}

export function applyTheme(color: ThemeColor, customHex?: string) {
  const root = document.documentElement;
  let palette: ColorPalette;

  if (color === "custom") {
    const hex = customHex || getStoredCustomColor();
    palette = generatePalette(hex);
    try { localStorage.setItem(CUSTOM_COLOR_KEY, hex); } catch { /* ignore */ }
  } else {
    palette = PALETTES[color];
  }

  root.style.setProperty("--brand-50", palette["50"]);
  root.style.setProperty("--brand-100", palette["100"]);
  root.style.setProperty("--brand-500", palette["500"]);
  root.style.setProperty("--brand-600", palette["600"]);
  root.style.setProperty("--brand-700", palette["700"]);
  root.style.setProperty("--brand", palette["500"]);

  // RGB values for rgba() usage in CSS
  const [br, bg, bb] = hexToRgb(palette["500"]);
  root.style.setProperty("--brand-500-rgb", `${br},${bg},${bb}`);
  const [cr, cg, cb] = hexToRgb(palette["600"]);
  root.style.setProperty("--brand-600-rgb", `${cr},${cg},${cb}`);

  try { localStorage.setItem(STORAGE_KEY, color); } catch { /* ignore */ }

  // Notify components to re-read CSS variables
  window.dispatchEvent(new CustomEvent("offerforge-theme-changed"));
}

export function initTheme() {
  const stored = getStoredTheme();
  applyTheme(stored);
}
