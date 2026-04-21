'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'register' | 'confirm';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirm  = (form.elements.namedItem('confirm')  as HTMLInputElement).value;

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.ok) {
      setPendingEmail(email);
      if (data.needsConfirmation) {
        setMode('confirm');
      } else {
        setMode('login');
      }
    } else {
      setError(data.error ?? 'Registration failed');
    }
    setLoading(false);
  }

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const code  = (form.elements.namedItem('code')  as HTMLInputElement).value;
    if (!code) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (data.ok) {
      setMode('login');
      setPendingEmail(email);
    } else {
      setError(data.error ?? 'Confirmation failed');
    }
    setLoading(false);
  }

  const inputClass = "w-full rounded-xl px-4 py-2.5 text-sm text-[#e0d8f0] placeholder:text-[#2a2a3a] outline-none transition-all";
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.border = '1px solid rgba(240,192,64,0.4)';
  const inputBlur  = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
  const labelClass = "block text-xs font-medium text-[#5a5a7a] uppercase tracking-widest mb-2";

  const subtitles: Record<Mode, string> = {
    login:    'Sign in to continue',
    register: 'Create an account',
    confirm:  'Check your email',
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0a14' }}>
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
            <p className="text-sm text-[#3a3a5a] tracking-widest uppercase">{subtitles[mode]}</p>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" name="email" autoComplete="email" required
                  defaultValue={pendingEmail}
                  placeholder="you@example.com"
                  className={inputClass} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" name="password" autoComplete="current-password" required
                  placeholder="••••••••"
                  className={inputClass} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              {error && <ErrorBox message={error} />}
              <button type="submit" disabled={loading}
                className="w-full rounded-xl py-2.5 font-semibold text-sm text-[#0a0a14] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ background: '#f0c040', boxShadow: loading ? 'none' : '0 0 20px #f0c04044' }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <p className="text-center text-xs text-[#5a5a7a] pt-1">
                No account?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(''); }}
                  className="text-[#f0c040] hover:underline">
                  Create one
                </button>
              </p>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" name="email" autoComplete="email" required
                  placeholder="you@example.com"
                  className={inputClass} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" name="password" autoComplete="new-password" required
                  placeholder="••••••••"
                  className={inputClass} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className={labelClass}>Confirm password</label>
                <input type="password" name="confirm" autoComplete="new-password" required
                  placeholder="••••••••"
                  className={inputClass} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              {error && <ErrorBox message={error} />}
              <button type="submit" disabled={loading}
                className="w-full rounded-xl py-2.5 font-semibold text-sm text-[#0a0a14] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ background: '#f0c040', boxShadow: loading ? 'none' : '0 0 20px #f0c04044' }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
              <p className="text-center text-xs text-[#5a5a7a] pt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }}
                  className="text-[#f0c040] hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {mode === 'confirm' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-sm text-[#5a5a7a] text-center -mt-4 mb-2">
                We sent a code to <span className="text-[#e0d8f0]">{pendingEmail}</span>
              </p>
              <input type="hidden" name="email" value={pendingEmail} />
              <div>
                <label className={labelClass}>Confirmation code</label>
                <input type="text" name="code" autoComplete="one-time-code" required
                  placeholder="123456" inputMode="numeric"
                  className={inputClass} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              {error && <ErrorBox message={error} />}
              <button type="submit" disabled={loading}
                className="w-full rounded-xl py-2.5 font-semibold text-sm text-[#0a0a14] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ background: '#f0c040', boxShadow: loading ? 'none' : '0 0 20px #f0c04044' }}>
                {loading ? 'Verifying…' : 'Verify email'}
              </button>
              <p className="text-center text-xs text-[#5a5a7a] pt-1">
                Wrong email?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(''); }}
                  className="text-[#f0c040] hover:underline">
                  Go back
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl px-4 py-3 text-sm text-[#e63030]"
      style={{ background: 'rgba(230,48,48,0.08)', border: '1px solid rgba(230,48,48,0.2)' }}>
      {message}
    </div>
  );
}
