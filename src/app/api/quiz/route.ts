// GET /api/quiz
// Returns cards due today, served from Redis cache when available.
// ?mode=free — returns all complete cards regardless of schedule

import { NextRequest, NextResponse } from 'next/server';
import { getDueCards, getCardsByUser } from '@/lib/store';
import { getCachedDueCards, cacheDueCards } from '@/lib/redis';
import { getUserId, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }

  const mode = req.nextUrl.searchParams.get('mode');
  const today = new Date().toISOString().split('T')[0];

  if (mode === 'free') {
    const cards = (await getCardsByUser(userId))
      .filter((c) => c.enrichmentStatus === 'complete')
      .sort((a, b) => a.easeFactor - b.easeFactor);
    return NextResponse.json({ cards, total: cards.length, mode: 'free' });
  }

  // Attempt cache hit (ElastiCache / Redis)
  const cached = await getCachedDueCards(userId, today);
  if (cached) {
    return NextResponse.json({ cards: cached, total: cached.length, mode: 'scheduled', source: 'cache' });
  }

  // Cache miss — query DynamoDB GSI, then populate cache
  const cards = await getDueCards(userId, today);
  await cacheDueCards(userId, today, cards);

  return NextResponse.json({ cards, total: cards.length, mode: 'scheduled', source: 'db' });
}
