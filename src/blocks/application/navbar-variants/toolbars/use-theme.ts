import { useEffect, useState } from "react";
export function useToolbarTheme() {
  const [theme, setTheme] = useState("light");
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return { theme, setTheme, dark: theme === "dark" || (theme === "system" && systemDark) };
}
