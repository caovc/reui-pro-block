import { demoAvatar } from "@/lib/demo-artwork";

// Original portraits generated locally; no requests to the reference site's media hosts.
export const portraitAssets = Array.from({ length: 18 }, (_, index) =>
  demoAvatar(`collaboration-person-${index + 1}`),
);
