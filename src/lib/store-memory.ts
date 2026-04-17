/**
 * In-memory async store — used for local dev when DYNAMODB_TABLE_NAME is not set.
 * All functions return Promises so they share an interface with the DynamoDB store.
 */
import { Card, ReviewLog, UserProfile, DeckStats } from './types';

const store = {
  cards: new Map<string, Card>(),
  reviewLogs: new Map<string, ReviewLog>(),
  users: new Map<string, UserProfile>(),
  deckStats: new Map<string, DeckStats>(),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUser(userId: string): Promise<UserProfile | undefined> {
  return store.users.get(userId);
}

export async function upsertUser(user: UserProfile): Promise<UserProfile> {
  store.users.set(user.id, user);
  return user;
}

export async function getOrCreateUser(userId: string): Promise<UserProfile> {
  const existing = store.users.get(userId);
  if (existing) return existing;
  const user: UserProfile = {
    id: userId,
    email: `${userId}@example.com`,
    displayName: 'Learner',
    targetJLPT: 'N3',
    theme: 'anime',
    timezone: 'UTC',
    studyGoal: 20,
    streak: 0,
    lastStudiedDate: null,
    createdAt: new Date().toISOString(),
  };
  store.users.set(userId, user);
  return user;
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export async function getCard(cardId: string, _userId?: string): Promise<Card | undefined> {
  return store.cards.get(cardId);
}

export async function saveCard(card: Card): Promise<Card> {
  store.cards.set(card.id, card);
  return card;
}

export async function getCardsByUser(userId: string): Promise<Card[]> {
  return Array.from(store.cards.values()).filter(
    (c) => c.userId === userId && !c.deleted
  );
}

export async function getDueCards(userId: string, today: string): Promise<Card[]> {
  const cards = await getCardsByUser(userId);
  return cards
    .filter(
      (c) =>
        c.nextReview <= today &&
        c.enrichmentStatus === 'complete' &&
        !c.suspended
    )
    .sort((a, b) => a.easeFactor - b.easeFactor);
}

export async function deleteCard(cardId: string, _userId?: string): Promise<void> {
  const card = store.cards.get(cardId);
  if (card) store.cards.set(cardId, { ...card, deleted: true });
}

// ─── Review Logs ──────────────────────────────────────────────────────────────

export async function saveReviewLog(log: ReviewLog): Promise<ReviewLog> {
  store.reviewLogs.set(log.id, log);
  return log;
}

export async function getReviewLogs(userId: string): Promise<ReviewLog[]> {
  return Array.from(store.reviewLogs.values()).filter((r) => r.userId === userId);
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function updateStreak(userId: string): Promise<UserProfile> {
  const user = await getOrCreateUser(userId);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (user.lastStudiedDate === today) return user;
  const newStreak = user.lastStudiedDate === yesterday ? user.streak + 1 : 1;
  const updated = { ...user, streak: newStreak, lastStudiedDate: today };
  store.users.set(userId, updated);
  return updated;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardData(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const cards = await getCardsByUser(userId);
  const logs = await getReviewLogs(userId);
  const user = await getOrCreateUser(userId);

  const cardsDueToday = cards.filter(
    (c) => c.nextReview <= today && c.enrichmentStatus === 'complete' && !c.suspended
  ).length;

  const activityHeatmap: Record<string, number> = {};
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  for (const log of logs) {
    const day = log.reviewedAt.split('T')[0];
    if (day >= cutoff) activityHeatmap[day] = (activityHeatmap[day] ?? 0) + 1;
  }

  const retentionByJLPT: Record<string, { correct: number; total: number }> = {};
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  for (const log of logs) {
    const card = cardMap.get(log.cardId);
    if (!card) continue;
    const lvl = card.jlptLevel;
    if (!retentionByJLPT[lvl]) retentionByJLPT[lvl] = { correct: 0, total: 0 };
    retentionByJLPT[lvl].total++;
    if (log.quality >= 3) retentionByJLPT[lvl].correct++;
  }

  const retentionByJLPTRate: Record<string, number> = {};
  for (const [lvl, { correct, total }] of Object.entries(retentionByJLPT)) {
    retentionByJLPTRate[lvl] = total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  const totalReviews = logs.length;
  const correctReviews = logs.filter((l) => l.quality >= 3).length;
  const retentionRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

  return {
    totalCards: cards.length,
    cardsDueToday,
    streak: user.streak,
    retentionRate,
    activityHeatmap,
    retentionByJLPT: retentionByJLPTRate,
  };
}
