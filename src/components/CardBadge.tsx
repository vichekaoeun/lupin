import { JLPTLevel } from '@/lib/types';

const styles: Record<JLPTLevel, { bg: string; color: string; glow: string }> = {
  N5:      { bg: '#003a2a', color: '#00d084', glow: '#00d08440' },
  N4:      { bg: '#002a40', color: '#00c8e0', glow: '#00c8e040' },
  N3:      { bg: '#3a3000', color: '#f0c040', glow: '#f0c04040' },
  N2:      { bg: '#3a1800', color: '#f07030', glow: '#f0703040' },
  N1:      { bg: '#3a0a0a', color: '#e63030', glow: '#e6303040' },
  unknown: { bg: '#1a1a2a', color: '#5a5a7a', glow: 'transparent' },
};

export default function CardBadge({ level }: { level: JLPTLevel }) {
  const s = styles[level] ?? styles.unknown;
  return (
    <span
      className="text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wider"
      style={{
        background: s.bg,
        color: s.color,
        boxShadow: `0 0 8px ${s.glow}`,
        border: `1px solid ${s.color}33`,
      }}
    >
      {level}
    </span>
  );
}
