'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Home',     icon: '⌂' },
  { href: '/cards',     label: 'Cards',    icon: '⊞' },
  { href: '/review',    label: 'Review',   icon: '⚡' },
  { href: '/add',       label: 'Add',      icon: '+' },
  { href: '/settings',  label: 'Settings', icon: '⚙' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06]"
      style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-5xl mx-auto px-4 flex items-center h-14 gap-1">
        {/* Logo */}
        <Link href="/" className="font-serif italic text-xl text-[#f0c040] mr-6 tracking-wide shrink-0"
          style={{ textShadow: '0 0 20px #f0c04066' }}
        >
          Lupin
        </Link>

        {/* Links */}
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || (href === '/dashboard' && pathname === '/');
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? 'text-[#f0c040]'
                  : 'text-[#5a5a7a] hover:text-[#a0a0c0]'
                }`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-[#f0c040] rounded-full"
                  style={{ boxShadow: '0 0 6px #f0c040' }}
                />
              )}
            </Link>
          );
        })}

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="ml-auto text-xs text-[#3a3a5a] hover:text-[#5a5a7a] px-2 py-1 rounded-lg transition-colors"
        >
          sign out
        </button>
      </div>
    </nav>
  );
}
