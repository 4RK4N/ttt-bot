import type { ImageMetadata } from 'astro';

import logo from '../assets/custom/logo.png';
import bg from '../assets/images/bg.jpg';
import homeCircle from '../assets/images/image22.png';

import image01 from '../assets/images/image01.png';
import image02 from '../assets/images/image02.png';
import image03 from '../assets/images/image03.png';
import image04 from '../assets/images/image04.jpg';
import image05 from '../assets/images/image05.png';
import image06 from '../assets/images/image06.png';
import image07 from '../assets/images/image07.png';
import image08 from '../assets/images/image08.png';
import image09 from '../assets/images/image09.jpg';
import image10 from '../assets/images/image10.png';
import image12 from '../assets/images/image12.png';
import image13 from '../assets/images/image13.png';
import image14 from '../assets/images/image14.png';
import image15 from '../assets/images/image15.jpg';
import image16 from '../assets/images/image16.png';
import image17 from '../assets/images/image17.png';
import image18 from '../assets/images/image18.png';
import image19 from '../assets/images/image19.png';
import image20 from '../assets/images/image20.jpg';
import image21 from '../assets/images/image21.png';

export { logo, bg, homeCircle };

export const pageIcons = {
  image01,
  image02,
  image03,
  image04,
  image05,
  image06,
  image07,
  image08,
  image09,
  image10,
  image12,
  image13,
  image14,
  image15,
  image16,
  image17,
  image18,
  image19,
  image20,
  image21,
} as const satisfies Record<string, ImageMetadata>;

const galleryModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/images/gallery*/**/*.{jpg,jpeg,png}',
  { eager: true, import: 'default' },
);

const galleryByPath = new Map<string, ImageMetadata>();
for (const [key, mod] of Object.entries(galleryModules)) {
  const suffix = key.replace('../assets/images/', '');
  galleryByPath.set(suffix, mod);
}

/** Resolve a gallery path suffix (e.g. `gallery01/foo.jpg`) to imported metadata. */
export function resolveGallery(suffix: string): ImageMetadata {
  const img = galleryByPath.get(suffix);
  if (!img) {
    throw new Error(`Gallery image not found: ${suffix}`);
  }
  return img;
}

export function resolveGalleryList(paths: readonly string[]): ImageMetadata[] {
  return paths.map(resolveGallery);
}
