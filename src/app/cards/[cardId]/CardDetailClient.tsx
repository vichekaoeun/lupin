'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CardBadge from '@/components/CardBadge';
import ContextLinks from '@/components/ContextLinks';
import ContextPanel from '@/components/ContextPanel';
import PronounceButton from '@/components/PronounceButton';
import KanjiBreakdown from '@/components/KanjiBreakdown';
import ChatScene from '@/components/ChatScene';
import { Card, CulturalReference, JLPTLevel, PartOfSpeech } from '@/lib/types';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1', 'unknown'];
const POS_OPTIONS: PartOfSpeech[] = ['noun', 'verb', 'adjective', 'adverb', 'expression'];

export default function CardDetailClient() {
  const { cardId } = useParams<{ cardId: string }>();
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    reading: '',
    meaning: '',
    jlptLevel: 'unknown' as JLPTLevel,
    partOfSpeech: 'noun' as PartOfSpeech,
    mnemonic: '',
    collocations: '',
  });

  useEffect(() => {
    fetch(`/api/cards/${cardId}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setCard(d.card);
        setForm({
          reading: d.card.reading,
          meaning: d.card.meaning,
          jlptLevel: d.card.jlptLevel,
          partOfSpeech: d.card.partOfSpeech,
          mnemonic: d.card.mnemonic,
          collocations: d.card.collocations.join(', '),
        });
        setLoading(false);
      });
  }, [cardId]);

  const saveEdit = async () => {
    if (!card) return;
    setSaving(true);
    const body = {
      reading: form.reading.trim(),
      meaning: form.meaning.trim(),
      jlptLevel: form.jlptLevel,
      partOfSpeech: form.partOfSpeech,
      mnemonic: form.mnemonic.trim(),
      collocations: form.collocations.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { card: updated } = await res.json();
      setCard(updated);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!card || !confirm('Delete this card permanently?')) return;
    await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
    router.push('/cards');
  };

  const handleUnsuspend = async () => {
    if (!card) return;
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspended: false }),
    });
    if (res.ok) {
      const { card: updated } = await res.json();
      setCard(updated);
    }
  };

  const panel = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' };
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e0d8f0' };
  const selectStyle = { ...inputStyle, appearance: 'none' as const };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="font-serif italic text-4xl text-[#f0c040] animate-pulse" style={{ textShadow: '0 0 20px #f0c04066' }}>Lupin</p>
          <p className="text-[#3a3a5a] text-sm tracking-widest uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="text-lg font-bold text-[#e0d8f0] mb-2">Card not found</h2>
        <Link href="/cards" className="text-sm transition-colors" style={{ color: '#f0c040' }}>Back to My Cards</Link>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isDue = card.nextReview <= today && card.enrichmentStatus === 'complete' && !card.suspended;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/cards" className="text-[#3a3a5a] hover:text-[#f0c040] transition-colors">My Cards</Link>
        <span className="text-[#2a2a3a]">/</span>
        <span className="jp text-[#8080a0] font-medium">{card.word}</span>
      </div>

      {/* Card header */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={panel}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #f0c04055, transparent)' }} />
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <KanjiBreakdown word={card.word} className="jp text-4xl font-bold text-[#e0d8f0]" />
              <PronounceButton word={card.word} reading={card.reading} />
            </div>
            <p className="jp text-base text-[#5a5a7a] mt-1">{card.reading}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CardBadge level={card.jlptLevel} />
            {isDue && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(240,192,64,0.15)', color: '#f0c040', border: '1px solid rgba(240,192,64,0.3)' }}>
                Due today
              </span>
            )}
            {card.suspended && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(230,48,48,0.1)', color: '#e63030', border: '1px solid rgba(230,48,48,0.3)' }}>
                Leech
              </span>
            )}
          </div>
        </div>
        <p className="text-xl font-semibold text-[#e0d8f0]">{card.meaning}</p>
        <p className="text-xs text-[#3a3a5a] uppercase tracking-widest mt-1">{card.partOfSpeech}</p>
      </div>

      {/* Leech warning */}
      {card.suspended && (
        <div className="rounded-2xl p-5 flex items-start justify-between gap-4"
          style={{ background: 'rgba(230,48,48,0.08)', border: '1px solid rgba(230,48,48,0.2)' }}>
          <div>
            <p className="font-semibold text-[#e63030]">Card suspended (leech)</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(230,48,48,0.7)' }}>
              Failed {card.failCount ?? 0} times — removed from your review queue.
            </p>
          </div>
          <button onClick={handleUnsuspend}
            className="shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(230,48,48,0.15)', color: '#e63030', border: '1px solid rgba(230,48,48,0.3)' }}>
            Unsuspend
          </button>
        </div>
      )}

      {/* Schedule */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={panel}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #00c8e044, transparent)' }} />
        <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest mb-4">Schedule</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Next review', value: card.nextReview },
            { label: 'Interval', value: `${card.interval} day${card.interval !== 1 ? 's' : ''}` },
            { label: 'Ease factor', value: card.easeFactor.toFixed(2) },
            { label: 'Repetitions', value: card.repetitions },
            { label: 'Fail count', value: card.failCount ?? 0 },
            { label: 'Added', value: new Date(card.createdAt).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-[#3a3a5a] mb-0.5">{label}</p>
              <p className="font-medium text-[#8080a0]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mnemonic */}
      {card.mnemonic && (
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.2)' }}>
          <p className="text-xs font-semibold text-[#f0c040] uppercase tracking-widest mb-1">Mnemonic</p>
          <p className="text-[#c0b870]">{card.mnemonic}</p>
        </div>
      )}

      {/* Example sentences */}
      {card.sentences.length > 0 && (
        <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden" style={panel}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #9060f044, transparent)' }} />
          <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Example Sentences</h2>
          {card.sentences.map((s, i) => (
            <div key={i} className="pl-4 space-y-1"
              style={{ borderLeft: '2px solid rgba(144,96,240,0.4)' }}>
              <p className="jp text-base text-[#e0d8f0]">{s.japanese}</p>
              <p className="jp text-sm text-[#3a3a5a]">{s.furigana}</p>
              <p className="text-sm text-[#8080a0]">{s.english}</p>
              {s.context && <p className="text-xs text-[#3a3a5a] italic">{s.context}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Collocations */}
      {card.collocations.length > 0 && (
        <div className="rounded-2xl p-6 relative overflow-hidden" style={panel}>
          <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest mb-3">Collocations</h2>
          <div className="flex flex-wrap gap-2">
            {card.collocations.map((c, i) => (
              <span key={i} className="jp text-sm px-3 py-1.5 rounded-full text-[#8080a0]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chat scene */}
      {card.chatScene && card.chatScene.messages?.length > 0 && (
        <div className="rounded-2xl p-6 relative overflow-hidden" style={panel}>
          <ChatScene scene={card.chatScene} word={card.word} />
        </div>
      )}

      {/* Cultural references */}
      {(card.culturalReferences ?? []).length > 0 && (
        <div className="rounded-2xl p-6 relative overflow-hidden" style={panel}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #00c8e044, transparent)' }} />
          <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest mb-4">
            In {card.theme ?? 'culture'}
          </h2>
          <ContextPanel references={card.culturalReferences as CulturalReference[]} word={card.word} />
        </div>
      )}

      {/* Context links */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={panel}>
        <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest mb-3">Find more</h2>
        <ContextLinks word={card.word} theme={card.theme} />
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden" style={panel}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #f0c04044, transparent)' }} />
          <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Edit Card</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#3a3a5a] uppercase tracking-widest mb-2 block">Reading</label>
              <input type="text" value={form.reading}
                onChange={(e) => setForm((f) => ({ ...f, reading: e.target.value }))}
                className="jp w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label className="text-xs text-[#3a3a5a] uppercase tracking-widest mb-2 block">Meaning</label>
              <input type="text" value={form.meaning}
                onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#3a3a5a] uppercase tracking-widest mb-2 block">JLPT Level</label>
              <select value={form.jlptLevel}
                onChange={(e) => setForm((f) => ({ ...f, jlptLevel: e.target.value as JLPTLevel }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={selectStyle}>
                {JLPT_LEVELS.map((lvl) => <option key={lvl} value={lvl} style={{ background: '#111120' }}>{lvl}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#3a3a5a] uppercase tracking-widest mb-2 block">Part of Speech</label>
              <select value={form.partOfSpeech}
                onChange={(e) => setForm((f) => ({ ...f, partOfSpeech: e.target.value as PartOfSpeech }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={selectStyle}>
                {POS_OPTIONS.map((p) => <option key={p} value={p} style={{ background: '#111120' }}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#3a3a5a] uppercase tracking-widest mb-2 block">Mnemonic</label>
            <textarea value={form.mnemonic}
              onChange={(e) => setForm((f) => ({ ...f, mnemonic: e.target.value }))}
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition-all"
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
              onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'} />
          </div>

          <div>
            <label className="text-xs text-[#3a3a5a] uppercase tracking-widest mb-2 block">Collocations (comma-separated)</label>
            <input type="text" value={form.collocations}
              onChange={(e) => setForm((f) => ({ ...f, collocations: e.target.value }))}
              className="jp w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
              onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'} />
          </div>

          <div className="flex gap-3">
            <button onClick={saveEdit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#0a0a14] disabled:opacity-50 transition-all"
              style={{ background: '#f0c040', boxShadow: '0 0 16px #f0c04044' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={() => setEditing(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#5a5a7a] transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#a0a0c0] transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Edit card
          </button>
          <button onClick={handleDelete}
            className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(230,48,48,0.08)', color: '#e63030', border: '1px solid rgba(230,48,48,0.2)' }}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
