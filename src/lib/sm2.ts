import { Card } from './types';

/**
 * SuperMemo 2 algorithm.
 * quality: 0 = complete blackout, 5 = perfect recall
 */
export function updateCard(card: Card, quality: number): Card {
  const updated = { ...card };

  if (quality < 3) {
    // Failed recall: reset to beginning
    updated.repetitions = 0;
    updated.interval = 1;
    updated.failCount = (updated.failCount ?? 0) + 1;
    // Leech detection: suspend after 8 cumulative failures
    if (updated.failCount >= 8) {
      updated.suspended = true;
    }
  } else {
    // Successful recall: advance interval
    if (updated.repetitions === 0) {
      updated.interval = 1;
    } else if (updated.repetitions === 1) {
      updated.interval = 6;
    } else {
      updated.interval = Math.round(updated.interval * updated.easeFactor);
    }
    updated.repetitions += 1;
  }

  // Update ease factor (min floor 1.3 prevents death spiral)
  updated.easeFactor = Math.max(
    1.3,
    updated.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  // Schedule next review
  const next = new Date();
  next.setDate(next.getDate() + updated.interval);
  updated.nextReview = next.toISOString().split('T')[0];
  updated.updatedAt = new Date().toISOString();

  return updated;
}

export function getInitialSM2Values() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: tomorrow.toISOString().split('T')[0],
    failCount: 0,
    suspended: false,
  };
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
