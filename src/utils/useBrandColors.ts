import { useEffect, useState } from "react";

function readVar(name: string): string {
  try {
    const root = document.documentElement;
    return (root.style.getPropertyValue(name) || getComputedStyle(root).getPropertyValue(name)).trim() || "";
  } catch { return ""; }
}

export interface BrandColors {
  "50": string;
  "100": string;
  "500": string;
  "600": string;
  "700": string;
}

function readBrandColors(): BrandColors {
  return {
    "50": readVar("--brand-50") || "#fff3ed",
    "100": readVar("--brand-100") || "#ffe3d4",
    "500": readVar("--brand-500") || "#FF5C00",
    "600": readVar("--brand-600") || "#e84f00",
    "700": readVar("--brand-700") || "#bd3f00",
  };
}

export function useBrandColors(): BrandColors {
  const [colors, setColors] = useState<BrandColors>(readBrandColors);

  useEffect(() => {
    const handler = () => setColors(readBrandColors());
    window.addEventListener("offerforge-theme-changed", handler);
    return () => window.removeEventListener("offerforge-theme-changed", handler);
  }, []);

  return colors;
}
