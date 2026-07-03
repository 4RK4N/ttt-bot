/**
 * Web editor row validation (panel / object-list modules).
 *
 * Called from src/web/store.ts when saving object-list fields. Wire your validator
 * in the writeValues() loop — see README.md "Web editor validation".
 */
import { parsePanelBaseFields } from '../../core/panelFields.js';

interface ExamplePanelLike {
  panelTitle: string;
  panelDescription: string;
}

export function validateExamplePanel(panel: ExamplePanelLike): void {
  if (!panel.panelTitle.trim()) {
    throw new Error('Panel title is required.');
  }
  if (!panel.panelDescription.trim()) {
    throw new Error('Panel description is required.');
  }
}

export function validateExamplePanelRow(
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>
): void {
  const base = parsePanelBaseFields(configRow, textRow);
  validateExamplePanel(base);
}

// Richer list validation: see src/modules/tickets/validate.ts
