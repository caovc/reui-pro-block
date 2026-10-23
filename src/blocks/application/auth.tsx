import type { BlockProps } from "@/data/types";
import CenteredAuth from "./auth-centered";
import SplitAuth from "./auth-split";
import { BlueprintMagicLink, FreeTrialSignup } from "./auth-growth";
import { FounderStoryLogin, PhotoBackdropLogin } from "./auth-editorial";
import { NightReviewLogin } from "./auth-review-panels";
import { GridReviewLogin, MultiMethodLogin } from "./auth-methods";
import { CyanArtworkLogin, AccessArtworkLogin } from "./auth-access";
import "./auth.css";

export default function AuthBlock({ block }: BlockProps) {
  switch (block.id) {
    case "auth-5":
      return <FreeTrialSignup />;
    case "auth-6":
      return <FounderStoryLogin />;
    case "auth-7":
      return <BlueprintMagicLink />;
    case "auth-8":
      return <PhotoBackdropLogin />;
    case "auth-9":
      return <GridReviewLogin />;
    case "auth-10":
      return <NightReviewLogin variant={10} />;
    case "auth-11":
      return <NightReviewLogin variant={11} />;
    case "auth-12":
      return <MultiMethodLogin />;
    case "auth-13":
      return <CyanArtworkLogin />;
    case "auth-14":
      return <AccessArtworkLogin />;
    case "auth-18":
      return <NightReviewLogin variant={18} />;
    case "auth-1":
    case "auth-2":
    case "auth-3":
    case "auth-4":
      return <SplitAuth block={block} />;
    case "auth-15":
    case "auth-16":
    case "auth-17":
    case "auth-19":
    case "auth-20":
      return <CenteredAuth block={block} />;
    default:
      throw new Error(`Unknown authentication block: ${block.id}`);
  }
}
