import { demoPanel } from "@/lib/demo-artwork";

// Seventy-five local vector studies replace the original preview screenshots.
export const wallpaperAssets = Array.from({ length: 75 }, (_, index) => demoPanel(index));
