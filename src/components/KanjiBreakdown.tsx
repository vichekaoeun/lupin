'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;

interface KanjiData {
  kanji: string;
  meanings: string[];
  kun_readings: string[];
  on_readings: string[];
  jlpt: number | null;
  stroke_count: number;
}

interface TooltipState {
  char: string;
  data: KanjiData | null;
  loading: boolean;
  x: number;
  y: number;
  charHeight: number;
}

const cache = new Map<string, KanjiData>();

const JLPT_BADGE_STYLES: Record<number, { bg: string; color: string }> = {
  1: { bg: 'rgba(230,48,48,0.15)',  color: '#e63030' },
  2: { bg: 'rgba(240,112,48,0.15)', color: '#f07030' },
  3: { bg: 'rgba(240,192,64,0.15)', color: '#f0c040' },
  4: { bg: 'rgba(0,200,224,0.15)',  color: '#00c8e0' },
  5: { bg: 'rgba(0,208,132,0.15)',  color: '#00d084' },
};

function JLPTBadge({ level }: { level: number | null }) {
  if (!level) return null;
  const s = JLPT_BADGE_STYLES[level] ?? { bg: 'rgba(255,255,255,0.06)', color: '#5a5a7a' };
  return (
    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}44` }}>
      N{level}
    </span>
  );
}

const NAV_HEIGHT = 56; // h-14
const TOOLTIP_APPROX_HEIGHT = 180;

function Tooltip({ state }: { state: TooltipState }) {
  const { data, loading, char, x, y, charHeight } = state;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // Flip below the character when there isn't enough room above the nav
  const showBelow = (y - 12 - TOOLTIP_APPROX_HEIGHT) < NAV_HEIGHT;
  const top = showBelow ? y + charHeight + 8 : y - 12;
  const transform = showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';

  const el = (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ left: x, top, transform }}
    >
      {/* Arrow — points toward the character */}
      {showBelow ? (
        <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-full">
          <div className="border-8 border-transparent border-b-[#1a1a2e]" style={{ marginBottom: -1 }} />
        </div>
      ) : (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full">
          <div className="border-8 border-transparent border-t-[#1a1a2e]" style={{ marginTop: -1 }} />
        </div>
      )}

      <div className="rounded-2xl shadow-2xl p-4 w-64"
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
        {loading && (
          <div className="flex items-center justify-center h-16 text-[#5a5a7a]">
            <span className="jp animate-pulse text-2xl text-[#f0c040]">{char}</span>
          </div>
        )}
        {!loading && !data && (
          <p className="text-xs text-[#3a3a5a] text-center py-2">No data for &ldquo;{char}&rdquo;</p>
        )}
        {!loading && data && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="jp text-5xl font-bold text-[#e0d8f0] leading-none">{data.kanji}</span>
              <div className="flex flex-col items-end gap-1 pt-1">
                <JLPTBadge level={data.jlpt} />
                <span className="text-xs text-[#3a3a5a]">{data.stroke_count} strokes</span>
              </div>
            </div>

            <p className="text-sm font-semibold leading-snug" style={{ color: '#f0c040' }}>
              {data.meanings.slice(0, 3).join(' · ')}
            </p>

            {data.kun_readings.length > 0 && (
              <div>
                <span className="text-xs text-[#3a3a5a] uppercase tracking-wider">Kun </span>
                <span className="jp text-sm" style={{ color: '#00c8e0' }}>{data.kun_readings.slice(0, 4).join('、')}</span>
              </div>
            )}
            {data.on_readings.length > 0 && (
              <div>
                <span className="text-xs text-[#3a3a5a] uppercase tracking-wider">On </span>
                <span className="jp text-sm" style={{ color: '#f07030' }}>{data.on_readings.slice(0, 4).join('、')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
  return createPortal(el, document.body);
}

interface Props {
  word: string;
  className?: string;
}

export default function KanjiBreakdown({ word, className = '' }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(async (char: string, e: React.MouseEvent) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!KANJI_RE.test(char)) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const tooltipHalfWidth = 128;
    const x = Math.min(
      Math.max(rect.left + rect.width / 2, tooltipHalfWidth + 8),
      window.innerWidth - tooltipHalfWidth - 8
    );
    const y = rect.top;

    setTooltip({ char, data: cache.get(char) ?? null, loading: !cache.has(char), x, y, charHeight: rect.height });

    if (cache.has(char)) return;

    try {
      const res = await fetch(`/api/kanji/${encodeURIComponent(char)}`);
      if (res.ok) {
        const data: KanjiData = await res.json();
        cache.set(char, data);
        setTooltip((prev) => prev?.char === char ? { ...prev, data, loading: false } : prev);
      } else {
        cache.set(char, null as unknown as KanjiData);
        setTooltip((prev) => prev?.char === char ? { ...prev, data: null, loading: false } : prev);
      }
    } catch {
      setTooltip((prev) => prev?.char === char ? { ...prev, data: null, loading: false } : prev);
    }
  }, []);

  const hideTooltip = useCallback(() => {
    hideTimer.current = setTimeout(() => setTooltip(null), 120);
  }, []);

  return (
    <>
      <span className={className}>
        {Array.from(word).map((char, i) => {
          const isKanji = KANJI_RE.test(char);
          return (
            <span
              key={i}
              className={isKanji
                ? 'cursor-help border-b-2 border-dashed transition-colors'
                : ''}
              style={isKanji ? { borderColor: 'rgba(240,192,64,0.4)' } : undefined}
              onMouseEnter={isKanji ? (e) => showTooltip(char, e) : undefined}
              onMouseLeave={isKanji ? hideTooltip : undefined}
            >
              {char}
            </span>
          );
        })}
      </span>
      {tooltip && <Tooltip state={tooltip} />}
    </>
  );
}
