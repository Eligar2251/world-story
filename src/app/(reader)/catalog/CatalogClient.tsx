'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProjectCard from '@/components/cards/ProjectCard';
import ProjectCardSkeleton from '@/components/cards/ProjectCardSkeleton';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import type { Project, Genre } from '@/lib/types/database';

const statusOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'ongoing', label: 'Онгоинг' },
  { value: 'completed', label: 'Завершено' },
  { value: 'hiatus', label: 'Заморожено' },
];

const sortOptions = [
  { value: 'updated', label: 'По обновлению' },
  { value: 'new', label: 'По дате' },
  { value: 'popular', label: 'По просмотрам' },
  { value: 'likes', label: 'По лайкам' },
  { value: 'rating', label: 'По рейтингу' },
];

interface Props {
  initialProjects: Project[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
  genres: Genre[];
  initialFilters: {
    genre?: string;
    status?: string;
    sort?: string;
    search?: string;
    page?: number;
  };
}

export default function CatalogClient({
  initialProjects,
  initialTotal,
  initialPage,
  totalPages,
  genres,
  initialFilters,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const genreOptions = [
    { value: 'all', label: 'Все жанры' },
    ...genres.map((g) => ({ value: g.slug, label: g.name })),
  ];

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...initialFilters, ...updates };

    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== 'all' && k !== 'page') params.set(k, String(v));
    });

    if (updates.page && Number(updates.page) > 1) {
      params.set('page', updates.page);
    }

    startTransition(() => {
      router.push(`/catalog?${params.toString()}`);
    });
  }

  const [searchInput, setSearchInput] = useState(initialFilters.search ?? '');

  function handleSearch() {
    updateUrl({ search: searchInput, page: '1' });
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Поиск по названию..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            icon={<Search size={16} />}
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                updateUrl({ search: '', page: '1' });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded border text-sm transition-colors
            ${
              filtersOpen
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line text-ink-secondary hover:bg-surface-overlay'
            }
          `}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Фильтры</span>
        </button>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-surface-raised border border-line rounded-lg">
          <Select
            label="Жанр"
            options={genreOptions}
            value={initialFilters.genre ?? 'all'}
            onChange={(e) =>
              updateUrl({ genre: e.target.value, page: '1' })
            }
          />
          <Select
            label="Статус"
            options={statusOptions}
            value={initialFilters.status ?? 'all'}
            onChange={(e) =>
              updateUrl({ status: e.target.value, page: '1' })
            }
          />
          <Select
            label="Сортировка"
            options={sortOptions}
            value={initialFilters.sort ?? 'updated'}
            onChange={(e) =>
              updateUrl({ sort: e.target.value, page: '1' })
            }
          />
        </div>
      )}

      {/* Count */}
      <p className="text-sm text-ink-muted mb-4">
        Найдено: {initialTotal}
      </p>

      {/* Grid */}
      <div
        className={`
          grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4
          ${isPending ? 'opacity-50' : ''}
          transition-opacity
        `}
      >
        {isPending
          ? Array.from({ length: 10 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))
          : initialProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
      </div>

      {initialProjects.length === 0 && !isPending && (
        <div className="text-center py-16">
          <BookEmptyIcon />
          <p className="text-ink-secondary mt-4">Ничего не найдено</p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          page={initialPage}
          totalPages={totalPages}
          onChange={(p) => updateUrl({ page: String(p) })}
        />
      </div>
    </div>
  );
}

function BookEmptyIcon() {
  return (
    <svg
      className="w-16 h-16 mx-auto text-ink-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="10" x2="15" y2="10" />
    </svg>
  );
}   