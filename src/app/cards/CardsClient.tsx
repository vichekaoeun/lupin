'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CardBadge from '@/components/CardBadge';
import { Card, JLPTLevel } from '@/lib/types';
import { useRouter } from 'next/navigation';

const JLPT_FILTERS: (JLPTLevel | 'all')[] = ['all', 'N5', 'N4', 'N3', 'N2', 'N1'];
const JLPT_COLORS: Record<string, string> = {
  N5: '#00d084', N4: '#00c8e0', N3: '#f0c040', N2: '#f07030', N1: '#e63030',
};

interface EditState {
  reading: string;
  meaning: string;
  mnemonic: string;
  collocations: string;
}

export default function CardsClient() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JLPTLevel | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = filter !== 'all' ? `?jlpt=${filter}` : '';
    fetch(`/api/cards${params}`)
      .then((r) => r.json())
      .then((d) => { setCards(d.cards ?? []); setLoading(false); });
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this card?')) return;
    await fetch(`/api/cards/${id}`, { method: 'DELETE' });
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUnsuspend = async (card: Card) => {
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspended: false }),
    });
    if (res.ok) {
      const { card: updated } = await res.json();
      setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    }
  };

  const startEdit = (card: Card) => {
    setEditingId(card.id);
    setEditState({
      reading: card.reading,
      meaning: card.meaning,
      mnemonic: card.mnemonic,
      collocations: card.collocations.join(', '),
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditState(null); };

  const saveEdit = async (card: Card) => {
    if (!editState) return;
    setSavingId(card.id);
    const body = {
      reading: editState.reading.trim(),
      meaning: editState.meaning.trim(),
      mnemonic: editState.mnemonic.trim(),
      collocations: editState.collocations.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { card: updated } = await res.json();
      setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      setEditingId(null);
      setEditState(null);
    }
    setSavingId(null);
  };

  const handleExport = (format: 'csv' | 'anki') => {
    window.open(`/api/export?format=${format}`, '_blank');
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = cards.filter((c) =>
    !search ||
    c.word.includes(search) ||
    c.reading.includes(search) ||
    c.meaning.toLowerCase().includes(search.toLowerCase())
  );

  const panel = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' };
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e0d8f0' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e0d8f0]">My Cards</h1>
          <p className="text-[#3a3a5a] text-sm mt-0.5">{cards.length} card{cards.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <>
              <button onClick={() => handleExport('csv')}
                className="text-xs text-[#5a5a7a] hover:text-[#a0a0c0] px-3 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                ↓ CSV
              </button>
              <button onClick={() => handleExport('anki')}
                className="text-xs text-[#5a5a7a] hover:text-[#a0a0c0] px-3 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                ↓ Anki
              </button>
            </>
          )}
          <Link href="/add"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#0a0a14] transition-all"
            style={{ background: '#f0c040', boxShadow: '0 0 16px #f0c04044' }}>
            ＋ Add Word
          </Link>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search words, readings, meanings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2 text-sm outline-none transition-all placeholder:text-[#2a2a3a]"
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
          onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
        />
        <div className="flex gap-1.5 flex-wrap">
          {JLPT_FILTERS.map((lvl) => {
            const color = lvl !== 'all' ? JLPT_COLORS[lvl] : '#f0c040';
            const active = filter === lvl;
            return (
              <button key={lvl} onClick={() => setFilter(lvl)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={active
                  ? { background: color, color: '#0a0a14', border: `1px solid ${color}` }
                  : { background: 'rgba(255,255,255,0.04)', color: '#5a5a7a', border: '1px solid rgba(255,255,255,0.08)' }
                }>
                {lvl === 'all' ? 'All' : lvl}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center text-[#3a3a5a] py-12 text-sm">Loading cards…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#3a3a5a] text-sm">
            {cards.length === 0 ? 'No cards yet — add your first word!' : 'No cards match your filter.'}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((card) => {
          const isDue = card.nextReview <= today && card.enrichmentStatus === 'complete' && !card.suspended;
          const isExpanded = expandedId === card.id;
          const isEditing = editingId === card.id;

          return (
            <div key={card.id} className="rounded-2xl overflow-hidden transition-all" style={panel}>
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4 transition-colors hover:bg-white/[0.02]"
                onClick={() => {
                  if (!isExpanded) setEditingId(null);
                  setExpandedId(isExpanded ? null : card.id);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="jp text-xl font-bold text-[#e0d8f0]">{card.word}</span>
                    <span className="jp text-sm text-[#3a3a5a]">{card.reading}</span>
                    <CardBadge level={card.jlptLevel} />
                    {isDue && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(240,192,64,0.15)', color: '#f0c040', border: '1px solid rgba(240,192,64,0.3)' }}>
                        Due
                      </span>
                    )}
                    {card.suspended && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(230,48,48,0.1)', color: '#e63030', border: '1px solid rgba(230,48,48,0.3)' }}>
                        Leech
                      </span>
                    )}
                    {card.enrichmentStatus === 'pending' && (
                      <span className="text-xs px-2 py-0.5 rounded-full text-[#3a3a5a]"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        Enriching…
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#5a5a7a] mt-0.5 truncate">{card.meaning}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-[#3a3a5a]">Next review</p>
                  <p className="text-xs font-medium text-[#5a5a7a]">{card.nextReview}</p>
                </div>
                <svg className={`w-4 h-4 text-[#3a3a5a] shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 pt-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {[
                      { label: 'Part of speech', value: card.partOfSpeech },
                      { label: 'Interval', value: `${card.interval}d` },
                      { label: 'Ease factor', value: card.easeFactor.toFixed(2) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-[#3a3a5a] mb-0.5">{label}</p>
                        <p className="font-medium text-[#8080a0]">{value}</p>
                      </div>
                    ))}
                  </div>

                  {card.suspended && (
                    <div className="rounded-xl p-3 flex items-center justify-between"
                      style={{ background: 'rgba(230,48,48,0.08)', border: '1px solid rgba(230,48,48,0.2)' }}>
                      <div>
                        <p className="text-sm font-semibold text-[#e63030]">Leech card suspended</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(230,48,48,0.7)' }}>
                          Failed {card.failCount ?? 0} times — removed from your review queue.
                        </p>
                      </div>
                      <button onClick={() => handleUnsuspend(card)}
                        className="shrink-0 ml-3 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(230,48,48,0.15)', color: '#e63030', border: '1px solid rgba(230,48,48,0.3)' }}>
                        Unsuspend
                      </button>
                    </div>
                  )}

                  {isEditing && editState ? (
                    <div className="space-y-3 rounded-xl p-4"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Editing card</p>
                      {[
                        { label: 'Reading (hiragana/katakana)', key: 'reading', jp: true },
                        { label: 'Meaning', key: 'meaning', jp: false },
                        { label: 'Mnemonic', key: 'mnemonic', jp: false },
                        { label: 'Collocations (comma-separated)', key: 'collocations', jp: true },
                      ].map(({ label, key, jp }) => (
                        <div key={key}>
                          <label className="text-xs text-[#3a3a5a] mb-1 block">{label}</label>
                          <input
                            type="text"
                            value={(editState as Record<string, string>)[key]}
                            onChange={(e) => setEditState((s) => s ? { ...s, [key]: e.target.value } : s)}
                            className={`${jp ? 'jp ' : ''}w-full rounded-lg px-3 py-2 text-sm outline-none transition-all`}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e0d8f0' }}
                            onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
                            onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => saveEdit(card)} disabled={savingId === card.id}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold text-[#0a0a14] disabled:opacity-50 transition-all"
                          style={{ background: '#f0c040' }}>
                          {savingId === card.id ? 'Saving…' : 'Save changes'}
                        </button>
                        <button onClick={cancelEdit}
                          className="flex-1 py-2 rounded-lg text-sm font-medium text-[#5a5a7a] transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {card.mnemonic && (
                        <div className="rounded-xl p-3 text-sm"
                          style={{ background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.2)' }}>
                          <span className="font-semibold text-[#f0c040]">Mnemonic: </span>
                          <span className="text-[#c0b870]">{card.mnemonic}</span>
                        </div>
                      )}
                      {card.sentences.length > 0 && (
                        <div className="space-y-2">
                          {card.sentences.map((s, i) => (
                            <div key={i} className="pl-3 space-y-0.5"
                              style={{ borderLeft: '2px solid rgba(240,192,64,0.3)' }}>
                              <p className="jp text-sm text-[#e0d8f0]">{s.japanese}</p>
                              <p className="jp text-xs text-[#3a3a5a]">{s.furigana}</p>
                              <p className="text-sm text-[#8080a0]">{s.english}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {card.collocations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {card.collocations.map((c, i) => (
                            <span key={i} className="jp text-xs px-2.5 py-1 rounded-full text-[#5a5a7a]"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-3 pt-1">
                      <button onClick={() => router.push(`/cards/${card.id}`)}
                        className="text-xs text-[#5a5a7a] hover:text-[#a0a0c0] transition-colors">
                        View details
                      </button>
                      <span className="text-[#2a2a3a]">|</span>
                      <button onClick={() => startEdit(card)}
                        className="text-xs transition-colors" style={{ color: '#00c8e0' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#40e0f8'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#00c8e0'}>
                        Edit
                      </button>
                      <span className="text-[#2a2a3a]">|</span>
                      <button onClick={() => handleDelete(card.id)}
                        className="text-xs transition-colors" style={{ color: '#e63030' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ff5050'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#e63030'}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
