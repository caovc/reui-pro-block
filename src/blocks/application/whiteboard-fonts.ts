const assetRoot = new URL("./excalidraw/", document.baseURI).href;
(window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = assetRoot;

let pending: Promise<void> | undefined;

/** Seed text must be measured with the same fonts that the canvas will paint. */
export function prepareWhiteboardFonts(): Promise<void> {
  pending ??= Promise.all(
    [
      {
        family: "Excalifont",
        file: "Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2",
        weight: "400",
      },
      {
        family: "Nunito",
        file: "Nunito/Nunito-Regular-XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTQ3j6zbXWjgeg.woff2",
        weight: "500",
      },
    ].map(async ({ family, file, weight }) => {
      const font = new FontFace(family, `url("${assetRoot}fonts/${file}")`, {
        weight,
        unicodeRange: "U+0-FF,U+2000-206F,U+20AC,U+2122,U+2212",
      });
      document.fonts.add(await font.load());
    }),
  ).then(() => undefined);
  return pending;
}
