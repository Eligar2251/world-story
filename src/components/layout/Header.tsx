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

    // Close dropdowns on outside click
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

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const navLinks = mode === 'writer' ? [...readerLinks, ...writerLinks] : readerLinks;

    const ThemeIcon = themeOptions.find((t) => t.value === theme)?.icon ?? Sun;

    return (
        <header className="glass sticky top-0 z-50 h-16">
            <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <BookOpen className="w-7 h-7 text-accent" strokeWidth={2.2} />
                    <span className="font-bold text-lg hidden sm:inline text-ink">
                        WorldStory
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-1 ml-8">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded text-sm
                  transition-colors
                  ${active
                                        ? 'bg-accent-soft text-accent font-medium'
                                        : 'text-ink-secondary hover:text-ink hover:bg-surface-overlay'
                                    }
                `}
                            >
                                <Icon size={16} />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Search button */}
                    <button
                        className="p-2 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors"
                        aria-label="Поиск"
                    >
                        <Search size={18} />
                    </button>

                    {/* Mode switcher */}
                    {user && (
                        <button
                            onClick={() =>
                                setMode(mode === 'reader' ? 'writer' : 'reader')
                            }
                            className={`
                hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded text-sm
                border border-line transition-colors
                ${mode === 'writer'
                                    ? 'bg-accent-soft text-accent border-accent/30'
                                    : 'text-ink-secondary hover:bg-surface-overlay'
                                }
              `}
                        >
                            {mode === 'writer' ? (
                                <PenTool size={14} />
                            ) : (
                                <BookOpen size={14} />
                            )}
                            {mode === 'writer' ? 'Студия' : 'Чтение'}
                        </button>
                    )}

                    {/* Theme dropdown */}
                    <div ref={themeRef} className="relative">
                        <button
                            onClick={() => setThemeOpen(!themeOpen)}
                            className="p-2 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors"
                            aria-label="Сменить тему"
                        >
                            <ThemeIcon size={18} />
                        </button>
                        {themeOpen && (
                            <div className="absolute right-0 top-full mt-2 w-40 rounded-lg bg-surface-raised border border-line shadow-elevated py-1 z-50">
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
                        w-full flex items-center gap-2 px-3 py-2 text-sm
                        transition-colors
                        ${theme === opt.value
                                                    ? 'text-accent bg-accent-soft'
                                                    : 'text-ink-secondary hover:bg-surface-overlay'
                                                }
                      `}
                                        >
                                            <Icon size={16} />
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
                                className="p-2 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors relative"
                                aria-label="Уведомления"
                            >
                                <Bell size={18} />
                            </button>
                        </Link>
                    )}

                    {/* User menu / Auth buttons */}
                    {loading ? (
                        <div className="w-8 h-8 rounded-full skeleton" />
                    ) : user ? (
                        <div ref={userRef} className="relative">
                            <button
                                onClick={() => setUserOpen(!userOpen)}
                                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-overlay transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent text-sm font-medium">
                                    {profile?.display_name?.charAt(0)?.toUpperCase() ??
                                        'U'}
                                </div>
                                <ChevronDown
                                    size={14}
                                    className="text-ink-muted hidden sm:block"
                                />
                            </button>
                            {userOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-surface-raised border border-line shadow-elevated py-1 z-50">
                                    <div className="px-3 py-2 border-b border-line">
                                        <p className="text-sm font-medium text-ink truncate">
                                            {profile?.display_name}
                                        </p>
                                        <p className="text-xs text-ink-muted truncate">
                                            @{profile?.username}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/profile/${profile?.username}`}
                                        onClick={() => setUserOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay transition-colors"
                                    >
                                        <User size={16} />
                                        Профиль
                                    </Link>
                                    <button
                                        onClick={() => {
                                            signOut();
                                            setUserOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-surface-overlay transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Выйти
                                    </button>
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
                        className="p-2 rounded text-ink-secondary hover:text-ink md:hidden"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Меню"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile nav */}
            {mobileOpen && (
                <nav className="md:hidden border-t border-line bg-surface-raised px-4 py-3 space-y-1">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded text-sm
                  ${active
                                        ? 'bg-accent-soft text-accent font-medium'
                                        : 'text-ink-secondary'
                                    }
                `}
                            >
                                <Icon size={18} />
                                {link.label}
                            </Link>
                        );
                    })}
                    {user && (
                        <button
                            onClick={() =>
                                setMode(mode === 'reader' ? 'writer' : 'reader')
                            }
                            className="flex items-center gap-2 px-3 py-2.5 rounded text-sm text-ink-secondary w-full"
                        >
                            {mode === 'writer' ? (
                                <BookOpen size={18} />
                            ) : (
                                <PenTool size={18} />
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