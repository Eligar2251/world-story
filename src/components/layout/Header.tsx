'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  PenTool,
  Search,
  Bell,
  Menu,
  X,
  User,
  LogOut,
  Sun,
  Moon,
  Sunset,
  Monitor,
  Library,
  Home,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';
import Button from '@/components/ui/Button';

const readerLinks = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/catalog', label: 'Каталог', icon: LayoutGrid },
  { href: '/library', label: 'Библиотека', icon: Library },
];

const writerLinks = [
  { href: '/studio', label: 'Студия', icon: PenTool },
];

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'sepia', label: 'Сепия', icon: Sunset },
  { value: 'amoled', label: 'AMOLED', icon: Monitor },
];

export default function Header() {
  const { user, profile, loading, mode, setMode, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const themeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node))
        setThemeOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks =
    mode === 'writer'
      ? [...readerLinks, ...writerLinks]
      : readerLinks;

  const ThemeIcon =
    themeOptions.find((t) => t.value === theme)?.icon ?? Sun;

  return (
    <header className="glass sticky top-0 z-50 h-14">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          {/* Custom book icon via SVG */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 32 32"
            fill="none"
            className="text-accent"
          >
            <path
              d="M6 4C6 2.89543 6.89543 2 8 2H24C25.1046 2 26 2.89543 26 4V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M10 2V30"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M14 9H22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M14 13H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-bold text-base tracking-tight text-ink hidden sm:inline group-hover:text-accent transition-colors">
            WorldStory
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 ml-8">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                  transition-all duration-150
                  ${
                    active
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-overlay'
                  }
                `}
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <button
            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-overlay transition-all"
            aria-label="Поиск"
          >
            <Search size={17} strokeWidth={1.8} />
          </button>

          {/* Mode switcher */}
          {user && (
            <button
              onClick={() =>
                setMode(mode === 'reader' ? 'writer' : 'reader')
              }
              className={`
                hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                border transition-all duration-150
                ${
                  mode === 'writer'
                    ? 'bg-accent-soft text-accent border-accent/20'
                    : 'text-ink-secondary border-line hover:bg-surface-overlay hover:text-ink'
                }
              `}
            >
              {mode === 'writer' ? (
                <PenTool size={13} />
              ) : (
                <BookOpen size={13} />
              )}
              {mode === 'writer' ? 'Студия' : 'Чтение'}
            </button>
          )}

          {/* Theme */}
          <div ref={themeRef} className="relative">
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-overlay transition-all"
              aria-label="Тема"
            >
              <ThemeIcon size={17} strokeWidth={1.8} />
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-surface-raised border border-line shadow-elevated py-1.5 z-50">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setTheme(opt.value);
                        setThemeOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-2.5 px-3.5 py-2 text-sm
                        transition-colors
                        ${
                          theme === opt.value
                            ? 'text-accent bg-accent-soft'
                            : 'text-ink-secondary hover:bg-surface-overlay hover:text-ink'
                        }
                      `}
                    >
                      <Icon size={15} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications */}
          {user && (
            <Link href="/notifications">
              <button
                className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-overlay transition-all relative"
                aria-label="Уведомления"
              >
                <Bell size={17} strokeWidth={1.8} />
              </button>
            </Link>
          )}

          {/* User / Auth */}
          {loading ? (
            <div className="w-8 h-8 rounded-full skeleton" />
          ) : user ? (
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-overlay transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent text-xs font-bold tracking-tight">
                  {profile?.display_name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <ChevronDown
                  size={13}
                  className="text-ink-muted hidden sm:block"
                  strokeWidth={2}
                />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface-raised border border-line shadow-elevated py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-line">
                    <p className="text-sm font-semibold text-ink truncate">
                      {profile?.display_name}
                    </p>
                    <p className="text-xs text-ink-muted truncate">
                      @{profile?.username}
                    </p>
                  </div>
                  <Link
                    href={`/profile/${profile?.username}`}
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-secondary hover:bg-surface-overlay hover:text-ink transition-colors"
                  >
                    <User size={15} />
                    Профиль
                  </Link>
                  <Link
                    href={`/profile/${profile?.username}/edit`}
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-secondary hover:bg-surface-overlay hover:text-ink transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Настройки
                  </Link>
                  <div className="border-t border-line mt-1 pt-1">
                    <button
                      onClick={() => {
                        signOut();
                        setUserOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut size={15} />
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Вход
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">Регистрация</Button>
              </Link>
            </div>
          )}

          {/* Mobile burger */}
          <button
            className="p-2 rounded-lg text-ink-secondary hover:text-ink md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Меню"
          >
            {mobileOpen ? (
              <X size={19} strokeWidth={1.8} />
            ) : (
              <Menu size={19} strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-line bg-surface-raised px-4 py-3 space-y-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm
                  ${
                    active
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-ink-secondary'
                  }
                `}
              >
                <Icon size={17} />
                {link.label}
              </Link>
            );
          })}
          {user && (
            <button
              onClick={() =>
                setMode(mode === 'reader' ? 'writer' : 'reader')
              }
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-ink-secondary w-full"
            >
              {mode === 'writer' ? (
                <BookOpen size={17} />
              ) : (
                <PenTool size={17} />
              )}
              {mode === 'writer'
                ? 'Переключить в Чтение'
                : 'Переключить в Студию'}
            </button>
          )}
        </nav>
      )}
    </header>
  );
}