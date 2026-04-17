import { NextRequest, NextResponse } from 'next/server';
import { getCard, saveCard, deleteCard } from '@/lib/store';
import { getUserId, AuthError } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }

  const { cardId } = await params;
  const card = await getCard(cardId, userId);
  if (!card || card.deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ card });
}

export async function PUT(
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

  const body = await req.json();
  const allowed = ['reading', 'meaning', 'jlptLevel', 'partOfSpeech', 'sentences', 'mnemonic', 'collocations', 'suspended'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const updated = { ...card, ...updates, updatedAt: new Date().toISOString() };
  await saveCard(updated);
  return NextResponse.json({ card: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }

  const { cardId } = await params;
  await deleteCard(cardId, userId);
  return NextResponse.json({ success: true });
}
