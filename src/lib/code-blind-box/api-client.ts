import { normalizeBlindBoxSession } from '@/lib/code-blind-box/session';
import type { BlindBoxSession } from '@/lib/code-blind-box/types';

const API_PATH = '/api/code-blind-box';

export async function fetchBlindBoxSession(): Promise<BlindBoxSession | null> {
  const res = await fetch(API_PATH, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data ? normalizeBlindBoxSession(data) : null;
}

export async function drawBlindBoxSet(): Promise<BlindBoxSession | null> {
  const res = await fetch(API_PATH, { method: 'POST' });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data ? normalizeBlindBoxSession(data) : null;
}

export async function confirmBlindBoxChoice(
  slot: 1 | 2
): Promise<{ ok: true; session: BlindBoxSession } | { ok: false; session?: BlindBoxSession }> {
  const res = await fetch(API_PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, session: data ? normalizeBlindBoxSession(data) : undefined };
  }
  return { ok: true, session: normalizeBlindBoxSession(data) };
}
