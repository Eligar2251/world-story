'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  Heart,
  MessageCircle,
  BookOpen,
  ArrowLeft,
  Minus,
  Plus,
  Type,
  AlignCenter,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Chapter, Project } from '@/lib/types/database';
import ChapterComments from '@/components/reader/ChapterComments';

interface ReaderSettings {
  fontSize: number;
  fontFamily: 'sans' | 'serif' | 'mono';
  lineHeight: number;
  maxWidth: number;
  theme: 'auto' | 'white' | 'sepia' | 'dark' | 'amoled';
}

const defaultSettings: ReaderSettings = {
  fontSize: 18,
  fontFamily: 'serif',
  lineHeight: 1.8,
  maxWidth: 720,
  theme: 'auto',
};

const fontMap = {
  sans: "'Inter', system-ui, sans-serif",
  serif: "'Georgia', 'Cambria', serif",
  mono: "'JetBrains Mono', monospace",
};

interface NavChapter {
  id: string;
  title: string;
}

interface Props {
  chapter: Chapter;
  project: Project;
  prevChapter: NavChapter | null;
  nextChapter: NavChapter | null;
}

export default function ReaderClient({
  chapter,
  project,
  prevChapter,
  nextChapter,
}: Props) {
  const { user } = useAuth();
  const supabase = createClient();
  const contentRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScroll = useRef(0);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ws-reader-settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch { }
    }
  }, []);

  // Save settings
  function updateSettings(partial: Partial<ReaderSettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    localStorage.setItem('ws-reader-settings', JSON.stringify(next));
  }

  // Scroll progress
  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));

      // Auto-hide header
      if (scrollTop > lastScroll.current + 30) {
        setShowHeader(false);
      } else if (scrollTop < lastScroll.current - 10) {
        setShowHeader(true);
      }
      lastScroll.current = scrollTop;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save reading progress
  const saveProgress = useCallback(async () => {
    if (!user) return;
    const scrollPct = Math.round(scrollProgress);

    await supabase.from('reading_progress').upsert(
      {
        user_id: user.id,
        project_id: chapter.project_id,
        chapter_id: chapter.id,
        scroll_position: scrollPct,
        completed: scrollPct > 95,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,chapter_id' }
    );
  }, [user, chapter, scrollProgress, supabase]);

  // Save progress periodically
  useEffect(() => {
    const timer = setInterval(saveProgress, 30000);
    return () => clearInterval(timer);
  }, [saveProgress]);

  // Save on leave
  useEffect(() => {
    window.addEventListener('beforeunload', saveProgress);
    return () => window.removeEventListener('beforeunload', saveProgress);
  }, [saveProgress]);

  // Like state
  // Like state
useEffect(() => {
  if (!user) return;

  async function checkLike() {
    const response = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user!.id)
      .eq('target_type', 'chapter')
      .eq('target_id', chapter.id)
      .single();

    if (response.data) setLiked(true);
  }

  checkLike();
}, [user, chapter.id, supabase]);

  async function handleLike() {
    if (!user) return;
    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', 'chapter')
        .eq('target_id', chapter.id);
      setLiked(false);
    } else {
      await supabase.from('likes').insert({
        user_id: user.id,
        target_type: 'chapter',
        target_id: chapter.id,
      });
      setLiked(true);
    }
  }

  // Render paragraphs
  const paragraphs = chapter.content
    .split('\n')
    .filter((p) => p.trim().length > 0);

  return (
    <div className="min-h-screen">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-line z-[60]">
        <div
          className="h-full bg-accent transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-200 ${showHeader ? 'translate-y-0' : '-translate-y-full'
          }`}
      >
        <div className="glass h-12 flex items-center justify-between px-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/work/${project.id}`}
              className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-ink-muted truncate">
                {project.title}
              </p>
              <p className="text-sm font-medium text-ink truncate">
                {chapter.title}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <article
        ref={contentRef}
        className="pt-16 pb-24 px-4 mx-auto"
        style={{
          maxWidth: settings.maxWidth,
          fontFamily: fontMap[settings.fontFamily],
          fontSize: settings.fontSize,
          lineHeight: settings.lineHeight,
        }}
      >
        <h1 className="text-2xl font-bold text-ink mb-8 text-center">
          {chapter.title}
        </h1>

        <div className="text-ink">
          {paragraphs.map((p, i) => (
            <p key={i} className="mb-4 text-justify">
              {p}
            </p>
          ))}
        </div>

        {paragraphs.length === 0 && (
          <div className="text-center py-16 text-ink-muted">
            <BookOpen className="w-12 h-12 mx-auto mb-4" />
            <p>Эта глава пока пуста</p>
          </div>
        )}
      </article>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="glass px-4 py-3 max-w-5xl mx-auto flex items-center justify-between">
          {/* Nav */}
          <div className="flex items-center gap-2">
            {prevChapter ? (
              <Link href={`/read/${prevChapter.id}`}>
                <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />}>
                  <span className="hidden sm:inline">Назад</span>
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="sm" disabled icon={<ChevronLeft size={16} />}>
                <span className="hidden sm:inline">Назад</span>
              </Button>
            )}
          </div>

          {/* Center actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`p-2 rounded transition-colors ${liked
                  ? 'text-red-500 bg-red-500/10'
                  : 'text-ink-secondary hover:bg-surface-overlay'
                }`}
              aria-label="Нравится"
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <span className="text-xs text-ink-muted">
              {Math.round(scrollProgress)}%
            </span>
          </div>

          {/* Next */}
          <div className="flex items-center gap-2">
            {nextChapter ? (
              <Link href={`/read/${nextChapter.id}`}>
                <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />}>
                  <span className="hidden sm:inline">Далее</span>
                </Button>
              </Link>
            ) : (
              <Link href={`/work/${project.id}`}>
                <Button variant="ghost" size="sm">
                  К проекту
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[70]"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[80] bg-surface-raised border-t border-line rounded-t-2xl p-6 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink">Настройки</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay"
              >
                <X size={18} />
              </button>
            </div>

            {/* Font size */}
            <div className="mb-5">
              <label className="text-sm text-ink-secondary mb-2 block">
                Размер шрифта: {settings.fontSize}px
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    updateSettings({
                      fontSize: Math.max(12, settings.fontSize - 1),
                    })
                  }
                  className="p-2 rounded border border-line text-ink-secondary hover:bg-surface-overlay"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="range"
                  min={12}
                  max={28}
                  value={settings.fontSize}
                  onChange={(e) =>
                    updateSettings({ fontSize: Number(e.target.value) })
                  }
                  className="flex-1 accent-accent"
                />
                <button
                  onClick={() =>
                    updateSettings({
                      fontSize: Math.min(28, settings.fontSize + 1),
                    })
                  }
                  className="p-2 rounded border border-line text-ink-secondary hover:bg-surface-overlay"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Font family */}
            <div className="mb-5">
              <label className="text-sm text-ink-secondary mb-2 block">
                Шрифт
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['sans', 'serif', 'mono'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => updateSettings({ fontFamily: f })}
                    className={`px-3 py-2 rounded border text-sm transition-colors ${settings.fontFamily === f
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line text-ink-secondary hover:bg-surface-overlay'
                      }`}
                    style={{ fontFamily: fontMap[f] }}
                  >
                    {f === 'sans'
                      ? 'Sans'
                      : f === 'serif'
                        ? 'Serif'
                        : 'Mono'}
                  </button>
                ))}
              </div>
            </div>

            {/* Line height */}
            <div className="mb-5">
              <label className="text-sm text-ink-secondary mb-2 block">
                Межстрочный: {settings.lineHeight}
              </label>
              <input
                type="range"
                min={1.2}
                max={2.4}
                step={0.1}
                value={settings.lineHeight}
                onChange={(e) =>
                  updateSettings({ lineHeight: Number(e.target.value) })
                }
                className="w-full accent-accent"
              />
            </div>

            {/* Width */}
            <div className="mb-5">
              <label className="text-sm text-ink-secondary mb-2 block">
                Ширина текста: {settings.maxWidth}px
              </label>
              <input
                type="range"
                min={480}
                max={960}
                step={40}
                value={settings.maxWidth}
                onChange={(e) =>
                  updateSettings({ maxWidth: Number(e.target.value) })
                }
                className="w-full accent-accent"
              />
            </div>

            {/* Reader theme */}
            <div>
              <label className="text-sm text-ink-secondary mb-2 block">
                Тема читалки
              </label>
              <div className="flex gap-2">
                {[
                  { v: 'auto', bg: 'bg-surface', label: 'Авто' },
                  { v: 'white', bg: 'bg-white', label: 'Белая' },
                  { v: 'sepia', bg: 'bg-[#F4ECD8]', label: 'Сепия' },
                  { v: 'dark', bg: 'bg-[#1A1D2E]', label: 'Тёмная' },
                  { v: 'amoled', bg: 'bg-black', label: 'AMOLED' },
                ].map((t) => (
                  <button
                    key={t.v}
                    onClick={() =>
                      updateSettings({
                        theme: t.v as ReaderSettings['theme'],
                      })
                    }
                    className={`flex-1 py-2 rounded border text-xs transition-colors ${settings.theme === t.v
                        ? 'border-accent ring-2 ring-accent/30'
                        : 'border-line'
                      } ${t.bg}`}
                    title={t.label}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments section */}
            <div className="max-w-[780px] mx-auto px-4 pb-32">
              <ChapterComments chapterId={chapter.id} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}