'use client';
import { useEffect, useState } from 'react';
import { JLPTLevel, SubcultureTheme, UserProfile } from '@/lib/types';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const JLPT_COLORS: Record<JLPTLevel, string> = {
  N5: '#00d084', N4: '#00c8e0', N3: '#f0c040', N2: '#f07030', N1: '#e63030', unknown: '#5a5a7a',
};
const THEMES: SubcultureTheme[] = ['anime', 'gaming', 'idol groups', 'manga', 'street fashion', 'general'];
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Toronto', 'Europe/London', 'Europe/Paris',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore', 'Australia/Sydney',
];

export default function SettingsClient() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    targetJLPT: 'N3' as JLPTLevel,
    theme: 'anime' as SubcultureTheme,
    timezone: 'UTC',
    studyGoal: 20,
  });

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then(({ user }: { user: UserProfile }) => {
        setProfile(user);
        setForm({
          displayName: user.displayName,
          targetJLPT: user.targetJLPT,
          theme: user.theme,
          timezone: user.timezone,
          studyGoal: user.studyGoal,
        });
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const { user } = await res.json();
      setProfile(user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const panel = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e0d8f0',
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="font-serif italic text-4xl text-[#f0c040] animate-pulse" style={{ textShadow: '0 0 20px #f0c04066' }}>Lupin</p>
          <p className="text-[#3a3a5a] text-sm tracking-widest uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-[#e0d8f0]">Settings</h1>
        <p className="text-[#3a3a5a] text-sm mt-0.5">Personalise your learning experience.</p>
      </div>

      <form onSubmit={save} className="space-y-4">
        {/* Profile */}
        <div className="rounded-2xl p-6 space-y-5 relative overflow-hidden" style={panel}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #00c8e044, transparent)' }} />
          <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Profile</h2>

          <div>
            <label className="block text-xs text-[#5a5a7a] uppercase tracking-widest mb-2">Display name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(0,200,224,0.4)'}
              onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
            />
          </div>

          <div>
            <label className="block text-xs text-[#5a5a7a] uppercase tracking-widest mb-2">Email</label>
            <p className="text-sm text-[#5a5a7a] rounded-xl px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {profile.email}
            </p>
          </div>
        </div>

        {/* Study preferences */}
        <div className="rounded-2xl p-6 space-y-5 relative overflow-hidden" style={panel}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #f0c04044, transparent)' }} />
          <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Study Preferences</h2>

          <div>
            <label className="block text-xs text-[#5a5a7a] uppercase tracking-widest mb-3">JLPT target level</label>
            <div className="flex gap-2 flex-wrap">
              {JLPT_LEVELS.map((lvl) => {
                const color = JLPT_COLORS[lvl];
                const active = form.targetJLPT === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, targetJLPT: lvl }))}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={active
                      ? { background: color, color: '#0a0a14', border: `1px solid ${color}`, boxShadow: `0 0 12px ${color}55` }
                      : { background: 'rgba(255,255,255,0.04)', color: '#5a5a7a', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#5a5a7a] uppercase tracking-widest mb-3">
              Daily study goal
              <span className="ml-2 font-bold" style={{ color: '#f0c040' }}>{form.studyGoal} cards/day</span>
            </label>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={form.studyGoal}
              onChange={(e) => setForm((f) => ({ ...f, studyGoal: Number(e.target.value) }))}
              className="w-full"
              style={{ accentColor: '#f0c040' }}
            />
            <div className="flex justify-between text-xs text-[#3a3a5a] mt-1">
              <span>5</span><span>100</span>
            </div>
          </div>
        </div>

        {/* Cultural theme */}
        <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden" style={panel}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #9060f044, transparent)' }} />
          <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Cultural Theme</h2>
          <p className="text-xs text-[#3a3a5a]">AI-generated examples will be grounded in your chosen theme.</p>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, theme: t }))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={form.theme === t
                  ? { background: '#9060f0', color: '#fff', border: '1px solid #9060f0', boxShadow: '0 0 12px #9060f055' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#5a5a7a', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden" style={panel}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #00d08444, transparent)' }} />
          <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Timezone</h2>
          <select
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ ...inputStyle, appearance: 'none' as const }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz} style={{ background: '#111120', color: '#e0d8f0' }}>{tz}</option>
            ))}
          </select>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl py-3 font-semibold text-sm text-[#0a0a14] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: saved ? '#00d084' : '#f0c040',
            boxShadow: saved ? '0 0 20px #00d08444' : '0 0 20px #f0c04044',
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </form>

      {/* Account info */}
      <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden" style={panel}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
        <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-widest">Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#3a3a5a] mb-1">Member since</p>
            <p className="font-medium text-[#c0b8d0]">{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-[#3a3a5a] mb-1">Current streak</p>
            <p className="font-medium" style={{ color: '#f07030' }}>
              {profile.streak} day{profile.streak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
