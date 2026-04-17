// POST /api/reviews  { cardId, quality: 0-5 }
// Applies SM-2, saves the review log, updates streak,
// and invalidates the due-card cache.

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCard, saveCard, saveReviewLog, updateStreak } from '@/lib/store';
import { updateCard } from '@/lib/sm2';
import { invalidateDueCards } from '@/lib/redis';
import { getUserId, AuthError } from '@/lib/auth';
import { ReviewLog } from '@/lib/types';

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }

  const body = await req.json();
  const { cardId, quality } = body;

  if (typeof quality !== 'number' || quality < 0 || quality > 5) {
    return NextResponse.json({ error: 'quality must be 0–5' }, { status: 400 });
  }

  const card = await getCard(cardId, userId);
  if (!card || card.deleted || card.userId !== userId) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const updated = updateCard(card, quality);
  await saveCard(updated);

  const log: ReviewLog = {
    id: uuidv4(),
    userId,
    cardId,
    quality,
    newInterval: updated.interval,
    newEase: updated.easeFactor,
    reviewedAt: new Date().toISOString(),
  };
  await saveReviewLog(log);

  const user = await updateStreak(userId);

  // Invalidate ElastiCache so next quiz fetch reflects reviewed card
  const today = new Date().toISOString().split('T')[0];
  await invalidateDueCards(userId, today);

  return NextResponse.json({ card: updated, streak: user.streak });
}
