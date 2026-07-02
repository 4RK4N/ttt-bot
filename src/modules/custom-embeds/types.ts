import { getConfig, getTexts } from '../../core/texts.js';

export const NAMESPACE = 'custom-embeds';

export interface EmbedPanelConfig {
  id: string;
  published: boolean;
  panelMessageId: string;
  channelId: string;
  showTimestamp: boolean;
}

export interface EmbedPanelTexts {
  panelTitle: string;
  panelDescription: string;
  authorName: string;
  authorIconUrl: string;
  footer: string;
}

export interface ResolvedEmbedPanel extends EmbedPanelConfig, EmbedPanelTexts { }

export interface CustomEmbedsConfig {
  enabled?: boolean;
  panels: EmbedPanelConfig[];
}

export interface CustomEmbedsTexts {
  panels: Record<string, EmbedPanelTexts>;
}

export const DEFAULT_PANEL_TEXTS: EmbedPanelTexts = {
  panelTitle: '',
  panelDescription: '',
  authorName: '',
  authorIconUrl: '',
  footer: '',
};

export const TEXT_DEFAULTS: CustomEmbedsTexts = {
  panels: {},
};

export const CONFIG_DEFAULTS: CustomEmbedsConfig = {
  enabled: true,
  panels: [],
};

export function config(): CustomEmbedsConfig {
  return getConfig(NAMESPACE, CONFIG_DEFAULTS);
}

export function texts(): CustomEmbedsTexts {
  return getTexts(NAMESPACE, TEXT_DEFAULTS);
}

export function resolveEmbedPanel(id: string): ResolvedEmbedPanel | undefined {
  const row = config().panels.find((p) => p.id === id);
  if (!row) return undefined;
  const copy = texts().panels[id] ?? DEFAULT_PANEL_TEXTS;
  return {
    ...row,
    ...copy,
    showTimestamp: row.showTimestamp === true,
  };
}
