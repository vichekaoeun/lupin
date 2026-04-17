'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CardBadge from '@/components/CardBadge';
import ChatScene from '@/components/ChatScene';
import { Card, SubcultureTheme } from '@/lib/types';

const THEMES: SubcultureTheme[] = ['anime', 'gaming', 'idol groups', 'manga', 'street fashion', 'general'];


export default function AddWordClient() {
  const router = useRouter();
  const [word, setWord] = useState('');
  const [theme, setTheme] = useState<SubcultureTheme>('anime');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Card | null>(null);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim(), theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setResult(data.card);
      setWord('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const panel = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#e0d8f0]">Add a New Word</h1>
        <p className="text-[#3a3a5a] text-sm mt-0.5">
          Enter a Japanese word and AI will build a full vocabulary card.
        </p>
      </div>

      <div className="rounded-2xl p-6 relative overflow-hidden" style={panel}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #f0c04044, transparent)' }} />

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#5a5a7a] uppercase tracking-widest mb-2">
              Japanese word or phrase
            </label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. 推し, やばい, 気合い"
              maxLength={100}
              className="jp w-full rounded-xl px-4 py-3 text-lg text-[#e0d8f0] placeholder:text-[#2a2a3a] outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
              onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
            />
            <p className="text-xs text-[#3a3a5a] mt-1.5">{word.length}/100</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a5a7a] uppercase tracking-widest mb-3">
              Cultural theme for examples
            </label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={theme === t
                    ? { background: '#f0c040', color: '#0a0a14', border: '1px solid #f0c040' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#5a5a7a', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !word.trim()}
            className="w-full rounded-xl py-3 font-semibold text-sm text-[#0a0a14] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: '#f0c040', boxShadow: '0 0 20px #f0c04044' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#0a0a14]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enriching with AI…
              </>
            ) : (
              'Create Card'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-[#e63030]"
          style={{ background: 'rgba(230,48,48,0.08)', border: '1px solid rgba(230,48,48,0.2)' }}>
          {error}
        </div>
      )}

      {result && result.enrichmentStatus === 'complete' && (
        <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden animate-fade-in" style={panel}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #00d08455, transparent)' }} />

          <div className="flex items-start justify-between">
            <div>
              <p className="jp text-3xl font-bold text-[#e0d8f0]">{result.word}</p>
              <p className="jp text-base text-[#5a5a7a] mt-0.5">{result.reading}</p>
            </div>
            <CardBadge level={result.jlptLevel} />
          </div>

          <div>
            <p className="text-lg font-semibold text-[#e0d8f0]">{result.meaning}</p>
            <p className="text-xs text-[#3a3a5a] uppercase tracking-widest mt-0.5">{result.partOfSpeech}</p>
          </div>

          {result.mnemonic && (
            <div className="rounded-xl p-3 text-sm"
              style={{ background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.2)' }}>
              <span className="font-semibold text-[#f0c040]">Mnemonic: </span>
              <span className="text-[#c0b870]">{result.mnemonic}</span>
            </div>
          )}

          {result.sentences.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Example Sentences</p>
              {result.sentences.map((s, i) => (
                <div key={i} className="pl-3 space-y-0.5" style={{ borderLeft: '2px solid rgba(240,192,64,0.3)' }}>
                  <p className="jp text-sm text-[#e0d8f0]">{s.japanese}</p>
                  <p className="jp text-xs text-[#3a3a5a]">{s.furigana}</p>
                  <p className="text-sm text-[#8080a0]">{s.english}</p>
                  {s.context && <p className="text-xs text-[#3a3a5a] italic">{s.context}</p>}
                </div>
              ))}
            </div>
          )}

          {result.collocations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.collocations.map((c, i) => (
                <span key={i} className="jp text-xs px-2.5 py-1 rounded-full text-[#5a5a7a]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {c}
                </span>
              ))}
            </div>
          )}

          {result.chatScene && result.chatScene.messages?.length > 0 && (
            <ChatScene scene={result.chatScene} word={result.word} />
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push('/cards')}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#a0a0c0] transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              View All Cards
            </button>
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#0a0a14] transition-all"
              style={{ background: '#f0c040', boxShadow: '0 0 16px #f0c04044' }}
            >
              Add Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
