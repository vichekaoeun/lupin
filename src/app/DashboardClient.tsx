'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import HeatMap from '@/components/HeatMap';

interface DashboardData {
  totalCards: number;
  cardsDueToday: number;
  streak: number;
  retentionRate: number;
  activityHeatmap: Record<string, number>;
  retentionByJLPT: Record<string, number>;
}

const JLPT_COLORS: Record<string, string> = {
  N5: '#00d084', N4: '#00c8e0', N3: '#f0c040', N2: '#f07030', N1: '#e63030',
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) {
          setData({
            totalCards: d.totalCards ?? 0,
            cardsDueToday: d.cardsDueToday ?? 0,
            streak: d.streak ?? 0,
            retentionRate: d.retentionRate ?? 0,
            activityHeatmap: d.activityHeatmap ?? {},
            retentionByJLPT: d.retentionByJLPT ?? {},
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  const stats = [
    { label: 'Total Cards', value: data?.totalCards ?? 0,         accent: '#00c8e0', suffix: '' },
    { label: 'Due Today',   value: data?.cardsDueToday ?? 0,      accent: '#f0c040', suffix: '' },
    { label: 'Day Streak',  value: `${data?.streak ?? 0}`,        accent: '#f07030', suffix: ' days' },
    { label: 'Retention',   value: `${data?.retentionRate ?? 0}`, accent: '#00d084', suffix: '%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e0d8f0]">Dashboard</h1>
          <p className="text-[#3a3a5a] text-sm mt-0.5">Your study overview</p>
        </div>
        {data && data.cardsDueToday > 0 && (
          <Link
            href="/review"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 text-[#0a0a14]"
            style={{ background: '#f0c040', boxShadow: '0 0 20px #f0c04055' }}
          >
            {data.cardsDueToday} card{data.cardsDueToday !== 1 ? 's' : ''} due
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, accent, suffix }) => (
          <div
            key={label}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${accent}66, transparent)` }} />
            <p className="text-xs text-[#3a3a5a] font-medium uppercase tracking-widest mb-2">{label}</p>
            <p className="text-3xl font-bold" style={{ color: accent }}>
              {value}<span className="text-lg">{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {data && data.totalCards === 0 && (
        <div className="rounded-2xl p-8 text-center relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(240,192,64,0.2)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(240,192,64,0.08) 0%, transparent 60%)'
          }} />
          <p className="font-serif italic text-5xl text-[#f0c040] mb-4" style={{ textShadow: '0 0 30px #f0c04055' }}>謎</p>
          <h2 className="font-semibold text-[#c0b8d0] mb-2">Start your collection</h2>
          <p className="text-sm text-[#3a3a5a] mb-6">Add your first Japanese word and let AI build a card for you.</p>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-[#0a0a14] transition-all"
            style={{ background: '#f0c040', boxShadow: '0 0 20px #f0c04044' }}
          >
            + Add your first word
          </Link>
        </div>
      )}

      {/* Activity Heatmap */}
      {data && Object.keys(data.activityHeatmap).length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-[#5a5a7a] uppercase tracking-widest mb-4">Activity — Last 90 Days</h2>
          <HeatMap data={data.activityHeatmap} />
        </div>
      )}

      {/* Retention by JLPT */}
      {data && Object.keys(data.retentionByJLPT).length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-[#5a5a7a] uppercase tracking-widest mb-5">Retention by JLPT</h2>
          <div className="space-y-3">
            {['N5','N4','N3','N2','N1']
              .filter((lvl) => data.retentionByJLPT[lvl] !== undefined)
              .map((lvl) => {
                const rate = data.retentionByJLPT[lvl];
                const color = JLPT_COLORS[lvl];
                return (
                  <div key={lvl} className="flex items-center gap-3">
                    <span className="w-7 text-xs font-bold" style={{ color }}>{lvl}</span>
                    <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${rate}%`, background: color, boxShadow: `0 0 6px ${color}99` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right" style={{ color }}>{rate}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
