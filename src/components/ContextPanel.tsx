'use client';
import { useEffect, useState } from 'react';
import { CulturalReference } from '@/lib/types';

interface ContextCard {
  title: string;
  type: string;
  image?: string;
  description?: string;
  url?: string;
}

interface Props {
  references: CulturalReference[];
  word: string;
}

export default function ContextPanel({ references, word }: Props) {
  const [cards, setCards] = useState<ContextCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded || references.length === 0) return;
    if (cards.length > 0) return;

    setLoading(true);
    const refsParam = references
      .map((r) => `${encodeURIComponent(r.title)}|${r.type}`)
      .join(',');
    fetch(`/api/context?refs=${refsParam}`)
      .then((r) => r.json())
      .then((d) => { setCards(d.results ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [expanded, references, cards.length]);

  if (references.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-xs font-semibold transition-colors"
        style={{ color: '#9060f0' }}
      >
        <span>{expanded ? '▾' : '▸'}</span>
        <span>{word} in the wild ({references.length})</span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {loading && (
            <p className="text-xs text-[#3a3a5a] py-2 animate-pulse">Loading context…</p>
          )}

          {!loading && cards.length === 0 && (
            <p className="text-xs text-[#3a3a5a]">No preview available.</p>
          )}

          {cards.map((card, i) => {
            const ref = references[i];
            return (
              <a
                key={card.title}
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 rounded-xl p-3 transition-all group"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={(e) => e.currentTarget.style.border = '1px solid rgba(144,96,240,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
              >
                {card.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-14 h-14 object-cover rounded-lg shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-[#e0d8f0] truncate">{card.title}</span>
                    <span className="text-xs text-[#3a3a5a] capitalize shrink-0">({ref?.type})</span>
                  </div>
                  {ref?.usage && (
                    <p className="text-xs italic mb-0.5" style={{ color: '#9060f0' }}>{ref.usage}</p>
                  )}
                  {card.description && (
                    <p className="text-xs text-[#5a5a7a] leading-snug line-clamp-2">{card.description}</p>
                  )}
                </div>
              </a>
            );
          })}

          <a
            href={`https://twitter.com/search?q=${encodeURIComponent(word)}&lang=ja&f=live`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-[#3a3a5a] hover:text-[#5a5a7a] pt-1 transition-colors"
          >
            <span className="font-bold">𝕏</span>
            <span>Search live Japanese posts for {word}</span>
          </a>
        </div>
      )}
    </div>
  );
}
