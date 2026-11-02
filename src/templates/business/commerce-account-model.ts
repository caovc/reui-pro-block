import { demoAvatar } from "@/lib/demo-artwork";
import { useAtlasAccountSettingsModel } from "./atlas-account-settings-model";
import { useGlobalTheme } from "@/components/site/global-theme-store";
import { commitCommerceAccountThemeMode } from "./commerce-account-theme";

// Original local demo identity; the existing model owns save/cancel/upload.
export function useCommerceAccountSettingsModel() {
  const theme = useGlobalTheme();
  return useAtlasAccountSettingsModel({
    onPreferencesChange: (preferences) => {
      const mode =
        preferences.colorTheme === "Light"
          ? "light"
          : preferences.colorTheme === "Dark"
            ? "dark"
            : "system";
      const previousMode =
        theme.theme.mode === "light" || theme.theme.mode === "dark" ? theme.theme.mode : "system";
      if (mode !== previousMode) commitCommerceAccountThemeMode(mode, theme.theme);
    },
    initialProfile: {
      fullName: "Nora Bell",
      email: "nora@bricklane.test",
      phone: "+14155550184",
      username: "norabell",
      role: "Store owner",
      timeZone: "(GMT+9) Tokyo",
      website: "nora.bricklane.test",
      bio: "Coordinates the Bricklane store, customer support, and daily fulfilment.",
      avatar: demoAvatar("Nora Bell"),
    },
  });
}
