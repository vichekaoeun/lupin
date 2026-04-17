'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import CardBadge from '@/components/CardBadge';
import ContextLinks from '@/components/ContextLinks';
import ContextPanel from '@/components/ContextPanel';
import PronounceButton from '@/components/PronounceButton';
import KanjiBreakdown from '@/components/KanjiBreakdown';
import ChatScene from '@/components/ChatScene';
import { Card, CulturalReference } from '@/lib/types';

type Phase = 'loading' | 'empty' | 'question' | 'answer' | 'done';

const QUALITY_BTNS: { q: number; label: string; desc: string; color: string; glow: string }[] = [
  { q: 0, label: 'Blackout', desc: 'Complete blank',      color: '#e63030', glow: '#e6303044' },
  { q: 1, label: 'Wrong',    desc: 'Wrong but familiar',  color: '#e63030', glow: '#e6303033' },
  { q: 2, label: 'Hard',     desc: 'Almost right',        color: '#f07030', glow: '#f0703044' },
  { q: 3, label: 'Good',     desc: 'Correct with effort', color: '#f0c040', glow: '#f0c04044' },
  { q: 4, label: 'Easy',     desc: 'Slight hesitation',   color: '#00d084', glow: '#00d08444' },
  { q: 5, label: 'Perfect',  desc: 'Instant recall',      color: '#00d084', glow: '#00d08455' },
];

export default function ReviewClient() {
  const [queue, setQueue] = useState<Card[]>([]);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [flipped, setFlipped] = useState(false);
  const [streak, setStreak] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [isFreeMode, setIsFreeMode] = useState(false);

  const phaseRef = useRef(phase);
  const submittingRef = useRef(false);
  phaseRef.current = phase;

  const load = useCallback(async (mode?: 'free') => {
    setPhase('loading');
    const url = mode === 'free' ? '/api/quiz?mode=free' : '/api/quiz';
    const res = await fetch(url);
    const data = await res.json();
    const cards: Card[] = data.cards ?? [];
    setQueue(cards);
    setIsFreeMode(mode === 'free');
    setPhase(cards.length === 0 ? 'empty' : 'question');
    setFlipped(false);
    setCurrent(0);
    setReviewed(0);
  }, []);

  useEffect(() => { load(); }, [load]);

  const card = queue[current];
  const total = queue.length;

  const reveal = useCallback(() => {
    setFlipped(true);
    setPhase('answer');
  }, []);

  const submitRating = useCallback(async (quality: number) => {
    if (!card || submittingRef.current) return;
    submittingRef.current = true;
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, quality }),
    });
    const data = await res.json();
    setStreak(data.streak ?? 0);
    setReviewed((r) => r + 1);
    const next = current + 1;
    if (next >= total) {
      setPhase('done');
    } else {
      setCurrent(next);
      setFlipped(false);
      setPhase('question');
    }
    submittingRef.current = false;
  }, [card, current, total]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const p = phaseRef.current;
      if (p === 'question' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        reveal();
      } else if (p === 'answer') {
        const num = parseInt(e.key, 10);
        if (num >= 0 && num <= 5) submitRating(num);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reveal, submitRating]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="font-serif italic text-4xl text-[#f0c040] animate-pulse" style={{ textShadow: '0 0 20px #f0c04066' }}>Lupin</p>
          <p className="text-[#3a3a5a] text-sm tracking-widest uppercase">Loading review session…</p>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (phase === 'empty') {
    return (
      <div className="text-center py-16 space-y-6">
        <p className="font-serif italic text-6xl text-[#f0c040]" style={{ textShadow: '0 0 40px #f0c04055' }}>完</p>
        <div>
          <h2 className="text-xl font-bold text-[#e0d8f0] mb-2">All caught up!</h2>
          <p className="text-[#3a3a5a] text-sm">No cards due today. Come back tomorrow!</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => load('free')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#0a0a14] transition-all"
            style={{ background: '#f0c040', boxShadow: '0 0 20px #f0c04044' }}
          >
            Practice all cards anyway
          </button>
          <Link href="/add"
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-[#a0a0c0] transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Add more words
          </Link>
        </div>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="font-serif italic text-6xl text-[#00d084]" style={{ textShadow: '0 0 40px #00d08455' }}>良</p>
        <div>
          <h2 className="text-xl font-bold text-[#e0d8f0] mb-1">Session complete!</h2>
          <p className="text-[#5a5a7a] text-sm">
            Reviewed <strong className="text-[#e0d8f0]">{reviewed}</strong> card{reviewed !== 1 ? 's' : ''}
            {isFreeMode ? ' (free practice)' : ''}
          </p>
          {!isFreeMode && (
            <p className="text-[#5a5a7a] text-sm mt-1">
              Streak: <strong style={{ color: '#f07030' }}>{streak} day{streak !== 1 ? 's' : ''}</strong>
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard"
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-[#a0a0c0] transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Dashboard
          </Link>
          <Link href="/add"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#0a0a14] transition-all"
            style={{ background: '#f0c040', boxShadow: '0 0 20px #f0c04044' }}>
            Add more words
          </Link>
        </div>
      </div>
    );
  }

  // ── Review session ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#e0d8f0]">
            {isFreeMode ? 'Free Practice' : 'Review Session'}
          </h1>
          {isFreeMode && <p className="text-xs mt-0.5" style={{ color: '#9060f0' }}>Practice mode — all cards</p>}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#5a5a7a]">
          {!isFreeMode && <span style={{ color: '#f07030' }}>{streak} days</span>}
          {!isFreeMode && <span className="text-[#2a2a3a]">·</span>}
          <span>{current + 1} / {total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full rounded-full h-1.5 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${(current / total) * 100}%`,
            background: 'linear-gradient(to right, #f0c040, #f07030)',
            boxShadow: '0 0 8px #f0c04066',
          }} />
      </div>

      {/* Card */}
      {card && (
        <div className="card-flip">
          <div className={`card-flip-inner ${flipped ? 'flipped' : ''}`} style={{ minHeight: 340 }}>

            {/* Front */}
            <div
              className={`card-face absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden${flipped ? ' pointer-events-none' : ''}`}
              style={{
                background: '#111120',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onClick={phase === 'question' ? reveal : undefined}
            >
              {/* Ambient center glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(240,192,64,0.06) 0%, transparent 60%)' }} />
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(to right, transparent, #f0c04055, transparent)' }} />

              <CardBadge level={card.jlptLevel} />
              <KanjiBreakdown word={card.word} className="jp text-6xl font-bold text-[#e0d8f0] mt-5 mb-3 text-center" />
              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                <PronounceButton word={card.word} reading={card.reading} />
              </div>
              <p className="text-xs text-[#2a2a3a] mt-auto tracking-widest uppercase">
                Tap or press <kbd className="rounded px-1 py-0.5 text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>Space</kbd> to reveal
              </p>
            </div>

            {/* Back */}
            <div
              className={`card-face card-back absolute inset-0 rounded-2xl p-6 overflow-y-auto${!flipped ? ' pointer-events-none' : ''}`}
              style={{
                background: '#111120',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(to right, transparent, #00d08455, transparent)' }} />

              <div className="space-y-4 pt-1">
                {/* Word header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <KanjiBreakdown word={card.word} className="jp text-3xl font-bold text-[#e0d8f0]" />
                      <PronounceButton word={card.word} reading={card.reading} size="sm" />
                    </div>
                    <p className="jp text-sm text-[#5a5a7a] mt-0.5">{card.reading}</p>
                  </div>
                  <CardBadge level={card.jlptLevel} />
                </div>

                {/* Meaning */}
                <div>
                  <p className="text-lg font-semibold text-[#e0d8f0]">{card.meaning}</p>
                  <p className="text-xs text-[#3a3a5a] uppercase tracking-widest mt-0.5">{card.partOfSpeech}</p>
                </div>

                {/* Mnemonic */}
                {card.mnemonic && (
                  <div className="rounded-xl p-3 text-sm"
                    style={{ background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.2)' }}>
                    <span className="font-semibold text-[#f0c040]">Mnemonic: </span>
                    <span className="text-[#c0b870]">{card.mnemonic}</span>
                  </div>
                )}

                {/* Sentence */}
                {card.sentences.slice(0, 1).map((s, i) => (
                  <div key={i} className="pl-3 space-y-0.5"
                    style={{ borderLeft: '2px solid rgba(144,96,240,0.4)' }}>
                    <p className="jp text-sm text-[#e0d8f0]">{s.japanese}</p>
                    <p className="jp text-xs text-[#3a3a5a]">{s.furigana}</p>
                    <p className="text-sm text-[#8080a0]">{s.english}</p>
                  </div>
                ))}

                {/* Collocations */}
                {card.collocations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {card.collocations.map((c, i) => (
                      <span key={i} className="jp text-xs px-2 py-0.5 rounded-full text-[#5a5a7a]"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Chat scene */}
                {card.chatScene && card.chatScene.messages?.length > 0 && (
                  <ChatScene scene={card.chatScene} word={card.word} />
                )}

                {/* Cultural context */}
                <ContextPanel
                  references={(card.culturalReferences as CulturalReference[]) ?? []}
                  word={card.word}
                />

                {/* Find more */}
                <div className="pt-1">
                  <p className="text-xs font-semibold text-[#3a3a5a] uppercase tracking-widest mb-2">Find more</p>
                  <ContextLinks word={card.word} theme={card.theme} />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reveal button */}
      {phase === 'question' && (
        <button
          onClick={reveal}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-[#0a0a14] transition-all"
          style={{ background: '#f0c040', boxShadow: '0 0 24px #f0c04055' }}
        >
          Reveal Answer <span className="opacity-60 text-xs font-normal ml-1">(Space)</span>
        </button>
      )}

      {/* Rating buttons */}
      {phase === 'answer' && (
        <div className="space-y-3">
          <p className="text-center text-xs text-[#3a3a5a] font-medium uppercase tracking-widest">How well did you recall it?</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {QUALITY_BTNS.map(({ q, label, desc, color, glow }) => (
              <button
                key={q}
                onClick={() => submitRating(q)}
                className="rounded-xl py-3 flex flex-col items-center transition-all"
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}44`,
                  color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${color}30`;
                  e.currentTarget.style.boxShadow = `0 0 16px ${glow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${color}18`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span className="text-lg font-bold">{q}</span>
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-xs opacity-60 hidden sm:block text-center leading-tight mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-[#2a2a3a]">
            Press <kbd className="rounded px-1 text-[10px]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>0</kbd>
            –<kbd className="rounded px-1 text-[10px]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>5</kbd>
            {' '}on keyboard · 0–2 reset · 3–5 advance interval
          </p>
        </div>
      )}
    </div>
  );
}
