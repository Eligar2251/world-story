'use client';

import { useState } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Heart,
  Trash2,
} from 'lucide-react';
import ProjectCard from '@/components/cards/ProjectCard';
import { createClient } from '@/lib/supabase/client';
import type { LibraryEntry, Shelf } from '@/lib/types/database';

const shelves: { id: Shelf | 'all'; label: string; icon: typeof BookOpen }[] = [
  { id: 'all', label: 'Все', icon: BookOpen },
  { id: 'reading', label: 'Читаю', icon: BookOpen },
  { id: 'planned', label: 'В планах', icon: Clock },
  { id: 'completed', label: 'Прочитано', icon: CheckCircle },
  { id: 'favorite', label: 'Любимое', icon: Heart },
];

interface Props {
  entries: LibraryEntry[];
}

export default function LibraryClient({ entries: initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [activeShelf, setActiveShelf] = useState<Shelf | 'all'>('all');
  const supabase = createClient();

  const filtered =
    activeShelf === 'all'
      ? entries
      : entries.filter((e) => e.shelf === activeShelf);

  const counts = {
    all: entries.length,
    reading: entries.filter((e) => e.shelf === 'reading').length,
    planned: entries.filter((e) => e.shelf === 'planned').length,
    completed: entries.filter((e) => e.shelf === 'completed').length,
    favorite: entries.filter((e) => e.shelf === 'favorite').length,
  };

  async function handleRemove(entryId: string) {
    await supabase.from('library_entries').delete().eq('id', entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }

  return (
    <div>
      {/* Shelf tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none pb-2">
        {shelves.map((shelf) => {
          const Icon = shelf.icon;
          const active = activeShelf === shelf.id;
          return (
            <button
              key={shelf.id}
              onClick={() => setActiveShelf(shelf.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors
                ${
                  active
                    ? 'bg-accent-soft text-accent font-medium'
                    : 'text-ink-secondary hover:bg-surface-overlay'
                }
              `}
            >
              <Icon size={16} />
              {shelf.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active
                    ? 'bg-accent/20 text-accent'
                    : 'bg-surface-overlay text-ink-muted'
                }`}
              >
                {counts[shelf.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-16 h-16 mx-auto text-ink-muted mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <p className="text-ink-secondary">На этой полке пока пусто</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((entry) =>
            entry.project ? (
              <div key={entry.id} className="relative group">
                <ProjectCard project={entry.project} />
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-surface-raised/80 border border-line text-ink-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Убрать из библиотеки"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}