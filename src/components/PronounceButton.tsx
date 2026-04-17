'use client';
import { useState, useCallback, useRef } from 'react';

interface Props {
  word: string;
  reading?: string;
  size?: 'sm' | 'md';
}

export default function PronounceButton({ word, reading, size = 'md' }: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fallbackSpeak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ja-JP';
    utt.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang.startsWith('ja') && v.localService)
      ?? voices.find((v) => v.lang.startsWith('ja'));
    if (jaVoice) utt.voice = jaVoice;
    utt.onstart = () => setPlaying(true);
    utt.onend = () => setPlaying(false);
    utt.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utt);
  }, []);

  const speak = useCallback(async () => {
    if (playing) {
      // Stop current playback
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }

    const text = reading || word;
    setPlaying(true);

    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error('voicevox unavailable');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { setPlaying(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setPlaying(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch {
      // VOICEVOX not running — fall back to Web Speech API
      fallbackSpeak(text);
    }
  }, [word, reading, playing, fallbackSpeak]);

  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); speak(); }}
      title={`Pronounce ${word}`}
      className={`${sizeClass} rounded-full flex items-center justify-center transition-all`}
      style={playing
        ? { background: 'rgba(240,192,64,0.2)', color: '#f0c040', boxShadow: '0 0 10px #f0c04055' }
        : { background: 'rgba(255,255,255,0.06)', color: '#5a5a7a' }
      }
    >
      <svg className={playing ? 'animate-pulse' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        {playing
          ? <><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
          : <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        }
      </svg>
    </button>
  );
}
