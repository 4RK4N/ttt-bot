import { siteName } from './nav';
import { DISCORD_TTT } from './site';

/** Public operator label and contact — no postal address. */
export const legalContact = {
  operatorName: siteName,
  discordUrl: DISCORD_TTT,
  siteUrl: 'https://ttt-ffxiv.eu',
} as const;
