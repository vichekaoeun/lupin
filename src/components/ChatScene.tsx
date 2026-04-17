'use client';
import { useEffect, useState, useRef } from 'react';
import { ChatScene as ChatSceneType } from '@/lib/types';

interface Props {
  scene: ChatSceneType;
  word: string;
}

function TypingBubble({ side, initial }: { side: 'left' | 'right'; initial: string }) {
  return (
    <div className={`flex items-end gap-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={side === 'right'
          ? { background: 'rgba(240,192,64,0.2)', color: '#f0c040' }
          : { background: 'rgba(144,96,240,0.2)', color: '#9060f0' }
        }>
        {initial}
      </div>
      <div className="px-4 py-3 rounded-2xl"
        style={side === 'right'
          ? { background: 'rgba(240,192,64,0.15)', border: '1px solid rgba(240,192,64,0.25)' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
        }>
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: side === 'right' ? '#f0c040' : '#9060f0',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function highlightWord(text: string, word: string) {
  if (!word || !text.includes(word)) return <>{text}</>;
  const parts = text.split(word);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="font-bold" style={{ color: '#f0c040', textDecoration: 'underline', textDecorationColor: 'rgba(240,192,64,0.5)' }}>
              {word}
            </span>
          )}
        </span>
      ))}
    </>
  );
}

export default function ChatScene({ scene, word }: Props) {
  const [visible, setVisible] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [showFurigana, setShowFurigana] = useState(false);
  const [showEnglish, setShowEnglish] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [speaker1, speaker2] = scene.speakers;

  useEffect(() => {
    if (!started || visible >= scene.messages.length) return;
    setShowTyping(true);
    const msg = scene.messages[visible];
    const typingDelay = 500 + msg.text.length * 25;
    const t = setTimeout(() => {
      setShowTyping(false);
      setVisible((v) => v + 1);
    }, Math.min(typingDelay, 2000));
    return () => clearTimeout(t);
  }, [started, visible, scene.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [visible, showTyping]);

  const restart = () => { setVisible(0); setShowTyping(false); setStarted(true); };

  if (!scene.messages || scene.messages.length === 0) return null;

  const nextSpeaker = visible < scene.messages.length ? scene.messages[visible].speaker : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">
            Character chat
          </p>
          {scene.setting && (
            <p className="text-xs text-[#3a3a5a] italic mt-0.5">{scene.setting}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFurigana((v) => !v)}
            className="jp text-xs px-2.5 py-1 rounded-full transition-all"
            style={showFurigana
              ? { background: 'rgba(0,200,224,0.15)', color: '#00c8e0', border: '1px solid rgba(0,200,224,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#3a3a5a', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            ふ
          </button>
          <button
            onClick={() => setShowEnglish((v) => !v)}
            className="text-xs px-2.5 py-1 rounded-full transition-all"
            style={showEnglish
              ? { background: 'rgba(0,208,132,0.15)', color: '#00d084', border: '1px solid rgba(0,208,132,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#3a3a5a', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            EN
          </button>
        </div>
      </div>

      {/* Speaker names bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(144,96,240,0.2)', color: '#9060f0' }}>
            {speaker1?.[0]}
          </div>
          <span className="text-xs text-[#5a5a7a]">{speaker1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#5a5a7a]">{speaker2}</span>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(240,192,64,0.2)', color: '#f0c040' }}>
            {speaker2?.[0]}
          </div>
        </div>
      </div>

      {/* Chat bubbles */}
      <div className="rounded-2xl p-4 space-y-3 max-h-72 overflow-y-auto"
        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {!started && (
          <button
            onClick={() => setStarted(true)}
            className="w-full text-xs text-[#3a3a5a] hover:text-[#f0c040] py-4 transition-colors"
          >
            ▶ Play conversation
          </button>
        )}

        {started && scene.messages.slice(0, visible).map((msg, i) => {
          const isRight = msg.speaker === speaker2;
          return (
            <div key={i} className={`flex flex-col gap-1 animate-slide-up ${isRight ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-[#3a3a5a] px-1">{msg.speaker}</span>
              <div className="px-4 py-2.5 rounded-2xl max-w-[75%]"
                style={isRight
                  ? { background: 'rgba(240,192,64,0.22)', border: '1px solid rgba(240,192,64,0.35)', borderBottomRightRadius: 4 }
                  : { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderBottomLeftRadius: 4 }
                }>
                <p className="jp text-sm leading-relaxed text-[#e0d8f0]">
                  {highlightWord(msg.text, word)}
                </p>
                {showFurigana && msg.furigana && (
                  <p className="jp text-xs mt-1 text-[#5a5a7a]">{msg.furigana}</p>
                )}
                {showEnglish && msg.english && (
                  <p className="text-xs mt-1 italic text-[#9090b8]">{msg.english}</p>
                )}
              </div>
            </div>
          );
        })}

        {showTyping && nextSpeaker && (
          <TypingBubble
            side={nextSpeaker === speaker2 ? 'right' : 'left'}
            initial={nextSpeaker?.[0] ?? '?'}
          />
        )}

        {started && visible >= scene.messages.length && !showTyping && (
          <div className="flex justify-center pt-2">
            <button onClick={restart} className="text-xs text-[#3a3a5a] hover:text-[#f0c040] transition-colors">
              ↺ Replay
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
