import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import { GlobalThemeRoot } from "@/components/site/global-theme-root";
import "./index.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <GlobalThemeRoot>
        <App />
      </GlobalThemeRoot>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  </StrictMode>,
);
