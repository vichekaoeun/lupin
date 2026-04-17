'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* ── Floating kanji background ─────────────────────────────────────────── */
const KANJI = ['語', '学', '文', '字', '知', '心', '夢', '月', '星', '空', '道', '花', '風', '謎', '盗', '影'];

function KanjiField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {KANJI.map((k, i) => {
        const x = (i * 6.25 + 2) % 100;
        const y = (i * 11.3 + 5) % 90;
        const size = 48 + (i % 5) * 28;
        const dur = 6 + (i % 5) * 2.5;
        const delay = -(i * 1.3);
        return (
          <span
            key={i}
            className="absolute font-serif text-[#f0c040]"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              fontSize: size,
              animation: `kanji-float ${dur}s ease-in-out ${delay}s infinite`,
              opacity: 0.06,
            }}
          >
            {k}
          </span>
        );
      })}
    </div>
  );
}

/* ── Typewriter ─────────────────────────────────────────────────────────── */
const PHRASES = [
  'through anime.',
  'through gaming.',
  'through idol culture.',
  'through manga.',
  'through street fashion.',
];

function Typewriter() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    if (!deleting && displayed.length < phrase.length) {
      timeout.current = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === phrase.length) {
      timeout.current = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    }
    return () => { if (timeout.current) clearTimeout(timeout.current); };
  }, [displayed, deleting, phraseIdx]);

  return (
    <span className="text-[#00c8e0]">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

/* ── Feature cards ──────────────────────────────────────────────────────── */
const FEATURES = [
  {
    color: 'glow-border-gold',
    accent: '#f0c040',
    tag: 'Memory',
    jp: '記憶',
    desc: 'SM-2 spaced repetition schedules each word at the exact moment before you forget it.',
  },
  {
    color: 'glow-border-red',
    accent: '#e63030',
    tag: 'Culture',
    jp: '文化',
    desc: 'Every card is grounded in anime, gaming, idol groups, manga, or street fashion.',
  },
  {
    color: 'glow-border-teal',
    accent: '#00c8e0',
    tag: 'AI',
    jp: '知能',
    desc: 'Claude generates readings, mnemonics, 3 example sentences, and cultural references.',
  },
  {
    color: 'glow-border-purple',
    accent: '#9060f0',
    tag: 'Audio',
    jp: '音',
    desc: 'Hear every word spoken in natural Japanese as you study. Pronunciation built-in.',
  },
];

/* ── Demo card (animated preview) ──────────────────────────────────────── */
function DemoCard() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setFlipped((f) => !f), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="card-flip cursor-pointer w-64 mx-auto"
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className={`card-flip-inner animate-card-breathe ${flipped ? 'flipped' : ''}`}
        style={{ height: 200 }}
      >
        {/* Front */}
        <div className="card-face absolute inset-0 glass glow-border-gold rounded-2xl flex flex-col items-center justify-center gap-3">
          <span className="text-xs text-[#f0c04099] tracking-[0.2em] uppercase">N3</span>
          <p className="font-serif text-5xl text-[#f0f0f8]" style={{ fontFamily: 'serif' }}>謎</p>
          <span className="text-xs text-[#4a4a6a]">tap to reveal</span>
        </div>
        {/* Back */}
        <div className="card-face card-back absolute inset-0 glass glow-border-teal rounded-2xl flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-[#00c8e0] text-sm font-medium tracking-widest">なぞ</p>
          <p className="text-[#f0f0f8] font-semibold">mystery; riddle; enigma</p>
          <p className="text-[#4a4a6a] text-xs leading-relaxed mt-1">
            &ldquo;この謎を解いてみせる&rdquo; — I&apos;ll solve this mystery.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07070f] text-[#e8e0f0] overflow-x-hidden">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ background: 'linear-gradient(to bottom, #07070fcc, transparent)' }}
      >
        <span className="shimmer-gold font-serif italic text-2xl tracking-wide select-none">Lupin</span>
        <Link
          href="/login"
          className="text-sm border border-[#f0c04040] text-[#f0c040] hover:bg-[#f0c04015] hover:border-[#f0c040aa] px-5 py-2 rounded-full transition-all duration-300"
        >
          Sign in →
        </Link>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center">

        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            style={{ filter: 'brightness(0.25) saturate(1.4) hue-rotate(10deg)' }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, #1a0a3044 0%, transparent 70%)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070f] via-transparent to-[#07070f66]" />
        </div>

        {/* Animated scan line */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute left-0 right-0 h-32"
            style={{
              background: 'linear-gradient(to bottom, transparent, #f0c04008, transparent)',
              animation: 'scan-line 8s linear infinite',
            }}
          />
        </div>

        <KanjiField />

        {/* Hero copy */}
        <div className="relative z-10 px-8 pt-32 pb-16 max-w-5xl mx-auto w-full">

          {/* Eyebrow */}
          <div className="animate-slide-up flex items-center gap-3 mb-8">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-[#e63030]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#e63030]"
                style={{ animation: 'ping-slow 2s cubic-bezier(0,0,0.2,1) infinite' }} />
            </div>
            <span className="text-xs tracking-[0.3em] uppercase text-[#9060f0]">
              Japanese vocabulary · AI-powered · Subculture
            </span>
          </div>

          {/* Title */}
          <h1 className="animate-slide-up delay-100 font-serif italic leading-none mb-6 select-none"
            style={{ fontSize: 'clamp(5rem, 16vw, 14rem)' }}
          >
            <span className="shimmer-gold animate-glow-pulse">Lupin</span>
          </h1>

          {/* Tagline */}
          <p className="animate-slide-up delay-200 text-xl sm:text-2xl text-[#9090b0] mb-4 max-w-xl leading-relaxed">
            Learn Japanese{' '}
            <Typewriter />
          </p>

          <p className="animate-slide-up delay-300 text-sm text-[#4a4a6a] mb-10 max-w-md">
            Every word enriched with AI — readings, mnemonics, example sentences, cultural context, and pronunciation.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up delay-500 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="group relative overflow-hidden bg-[#f0c040] hover:bg-[#f8d060] text-[#07070f] font-bold px-8 py-3.5 rounded-full text-sm transition-all duration-300"
              style={{ boxShadow: '0 0 30px #f0c04055, 0 4px 20px #f0c04030' }}
            >
              <span className="relative z-10">Start for free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            <Link
              href="/login"
              className="text-sm text-[#6a6a8a] hover:text-[#9090b0] transition-colors"
            >
              Already have an account →
            </Link>
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="relative z-10 flex justify-center pb-12 animate-fade-in delay-900">
          <div className="flex flex-col items-center gap-3 text-[#2a2a4a]"
            style={{ animation: 'card-breathe 3s ease-in-out infinite' }}
          >
            <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <path d="M8 0v20M1 13l7 8 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────── */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <p className="text-center text-xs tracking-[0.3em] uppercase text-[#4a4a6a] mb-16">
          Everything you need to retain Japanese
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ color, accent, tag, jp, desc }) => (
            <div
              key={tag}
              className={`glass ${color} rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300 cursor-default`}
            >
              <div className="flex items-end justify-between mb-6">
                <span
                  className="font-serif italic text-4xl font-bold opacity-20 group-hover:opacity-40 transition-opacity leading-none"
                  style={{ color: accent }}
                >
                  {jp}
                </span>
              </div>
              <p className="text-xs tracking-[0.2em] uppercase mb-2 font-semibold" style={{ color: accent }}>
                {tag}
              </p>
              <p className="text-sm text-[#6a6a8a] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo + How it works ───────────────────────────────────────── */}
      <section className="px-8 py-16 max-w-6xl mx-auto">
        <div className="rounded-3xl overflow-hidden glass glow-border-gold"
          style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #130a1f 50%, #0a0f18 100%)' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Demo card */}
            <div className="flex flex-col items-center justify-center p-16 border-b lg:border-b-0 lg:border-r border-[#ffffff0a]">
              <p className="text-xs tracking-[0.2em] uppercase text-[#4a4a6a] mb-8">Live preview</p>
              <DemoCard />
              <p className="text-xs text-[#2a2a4a] mt-6">Card auto-flips every 3 seconds</p>
            </div>

            {/* Steps */}
            <div className="p-12 flex flex-col justify-center space-y-8">
              <h2 className="font-serif italic text-3xl text-[#e8e0f0]">
                How it works
              </h2>
              {[
                { n: '01', color: '#f0c040', t: 'Add a word',        d: 'Type any Japanese word. Pick a subculture theme.' },
                { n: '02', color: '#e63030', t: 'AI builds the card', d: 'Claude generates readings, sentences, mnemonics, and cultural references with images.' },
                { n: '03', color: '#00c8e0', t: 'Review on schedule', d: 'SM-2 surfaces each card at the exact optimal moment.' },
                { n: '04', color: '#9060f0', t: 'See it in the wild', d: 'Anime, games, artists — real context for every word.' },
              ].map(({ n, color, t, d }) => (
                <div key={n} className="flex gap-5 group">
                  <span
                    className="font-serif italic text-2xl shrink-0 w-8 opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ color }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="font-semibold text-[#c0c0d8] mb-1 text-sm">{t}</p>
                    <p className="text-xs text-[#4a4a6a] leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-8 py-32 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(ellipse, #9060f020 0%, #f0c04010 50%, transparent 70%)' }}
          />
        </div>

        <p className="relative text-xs tracking-[0.3em] uppercase text-[#4a4a6a] mb-6">
          Ready to begin?
        </p>
        <h2
          className="relative font-serif italic mb-4 leading-none"
          style={{ fontSize: 'clamp(3rem, 10vw, 8rem)' }}
        >
          <span className="shimmer-gold">始めましょう</span>
        </h2>
        <p className="relative text-[#3a3a5a] text-sm tracking-widest uppercase mb-12">
          Let&apos;s begin
        </p>
        <Link
          href="/login"
          className="relative inline-block bg-[#f0c040] hover:bg-[#f8d060] text-[#07070f] font-bold px-12 py-4 rounded-full text-sm transition-all duration-300"
          style={{ boxShadow: '0 0 40px #f0c04055, 0 8px 30px #f0c04030' }}
        >
          Start learning for free
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="px-8 py-8 border-t border-[#ffffff08] flex items-center justify-between max-w-6xl mx-auto">
        <span className="shimmer-gold font-serif italic text-lg">Lupin</span>
        <p className="text-xs text-[#2a2a4a]">Japanese vocabulary through subculture</p>
      </footer>

    </div>
  );
}
