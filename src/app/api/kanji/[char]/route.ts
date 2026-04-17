import { NextRequest, NextResponse } from 'next/server';

// Proxy to kanjiapi.dev — free, no key, returns readings + meanings
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ char: string }> }
) {
  const { char } = await params;
  const decoded = decodeURIComponent(char);

  // Only single kanji characters are valid
  if (!decoded || decoded.length !== 1) {
    return NextResponse.json({ error: 'Invalid character' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(decoded)}`,
      {
        signal: AbortSignal.timeout(4000),
        headers: { 'Accept': 'application/json' },
      }
    );
    if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=86400' }, // kanji data never changes
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch kanji data' }, { status: 502 });
  }
}
