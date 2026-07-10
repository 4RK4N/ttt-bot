import type { ImageMetadata } from "astro";

import logo from "../assets/custom/logo.png";
import bg from "../assets/images/content/bg.jpg";
import homeCircle from "../assets/images/content/image22.png";

import image09 from "../assets/images/content/image09.jpg";
import drinksMenu from "../assets/images/content/Ralvus_karte_v2_upscaled.png";

export { logo, bg, homeCircle };

/** Inline content images (gallery hero and drinks menu). */
export const pageImages = {
  image09,
  drinksMenu,
} as const satisfies Record<string, ImageMetadata>;

const imageModules = import.meta.glob<ImageMetadata>(
  "../assets/images/{community,events,gallery,guestbook,partner,staff}/**/*.{jpg,jpeg,png}",
  { eager: true, import: "default" },
);

const imagesByPath = new Map<string, ImageMetadata>();
for (const [key, mod] of Object.entries(imageModules)) {
  const suffix = key.replace("../assets/images/", "");
  imagesByPath.set(suffix, mod);
}

/** Resolve an image path suffix (e.g. `gallery/room01/foo.png`) to metadata. */
export function resolveImage(suffix: string): ImageMetadata {
  const img = imagesByPath.get(suffix);
  if (!img) {
    throw new Error(`Image not found: ${suffix}`);
  }
  return img;
}

export function resolveImages(paths: readonly string[]): ImageMetadata[] {
  return paths.map(resolveImage);
}
