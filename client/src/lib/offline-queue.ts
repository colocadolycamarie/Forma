import type { LogSetInput } from '@forma/shared';

/**
 * Offline logging & sync (spec §6 Train / §7.4). A gym basement with no
 * signal is a normal, expected scenario for this product — not an error
 * state. Sets logged with no connection queue locally and sync in the
 * order they were logged once the device reconnects. The underlying data
 * model is append-only (a set never overwrites another set), so there is
 * no real conflict case to resolve here — this queue is deliberately
 * "dumb": first in, first synced, nothing merged or reconciled.
 */

export type QueuedSet = {
  localId: string;
  sessionId: string;
  input: LogSetInput;
  queuedAt: string;
};

const STORAGE_KEY = 'forma.offlineQueue';

function readQueue(): QueuedSet[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSet[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable — the queue simply won't persist across a
    // reload in that rare case; logging within the current tab still works.
  }
}

export function getQueuedSets(sessionId: string): QueuedSet[] {
  return readQueue().filter((item) => item.sessionId === sessionId);
}

export function enqueueSet(sessionId: string, input: LogSetInput): QueuedSet {
  const entry: QueuedSet = {
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionId,
    input,
    queuedAt: new Date().toISOString(),
  };
  writeQueue([...readQueue(), entry]);
  return entry;
}

export function dequeueSet(localId: string) {
  writeQueue(readQueue().filter((item) => item.localId !== localId));
}

export function queueLength(sessionId?: string): number {
  return sessionId ? getQueuedSets(sessionId).length : readQueue().length;
}
