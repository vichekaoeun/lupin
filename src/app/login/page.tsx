'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read directly from the DOM so browser autofill is always captured,
    // even when it doesn't fire React onChange events.
    const form = e.currentTarget;
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (!email || !password) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.ok) {
      router.push(data.redirect ?? '/dashboard');
      router.refresh();
    } else {
      setError(data.error ?? 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0a14' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(240,192,64,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm px-4">
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #f0c04066, transparent)' }} />

          <div className="text-center mb-8">
            <p className="font-serif italic text-5xl text-[#f0c040] mb-2 animate-glow-pulse"
              style={{ textShadow: '0 0 30px #f0c04055' }}>
              Lupin
            </p>
            <p className="text-sm text-[#3a3a5a] tracking-widest uppercase">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5a5a7a] uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-[#e0d8f0] placeholder:text-[#2a2a3a] outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5a5a7a] uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-[#e0d8f0] placeholder:text-[#2a2a3a] outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)'}
                onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-[#e63030]"
                style={{ background: 'rgba(230,48,48,0.08)', border: '1px solid rgba(230,48,48,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 font-semibold text-sm text-[#0a0a14] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: '#f0c040', boxShadow: loading ? 'none' : '0 0 20px #f0c04044' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
