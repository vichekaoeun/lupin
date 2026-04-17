import { NextRequest, NextResponse } from 'next/server';
import { getCard, saveCard } from '@/lib/store';
import { getUserId, AuthError } from '@/lib/auth';
import { enrichCard, applyEnrichment } from '@/lib/enrichment';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }

  const { cardId } = await params;
  const card = await getCard(cardId, userId);
  if (!card || card.deleted || card.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Rate limit: 10 Bedrock re-enrichments per day per user
  const { allowed } = await rateLimit(`cards:enrich:${userId}`, 10, 60 * 60 * 24);
  if (!allowed) return tooManyRequests(60 * 60 * 24);

  try {
    const result = await enrichCard(card.word, card.theme ?? 'anime', card.jlptLevel ?? 'N3');
    const enriched = applyEnrichment(card, result);
    await saveCard(enriched);
    return NextResponse.json({ card: enriched });
  } catch (err) {
    return NextResponse.json(
      { error: 'Enrichment failed', detail: (err as Error).message },
      { status: 502 }
    );
  }
}
