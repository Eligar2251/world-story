'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Users,
  FileText,
  Star,
  Settings,
  BarChart3,
  List,
  Globe,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import ChaptersManager from '@/components/writer/ChaptersManager';
import ProjectForm from '@/components/writer/ProjectForm';
import type { Project, Chapter, Volume, Genre, Tag } from '@/lib/types/database';

interface Stats {
  totalChapters: number;
  publishedChapters: number;
  draftChapters: number;
  totalWords: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  reviewCount: number;
  avgRating: number;
}

interface Props {
  project: Project;
  chapters: Chapter[];
  volumes: Volume[];
  stats: Stats;
  genres: Genre[];
  tags: Tag[];
}

export default function ProjectDashboard({
  project,
  chapters,
  volumes,
  stats,
  genres,
  tags,
}: Props) {
  const statusLabel: Record<string, string> = {
    draft: 'Черновик',
    ongoing: 'В работе',
    completed: 'Завершено',
    hiatus: 'Пауза',
  };

  const statusVariant: Record<
    string,
    'default' | 'accent' | 'success' | 'warning'
  > = {
    draft: 'default',
    ongoing: 'accent',
    completed: 'success',
    hiatus: 'warning',
  };

  const statCards = [
    {
      label: 'Слов',
      value: stats.totalWords.toLocaleString(),
      icon: FileText,
    },
    {
      label: 'Просмотров',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
    },
    {
      label: 'Лайков',
      value: stats.totalLikes.toLocaleString(),
      icon: Heart,
    },
    {
      label: 'Комментариев',
      value: stats.totalComments.toLocaleString(),
      icon: MessageCircle,
    },
    {
      label: 'Подписчиков',
      value: project.subscribers_count.toLocaleString(),
      icon: Users,
    },
    {
      label: 'Рейтинг',
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',
      icon: Star,
    },
  ];

  const tabItems = [
    {
      id: 'chapters',
      label: 'Главы',
      icon: <List size={14} />,
      count: stats.totalChapters,
    },
    {
      id: 'stats',
      label: 'Статистика',
      icon: <BarChart3 size={14} />,
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: <Settings size={14} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {/* Back button */}
        <Link
          href="/studio"
          className="p-2 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors shrink-0"
        >
          <ArrowLeft size={20} />
        </Link>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-ink truncate">
            {project.title}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={statusVariant[project.status] ?? 'default'}>
              {statusLabel[project.status] ?? project.status}
            </Badge>
            <span className="text-xs text-ink-muted">
              {stats.publishedChapters} опубл. / {stats.draftChapters} черн.
            </span>
            {project.visibility === 'public' && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Globe size={10} />
                Публичный
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/project/${project.id}/world`}>
            <Button variant="secondary" size="sm" icon={<Globe size={14} />}>
              <span className="hidden sm:inline">Архитектор мира</span>
              <span className="sm:hidden">Мир</span>
            </Button>
          </Link>

          {project.visibility === 'public' && (
            <Link href={`/work/${project.id}`} target="_blank">
              <Button variant="ghost" size="sm" icon={<Eye size={14} />}>
                <span className="hidden sm:inline">Как читатель</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-surface-raised border border-line rounded-lg p-3"
            >
              <div className="flex items-center gap-1.5 text-ink-muted mb-1">
                <Icon size={14} />
                <span className="text-xs">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-ink">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabItems} defaultTab="chapters">
        {(active) => {
          if (active === 'chapters') {
            return (
              <ChaptersManager
                project={project}
                chapters={chapters}
                volumes={volumes}
              />
            );
          }

          if (active === 'stats') {
            return (
              <div className="bg-surface-raised border border-line rounded-lg p-6">
                <h3 className="text-base font-semibold text-ink mb-4">
                  Подробная статистика
                </h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0">
                  <StatRow label="Всего глав" value={stats.totalChapters} />
                  <StatRow label="Опубликовано" value={stats.publishedChapters} />
                  <StatRow label="Черновики" value={stats.draftChapters} />
                  <StatRow
                    label="Всего слов"
                    value={stats.totalWords.toLocaleString()}
                  />
                  <StatRow
                    label="Всего просмотров"
                    value={stats.totalViews.toLocaleString()}
                  />
                  <StatRow
                    label="Всего лайков"
                    value={stats.totalLikes.toLocaleString()}
                  />
                  <StatRow
                    label="Комментариев"
                    value={stats.totalComments.toLocaleString()}
                  />
                  <StatRow
                    label="Подписчиков"
                    value={project.subscribers_count.toLocaleString()}
                  />
                  <StatRow label="Отзывов" value={stats.reviewCount} />
                  <StatRow
                    label="Средний рейтинг"
                    value={
                      stats.avgRating > 0
                        ? `${stats.avgRating.toFixed(1)} / 10`
                        : '—'
                    }
                  />
                  <StatRow
                    label="Среднее слов на главу"
                    value={
                      stats.totalChapters > 0
                        ? Math.round(
                            stats.totalWords / stats.totalChapters
                          ).toLocaleString()
                        : '—'
                    }
                  />
                  <StatRow
                    label="Время чтения (мин)"
                    value={
                      stats.totalWords > 0
                        ? `~${Math.ceil(stats.totalWords / 200)}`
                        : '—'
                    }
                  />
                </div>
              </div>
            );
          }

          /* settings tab */
          return (
            <ProjectForm
              genres={genres}
              tags={tags}
              project={project}
            />
          );
        }}
      </Tabs>
    </div>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between py-2.5 border-b border-line">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className="text-sm text-ink font-medium">{String(value)}</span>
    </div>
  );
}