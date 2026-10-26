import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

const disableFontHinting = process.env.BRICKLANE_FONT_HINTING === "none";

export default defineConfig({
  ...base,
  testMatch: ["**/*.spec.ts", "**/*.diagnostic.ts"],
  use: {
    ...base.use,
    ...(disableFontHinting
      ? {
          launchOptions: {
            ...base.use?.launchOptions,
            args: [...(base.use?.launchOptions?.args ?? []), "--font-render-hinting=none"],
          },
        }
      : {}),
  },
});
