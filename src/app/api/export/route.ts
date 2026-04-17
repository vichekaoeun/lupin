import { NextRequest, NextResponse } from 'next/server';
import { getCardsByUser } from '@/lib/store';
import { getUserId, AuthError } from '@/lib/auth';

function escapeCsv(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeTab(value: string): string {
  return value.replace(/\t/g, ' ').replace(/\n/g, '<br>');
}

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'csv';
  const date = new Date().toISOString().split('T')[0];

  const allCards = await getCardsByUser(userId);
  const cards = allCards.filter((c) => c.enrichmentStatus === 'complete');

  if (format === 'anki') {
    // Anki tab-separated import format (Basic note type)
    // Front: Japanese word + reading
    // Back: meaning, mnemonic, first example sentence, collocations
    const lines = [
      '#separator:Tab',
      '#html:true',
      '#notetype:Basic',
      '#deck:Sakura SRS',
      '#tags column:7',
    ];

    for (const card of cards) {
      const front = escapeTab(`${card.word}<br><span style="color:#888;font-size:0.8em">${card.reading}</span>`);
      const firstSentence = card.sentences[0]
        ? `<br><hr><i>${escapeTab(card.sentences[0].japanese)}</i><br><span style="color:#888;font-size:0.85em">${escapeTab(card.sentences[0].english)}</span>`
        : '';
      const collocations = card.collocations.length
        ? `<br><span style="color:#555;font-size:0.8em">${escapeTab(card.collocations.join(' · '))}</span>`
        : '';
      const mnemonic = card.mnemonic
        ? `<br><span style="color:#856404;font-size:0.85em">💡 ${escapeTab(card.mnemonic)}</span>`
        : '';
      const back = escapeTab(`<b>${card.meaning}</b><br><span style="color:#888;font-size:0.8em">${card.partOfSpeech} · ${card.jlptLevel}</span>${mnemonic}${firstSentence}${collocations}`);
      const tags = `sakura-srs ${card.jlptLevel}`;
      lines.push([front, back, '', '', '', '', tags].join('\t'));
    }

    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="sakura-srs-anki-${date}.txt"`,
      },
    });
  }

  // Default: CSV
  const headers = [
    'id', 'word', 'reading', 'meaning', 'jlptLevel', 'partOfSpeech',
    'mnemonic', 'collocations', 'interval', 'easeFactor', 'repetitions',
    'nextReview', 'failCount', 'suspended', 'enrichmentStatus', 'createdAt',
  ];

  const rows = cards.map((card) => [
    card.id,
    card.word,
    card.reading,
    card.meaning,
    card.jlptLevel,
    card.partOfSpeech,
    card.mnemonic,
    card.collocations.join('; '),
    card.interval,
    card.easeFactor.toFixed(2),
    card.repetitions,
    card.nextReview,
    card.failCount ?? 0,
    card.suspended ?? false,
    card.enrichmentStatus,
    card.createdAt,
  ].map(escapeCsv).join(','));

  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sakura-srs-cards-${date}.csv"`,
    },
  });
}
