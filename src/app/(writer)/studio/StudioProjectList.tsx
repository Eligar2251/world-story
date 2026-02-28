'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Eye,
  Heart,
  MessageCircle,
  Users,
  MoreVertical,
  Edit3,
  Trash2,
  ExternalLink,
  FileText,
  Globe,
  Lock,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/lib/types/database';

const statusMap: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'accent' | 'default' }
> = {
  draft: { label: 'Черновик', variant: 'default' },
  ongoing: { label: 'В работе', variant: 'accent' },
  completed: { label: 'Завершено', variant: 'success' },
  hiatus: { label: 'Пауза', variant: 'warning' },
};

interface Props {
  projects: Project[];
}

export default function StudioProjectList({
  projects: initial,
}: Props) {
  const [projects, setProjects] = useState(initial);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const supabase = createClient();

  async function handleDelete(id: string) {
    if (!confirm('Удалить проект и все главы? Это нельзя отменить.')) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setMenuOpen(null);
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <svg
          className="w-20 h-20 mx-auto text-ink-muted mb-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <h2 className="text-xl font-semibold text-ink mb-2">
          Пока ничего нет
        </h2>
        <p className="text-ink-secondary mb-6">
          Создайте свой первый проект и начните писать
        </p>
        <Link
          href="/studio/new"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded font-medium transition-colors"
        >
          Создать проект
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => {
        const status = statusMap[project.status] ?? statusMap.draft;
        return (
          <div
            key={project.id}
            className="flex items-start gap-4 p-4 bg-surface-raised border border-line rounded-lg hover:shadow-soft transition-shadow"
          >
            {/* Cover thumbnail */}
            <Link
              href={`/project/${project.id}`}
              className="shrink-0 w-16 h-24 rounded overflow-hidden bg-surface-overlay"
            >
              {project.cover_url ? (
                <Image
                  src={project.cover_url}
                  alt={project.title}
                  width={64}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-ink-muted" />
                </div>
              )}
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/project/${project.id}`}
                    className="text-base font-semibold text-ink hover:text-accent transition-colors"
                  >
                    {project.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {project.visibility === 'public' ? (
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <Globe size={10} /> Опубликовано
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <Lock size={10} /> Приватный
                      </span>
                    )}
                    {project.genre && (
                      <span className="text-xs text-ink-muted">
                        {project.genre.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpen(
                        menuOpen === project.id ? null : project.id
                      )
                    }
                    className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-overlay transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === project.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-surface-raised border border-line rounded-lg shadow-elevated py-1 z-20">
                        <Link
                          href={`/project/${project.id}`}
                          onClick={() => setMenuOpen(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay transition-colors"
                        >
                          <Edit3 size={14} />
                          Редактировать
                        </Link>
                        {project.visibility === 'public' && (
                          <Link
                            href={`/work/${project.id}`}
                            onClick={() => setMenuOpen(null)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay transition-colors"
                          >
                            <ExternalLink size={14} />
                            Открыть как читатель
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-surface-overlay transition-colors w-full text-left"
                        >
                          <Trash2 size={14} />
                          Удалить
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Description preview */}
              {project.description && (
                <p className="text-sm text-ink-muted mt-2 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {project.chapters_count} гл.
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  {project.views_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={12} />
                  {project.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {project.subscribers_count}
                </span>
                <span className="ml-auto">
                  Обн.{' '}
                  {new Date(project.updated_at).toLocaleDateString('ru', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}