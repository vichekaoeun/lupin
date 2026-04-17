/**
 * DynamoDB data layer — single-table design.
 *
 * Table name:   DYNAMODB_TABLE_NAME  (e.g. sakura-srs-dev)
 * Region:       AWS_REGION           (e.g. us-east-1)
 *
 * Key schema
 * ──────────────────────────────────────────────────────────
 * Entity      PK                  SK
 * User        USER#<userId>       PROFILE
 * Card        USER#<userId>       CARD#<cardId>
 * ReviewLog   USER#<userId>       REVIEW#<iso-timestamp>
 *
 * GSI1 (cards by nextReview)
 *   GSI1PK = USER#<userId>
 *   GSI1SK = nextReview  (YYYY-MM-DD)
 *   Projection: ALL
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Card, ReviewLog, UserProfile } from './types';

const TABLE = process.env.DYNAMODB_TABLE_NAME!;
const REGION = process.env.AWS_REGION ?? 'us-east-1';
const GSI1 = 'GSI1-nextReview';
const REVIEW_TTL_DAYS = 180;

let _ddb: DynamoDBDocumentClient | null = null;
function ddb(): DynamoDBDocumentClient {
  if (!_ddb) {
    _ddb = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: REGION }),
      { marshallOptions: { removeUndefinedValues: true } }
    );
  }
  return _ddb;
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

const pk = (userId: string) => `USER#${userId}`;
const cardSk = (cardId: string) => `CARD#${cardId}`;
const reviewSk = (ts: string) => `REVIEW#${ts}`;

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUser(userId: string): Promise<UserProfile | undefined> {
  const res = await ddb().send(
    new GetCommand({ TableName: TABLE, Key: { pk: pk(userId), sk: 'PROFILE' } })
  );
  if (!res.Item) return undefined;
  const { pk: _pk, sk: _sk, ...item } = res.Item;
  return item as UserProfile;
}

export async function upsertUser(user: UserProfile): Promise<UserProfile> {
  await ddb().send(
    new PutCommand({
      TableName: TABLE,
      Item: { pk: pk(user.id), sk: 'PROFILE', ...user },
    })
  );
  return user;
}

export async function getOrCreateUser(userId: string): Promise<UserProfile> {
  const existing = await getUser(userId);
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
  await upsertUser(user);
  return user;
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export async function getCard(cardId: string, userId: string): Promise<Card | undefined> {
  const res = await ddb().send(
    new GetCommand({
      TableName: TABLE,
      Key: { pk: pk(userId), sk: cardSk(cardId) },
    })
  );
  if (!res.Item) return undefined;
  const { pk: _pk, sk: _sk, gsi1pk: _g1, gsi1sk: _g2, ...item } = res.Item;
  return item as Card;
}

export async function saveCard(card: Card): Promise<Card> {
  await ddb().send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        pk: pk(card.userId),
        sk: cardSk(card.id),
        // GSI1 attributes for nextReview range queries
        gsi1pk: pk(card.userId),
        gsi1sk: card.nextReview,
        ...card,
      },
    })
  );
  return card;
}

export async function getCardsByUser(userId: string): Promise<Card[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      FilterExpression: 'deleted <> :true',
      ExpressionAttributeValues: {
        ':pk': pk(userId),
        ':prefix': 'CARD#',
        ':true': true,
      },
    })
  );
  return (res.Items ?? []).map(({ pk: _pk, sk: _sk, gsi1pk: _g1, gsi1sk: _g2, ...item }) => item as Card);
}

export async function getDueCards(userId: string, today: string): Promise<Card[]> {
  // Query GSI1: all cards for this user where nextReview <= today
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: GSI1,
      KeyConditionExpression: 'gsi1pk = :pk AND gsi1sk <= :today',
      FilterExpression:
        'enrichmentStatus = :complete AND deleted <> :true AND (attribute_not_exists(suspended) OR suspended <> :true)',
      ExpressionAttributeValues: {
        ':pk': pk(userId),
        ':today': today,
        ':complete': 'complete',
        ':true': true,
      },
    })
  );
  return (res.Items ?? [])
    .map(({ pk: _pk, sk: _sk, gsi1pk: _g1, gsi1sk: _g2, ...item }) => item as Card)
    .sort((a, b) => a.easeFactor - b.easeFactor); // hardest cards first
}

export async function deleteCard(cardId: string, userId: string): Promise<void> {
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { pk: pk(userId), sk: cardSk(cardId) },
      UpdateExpression: 'SET deleted = :true, updatedAt = :now',
      ExpressionAttributeValues: {
        ':true': true,
        ':now': new Date().toISOString(),
      },
    })
  );
}

// ─── Review Logs ──────────────────────────────────────────────────────────────

export async function saveReviewLog(log: ReviewLog): Promise<ReviewLog> {
  const ttl = Math.floor(Date.now() / 1000) + REVIEW_TTL_DAYS * 86400;
  await ddb().send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        pk: pk(log.userId),
        sk: reviewSk(log.reviewedAt),
        ttl,
        ...log,
      },
    })
  );
  return log;
}

export async function getReviewLogs(userId: string): Promise<ReviewLog[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': pk(userId),
        ':prefix': 'REVIEW#',
      },
    })
  );
  return (res.Items ?? []).map(({ pk: _pk, sk: _sk, ttl: _ttl, ...item }) => item as ReviewLog);
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function updateStreak(userId: string): Promise<UserProfile> {
  const user = await getOrCreateUser(userId);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (user.lastStudiedDate === today) return user;
  const newStreak = user.lastStudiedDate === yesterday ? user.streak + 1 : 1;
  const updated = { ...user, streak: newStreak, lastStudiedDate: today };
  await upsertUser(updated);
  return updated;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardData(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const [cards, logs, user] = await Promise.all([
    getCardsByUser(userId),
    getReviewLogs(userId),
    getOrCreateUser(userId),
  ]);

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
