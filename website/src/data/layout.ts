/** Desktop root; global.css scales html font-size at breakpoints (see remScaledSizes). */
export const ROOT_FONT_PX = 24;

/** Card images go full-width below this (matches narrow content layout). */
export const NARROW_CONTENT_BP_PX = 720;

/** Horizontal padding on .content-section (px-6 × 2). */
export const CONTENT_SECTION_PADDING_REM = 3;

/** Section max-widths — keep in sync with --content-max-* in theme.css. */
export const CONTENT_MAX_REM = 56.25;
export const CONTENT_MAX_TEXT_REM = 42.5;
export const CONTENT_MAX_WIDE_REM = 47.5;
export const CONTENT_MAX_GALLERY_REM = 56.25;

const CONTENT_COLUMN_INNER_REM =
  CONTENT_MAX_TEXT_REM - CONTENT_SECTION_PADDING_REM;

/** Inner content width for full-width images in the default text column. */
export const CONTENT_COLUMN_PX = Math.round(
  CONTENT_COLUMN_INNER_REM * ROOT_FONT_PX,
);

function contentSectionSizes(maxRem: number): string {
  return `calc(min(100vw, ${maxRem}rem) - ${CONTENT_SECTION_PADDING_REM}rem)`;
}

/** w-72 = 18rem — home hero circle */
export const HERO_REM = 18;
export const HERO_CIRCLE_PX = HERO_REM * ROOT_FONT_PX;

/** max-w-[24rem] — events archive image */
export const CARD_REM = 24;
export const CARD_IMAGE_PX = CARD_REM * ROOT_FONT_PX;

/** w-48 = 12rem — partner logo */
export const PARTNER_REM = 12;
export const PARTNER_LOGO_PX = PARTNER_REM * ROOT_FONT_PX;

/** Header logo intrinsic dimensions */
export const HEADER_LOGO_WIDTH_PX = 127;
export const HEADER_LOGO_HEIGHT_PX = 49;

/** Header bar height — synced with --header-height in theme.css. */
export const HEADER_HEIGHT_PX = 74;

/** Target logo display height inside the header bar. */
export const HEADER_LOGO_TARGET_PX = 54;

/** Header bar height and logo vertical padding — logo scales with rem. */
const HEADER_BAR_PX = HEADER_HEIGHT_PX;
const HEADER_LOGO_PAD_REM = (HEADER_HEIGHT_PX - HEADER_LOGO_TARGET_PX) / 2 / ROOT_FONT_PX;

/** Display height of header logo at a given root font size. */
export function headerLogoDisplayHeight(rootPx: number = ROOT_FONT_PX): number {
  return HEADER_BAR_PX - 2 * remPx(HEADER_LOGO_PAD_REM, rootPx);
}

/** Display width of header logo at a given root font size. */
export function headerLogoDisplayPx(rootPx: number = ROOT_FONT_PX): number {
  const logoH = headerLogoDisplayHeight(rootPx);
  return Math.round(logoH * (HEADER_LOGO_WIDTH_PX / HEADER_LOGO_HEIGHT_PX));
}

/** sizes attribute for header logo (h-full w-auto in fixed-height bar). */
export function headerLogoSizes(): string {
  return `(max-width: 480px) ${headerLogoDisplayPx(18)}px, (max-width: 736px) ${headerLogoDisplayPx(20)}px, (max-width: 1280px) ${headerLogoDisplayPx(22)}px, ${headerLogoDisplayPx(24)}px`;
}

/** Fixed srcset widths for build — sizes attrs still drive browser selection. */
const BUILD_WIDTHS = {
  headerLogo: [130, 195, 260],
  hero: [432, 648, 864],
  partner: [288, 432, 576],
  contentColumn: [
    400,
    CONTENT_COLUMN_PX,
    1200,
    Math.round(CONTENT_COLUMN_PX * 1.67),
  ],
  cardImage: [400, 576, 792, 1200],
  portraitGallery: [320, 640, 960],
  landscapeGallery: [400, 800, 1200],
} as const;

type BuildWidthProfile = keyof typeof BUILD_WIDTHS;

function buildWidths(profile: BuildWidthProfile): number[] {
  return [...BUILD_WIDTHS[profile]];
}

/** srcset widths for header logo. */
export function headerLogoWidths(): number[] {
  return buildWidths("headerLogo");
}

const GRID_GAP_REM = 0.75; // gap-3

/** Rem length at a given root font size (px). */
export function remPx(rem: number, rootPx: number = ROOT_FONT_PX): number {
  return Math.round(rem * rootPx);
}

/** sizes attribute for a rem-width element that tracks global.css root scaling. */
export function remScaledSizes(rem: number): string {
  return `(max-width: 480px) ${remPx(rem, 18)}px, (max-width: 736px) ${remPx(rem, 20)}px, (max-width: 1280px) ${remPx(rem, 22)}px, ${remPx(rem, 24)}px`;
}

const REM_WIDTH_PROFILES: Partial<Record<number, BuildWidthProfile>> = {
  [HERO_REM]: "hero",
  [PARTNER_REM]: "partner",
};

/** srcset widths for a rem-width element (hero circle or partner logo). */
export function remScaledWidths(rem: number): number[] {
  const profile = REM_WIDTH_PROFILES[rem];
  if (!profile) {
    throw new Error(`No build widths configured for ${rem}rem element`);
  }
  return buildWidths(profile);
}

/** Portrait gallery sizes — calc() tracks rem scaling and column max-width. */
export const PORTRAIT_GALLERY_SIZES =
  `(max-width: 640px) calc((min(100vw, ${CONTENT_MAX_TEXT_REM}rem) - ${CONTENT_SECTION_PADDING_REM}rem - ${GRID_GAP_REM}rem) / 2), ` +
  `(max-width: 1024px) calc((min(100vw, ${CONTENT_MAX_TEXT_REM}rem) - ${CONTENT_SECTION_PADDING_REM}rem - 1.5rem) / 3), ` +
  `calc((min(100vw, ${CONTENT_MAX_TEXT_REM}rem) - ${CONTENT_SECTION_PADDING_REM}rem - 3rem) / 5)`;

/** srcset widths for portrait gallery cells. */
export function portraitGalleryWidths(): number[] {
  return buildWidths("portraitGallery");
}

/** Full content column — w-full images inside default text sections. */
export const CONTENT_COLUMN_SIZES = contentSectionSizes(CONTENT_MAX_TEXT_REM);

/** Full content column for gallery pages. */
export const GALLERY_CONTENT_COLUMN_SIZES = contentSectionSizes(
  CONTENT_MAX_GALLERY_REM,
);

/** srcset widths for full-width content column images. */
export function contentColumnWidths(): number[] {
  return buildWidths("contentColumn");
}

/** Landscape gallery sizes — 1 col below sm, 2 cols at sm+. */
export const LANDSCAPE_GALLERY_SIZES =
  `(max-width: 640px) ${contentSectionSizes(CONTENT_MAX_TEXT_REM)}, ` +
  `calc((${contentSectionSizes(CONTENT_MAX_TEXT_REM)} - ${GRID_GAP_REM}rem) / 2)`;

/** Landscape gallery sizes for gallery pages. */
export const LANDSCAPE_GALLERY_SIZES_WIDE =
  `(max-width: 640px) ${contentSectionSizes(CONTENT_MAX_GALLERY_REM)}, ` +
  `calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - ${GRID_GAP_REM}rem) / 2)`;

/** Portrait gallery sizes wide variant. */
export const PORTRAIT_GALLERY_SIZES_WIDE =
  `(max-width: 640px) calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - ${GRID_GAP_REM}rem) / 2), ` +
  `(max-width: 1024px) calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - 1.5rem) / 3), ` +
  `calc((${contentSectionSizes(CONTENT_MAX_GALLERY_REM)} - 3rem) / 5)`;

/** srcset widths for landscape gallery cells. */
export function landscapeGalleryWidths(): number[] {
  return buildWidths("landscapeGallery");
}

/** Events card: full column below NARROW_CONTENT_BP, max-w-[24rem] above. */
export function cardImageSizes(): string {
  return `(max-width: ${NARROW_CONTENT_BP_PX}px) calc(100vw - 3rem), (max-width: 480px) ${remPx(CARD_REM, 18)}px, (max-width: 736px) ${remPx(CARD_REM, 20)}px, (max-width: 1280px) ${remPx(CARD_REM, 22)}px, ${remPx(CARD_REM, 24)}px`;
}

/** srcset widths for events card image. */
export function cardImageWidths(): number[] {
  return buildWidths("cardImage");
}

const GRID_GAP_PX = remPx(GRID_GAP_REM);

/** 2-col landscape grid cell in content column */
export const LANDSCAPE_CELL_PX = Math.round(
  (CONTENT_COLUMN_PX - GRID_GAP_PX) / 2,
);

/** 5-col portrait grid cell at lg */
export const PORTRAIT_CELL_LG_PX = Math.floor(
  (CONTENT_COLUMN_PX - 4 * GRID_GAP_PX) / 5,
);
