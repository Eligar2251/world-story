import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Heart, BookOpen } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { Project } from '@/lib/types/database';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'default' }> = {
  ongoing: { label: 'Онгоинг', variant: 'accent' },
  completed: { label: 'Завершено', variant: 'success' },
  hiatus: { label: 'Заморожено', variant: 'warning' },
  draft: { label: 'Черновик', variant: 'default' },
};

interface Props {
  project: Project;
  size?: 'sm' | 'md';
}

function ProjectCardRaw({ project, size = 'md' }: Props) {
  const status = statusMap[project.status] ?? statusMap.draft;
  const isMd = size === 'md';

  return (
    <Link
      href={`/work/${project.id}`}
      className="group flex flex-col rounded-lg bg-surface-raised border border-line overflow-hidden hover:shadow-soft transition-shadow"
      prefetch={false}
    >
      <div
        className={`relative w-full overflow-hidden bg-surface-overlay ${
          isMd ? 'aspect-[2/3]' : 'aspect-[3/4]'
        }`}
      >
        {project.cover_url ? (
          <Image
            src={project.cover_url}
            alt={project.title}
            fill
            sizes={isMd ? '200px' : '155px'}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-ink-muted" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      <div className={`p-3 flex flex-col gap-1 ${isMd ? '' : 'p-2'}`}>
        <h3
          className={`font-semibold text-ink line-clamp-2 group-hover:text-accent transition-colors ${
            isMd ? 'text-sm' : 'text-xs'
          }`}
        >
          {project.title}
        </h3>

        {project.author && (
          <p className="text-xs text-ink-muted truncate">
            {project.author.display_name ?? project.author.username}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {formatCount(project.views_count)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} />
            {formatCount(project.likes_count)}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={11} />
            {project.chapters_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

const ProjectCard = memo(ProjectCardRaw);
export default ProjectCard;

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}