import type { CodeBlindBoxDraw } from '@prisma/client';
import type { BlindBoxDraw, BlindBoxSession } from './types';

export function emptyBlindBoxSession(): BlindBoxSession {
  return { options: [], chosenSlot: null, confirmed: false };
}

/** API JSON → 前端会话（与 blindBoxRowToSession 空态一致） */
export function normalizeBlindBoxSession(data: unknown): BlindBoxSession {
  if (!data || typeof data !== 'object') return emptyBlindBoxSession();
  const raw = data as Partial<BlindBoxSession>;
  return {
    options: Array.isArray(raw.options) ? raw.options : [],
    chosenSlot: raw.chosenSlot === 1 || raw.chosenSlot === 2 ? raw.chosenSlot : null,
    confirmed: Boolean(raw.confirmed),
  };
}

export function blindBoxRowToSession(row: CodeBlindBoxDraw | null): BlindBoxSession {
  if (!row) {
    return emptyBlindBoxSession();
  }

  const options: BlindBoxDraw[] = [
    {
      slot: 1,
      themeWord: row.themeWord1,
      functionWord: row.functionWord1,
      styleWord: row.styleWord1,
      drawnAt: row.drawnAt1.toISOString(),
    },
  ];

  if (row.themeWord2 && row.functionWord2 && row.styleWord2) {
    options.push({
      slot: 2,
      themeWord: row.themeWord2,
      functionWord: row.functionWord2,
      styleWord: row.styleWord2,
      drawnAt: row.drawnAt2?.toISOString() ?? new Date().toISOString(),
    });
  }

  const chosenSlot = row.chosenSlot === 1 || row.chosenSlot === 2 ? row.chosenSlot : null;
  return {
    options,
    chosenSlot,
    confirmed: chosenSlot !== null,
  };
}
