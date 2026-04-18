import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // seconds
import { v4 as uuidv4 } from 'uuid';
import { getCardsByUser, saveCard, getOrCreateUser } from '@/lib/store';
import { enrichCard, applyEnrichment } from '@/lib/enrichment';
import { getInitialSM2Values } from '@/lib/sm2';
import { getUserId, AuthError } from '@/lib/auth';
import { Card } from '@/lib/types';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jlpt = searchParams.get('jlpt');
  const due = searchParams.get('due') === 'true';
  const today = new Date().toISOString().split('T')[0];

  let cards = await getCardsByUser(userId);
  if (jlpt) cards = cards.filter((c) => c.jlptLevel === jlpt);
  if (due) cards = cards.filter((c) => c.nextReview <= today);

  const limit = parseInt(searchParams.get('limit') ?? '100');
  cards = cards.slice(0, limit);

  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }

  // Rate limit: 25 Bedrock card creations per day per user
  const { allowed } = await rateLimit(`cards:create:${userId}`, 25, 60 * 60 * 24);
  if (!allowed) return tooManyRequests(60 * 60 * 24);

  const body = await req.json();
  const { word, theme } = body;

  if (!word || typeof word !== 'string' || word.length > 100) {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 });
  }

  const sanitised = word.replace(/<[^>]*>/g, '').trim();
  const user = await getOrCreateUser(userId);
  const cardTheme = theme ?? user.theme;
  const cardId = uuidv4();
  const now = new Date().toISOString();

  const card: Card = {
    id: cardId,
    userId,
    word: sanitised,
    theme: cardTheme,
    reading: '',
    meaning: '',
    jlptLevel: 'unknown',
    partOfSpeech: 'noun',
    sentences: [],
    mnemonic: '',
    collocations: [],
    ...getInitialSM2Values(),
    createdAt: now,
    updatedAt: now,
    deleted: false,
    enrichmentStatus: 'pending',
  };

  await saveCard(card);

  try {
    const result = await enrichCard(sanitised, cardTheme, user.targetJLPT);
    const enriched = applyEnrichment(card, result);
    await saveCard(enriched);
    return NextResponse.json({ card: enriched }, { status: 201 });
  } catch (err) {
    const failed = { ...card, enrichmentStatus: 'error' as const, updatedAt: new Date().toISOString() };
    await saveCard(failed);
    console.error('Enrichment failed:', err);
    return NextResponse.json({ card: failed, warning: 'Enrichment failed' }, { status: 201 });
  }
}
