'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Heart,
  Share2,
  Bell,
  Plus,
  Clock,
  Eye,
  MessageCircle,
  User as UserIcon,
  List,
  MapPin,
  Star,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import StarRating from '@/components/ui/StarRating';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Project, Chapter, Shelf } from '@/lib/types/database';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'accent' | 'default' }> = {
  ongoing: { label: 'Онгоинг', variant: 'accent' },
  completed: { label: 'Завершено', variant: 'success' },
  hiatus: { label: 'Заморожено', variant: 'warning' },
  draft: { label: 'Черновик', variant: 'default' },
};

const shelfOptions: { value: Shelf; label: string }[] = [
  { value: 'reading', label: 'Читаю' },
  { value: 'planned', label: 'В планах' },
  { value: 'completed', label: 'Прочитано' },
  { value: 'favorite', label: 'Любимое' },
];

interface Props {
  project: Project;
  chapters: Chapter[];
}

export default function WorkPageClient({ project, chapters }: Props) {
  const { user } = useAuth();
  const supabase = createClient();
  const status = statusMap[project.status] ?? statusMap.draft;

  const [libraryShelf, setLibraryShelf] = useState<Shelf | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [shelfMenuOpen, setShelfMenuOpen] = useState(false);

  // Load user state
  useEffect(() => {
    if (!user) return;

    async function load() {
      const [lib, like, sub] = await Promise.all([
        supabase
          .from('library_entries')
          .select('shelf')
          .eq('user_id', user!.id)
          .eq('project_id', project.id)
          .single(),
        supabase
          .from('likes')
          .select('id')
          .eq('user_id', user!.id)
          .eq('target_type', 'project')
          .eq('target_id', project.id)
          .single(),
        supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user!.id)
          .eq('target_type', 'project')
          .eq('target_id', project.id)
          .single(),
      ]);

      if (lib.data) setLibraryShelf(lib.data.shelf as Shelf);
      if (like.data) setIsLiked(true);
      if (sub.data) setIsSubscribed(true);
    }

    load();
  }, [user, project.id, supabase]);

  async function handleAddToLibrary(shelf: Shelf) {
    if (!user) return;
    if (libraryShelf) {
      await supabase
        .from('library_entries')
        .update({ shelf })
        .eq('user_id', user.id)
        .eq('project_id', project.id);
    } else {
      await supabase.from('library_entries').insert({
        user_id: user.id,
        project_id: project.id,
        shelf,
      });
    }
    setLibraryShelf(shelf);
    setShelfMenuOpen(false);
  }

  async function handleLike() {
    if (!user) return;
    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', 'project')
        .eq('target_id', project.id);
      setIsLiked(false);
    } else {
      await supabase.from('likes').insert({
        user_id: user.id,
        target_type: 'project',
        target_id: project.id,
      });
      setIsLiked(true);
    }
  }

  async function handleSubscribe() {
    if (!user) return;
    if (isSubscribed) {
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', 'project')
        .eq('target_id', project.id);
      setIsSubscribed(false);
    } else {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        target_type: 'project',
        target_id: project.id,
      });
      setIsSubscribed(true);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: project.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  const totalWords = chapters.reduce((s, c) => s + c.word_count, 0);

  const tabItems = [
    { id: 'chapters', label: 'Главы', icon: <List size={14} />, count: chapters.length },
    { id: 'reviews', label: 'Отзывы', icon: <Star size={14} /> },
    { id: 'about', label: 'О проекте', icon: <BookOpen size={14} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Cover */}
        <div className="shrink-0 w-[200px] mx-auto md:mx-0">
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-overlay border border-line">
            {project.cover_url ? (
              <Image
                src={project.cover_url}
                alt={project.title}
                width={200}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-ink-muted" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            {project.genre && (
              <Badge>{project.genre.name}</Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-ink mb-2">
            {project.title}
          </h1>

          {project.author && (
            <Link
              href={`/profile/${project.author.username}`}
              className="inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-accent transition-colors mb-4"
            >
              <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center text-accent text-xs font-medium">
                {project.author.display_name?.charAt(0) ?? 'A'}
              </div>
              {project.author.display_name ?? project.author.username}
            </Link>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-ink-secondary mb-4">
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {project.views_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={14} />
              {project.likes_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={14} />
              {chapters.length} гл.
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {totalWords.toLocaleString()} сл.
            </span>
          </div>

          {/* Rating */}
          <div className="mb-4">
            <StarRating value={project.rating_avg} />
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/catalog?tag=${tag.slug}`}
                  className="px-2 py-0.5 text-xs rounded bg-surface-overlay text-ink-secondary border border-line hover:border-accent hover:text-accent transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {chapters.length > 0 && (
              <Link href={`/read/${chapters[0].id}`}>
                <Button
                  icon={<BookOpen size={16} />}
                >
                  Читать
                </Button>
              </Link>
            )}

            <div className="relative">
              <Button
                variant={libraryShelf ? 'secondary' : 'secondary'}
                onClick={() =>
                  user
                    ? setShelfMenuOpen(!shelfMenuOpen)
                    : undefined
                }
                icon={<Plus size={16} />}
              >
                {libraryShelf
                  ? shelfOptions.find((s) => s.value === libraryShelf)?.label
                  : 'В библиотеку'}
              </Button>
              {shelfMenuOpen && (
                <div className="absolute top-full mt-1 left-0 w-40 bg-surface-raised border border-line rounded-lg shadow-elevated py-1 z-20">
                  {shelfOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAddToLibrary(opt.value)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        libraryShelf === opt.value
                          ? 'text-accent bg-accent-soft'
                          : 'text-ink-secondary hover:bg-surface-overlay'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant={isLiked ? 'primary' : 'ghost'}
              onClick={handleLike}
              icon={
                <Heart
                  size={16}
                  fill={isLiked ? 'currentColor' : 'none'}
                />
              }
            >
              {isLiked ? 'Нравится' : 'Лайк'}
            </Button>

            <Button
              variant={isSubscribed ? 'secondary' : 'ghost'}
              onClick={handleSubscribe}
              icon={<Bell size={16} />}
            >
              {isSubscribed ? 'Подписан' : 'Подписаться'}
            </Button>

            <Button variant="ghost" onClick={handleShare} icon={<Share2 size={16} />}>
              Поделиться
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="mb-6 p-4 bg-surface-raised border border-line rounded-lg">
          <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabItems} defaultTab="chapters">
        {(activeTab) => {
          if (activeTab === 'chapters') {
            return <ChaptersList chapters={chapters} />;
          }
          if (activeTab === 'reviews') {
            return <ReviewsTab projectId={project.id} />;
          }
          return (
            <div className="text-sm text-ink-secondary">
              <p>Дополнительная информация о проекте будет доступна позже.</p>
            </div>
          );
        }}
      </Tabs>
    </div>
  );
}

/* ===== Chapters List ===== */

function ChaptersList({ chapters }: { chapters: Chapter[] }) {
  if (chapters.length === 0) {
    return (
      <div className="text-center py-12 text-ink-secondary text-sm">
        Главы пока не опубликованы
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {chapters.map((ch, i) => (
        <Link
          key={ch.id}
          href={`/read/${ch.id}`}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-overlay transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-ink-muted w-8 text-right shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-ink group-hover:text-accent truncate transition-colors">
              {ch.title}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-muted shrink-0 ml-4">
            <span className="hidden sm:inline">
              {ch.word_count.toLocaleString()} сл.
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Eye size={12} />
              {ch.views_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} />
              {ch.comments_count}
            </span>
            <span>
              {new Date(ch.published_at ?? ch.created_at).toLocaleDateString(
                'ru',
                { day: 'numeric', month: 'short' }
              )}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ===== Reviews Tab ===== */

function ReviewsTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const supabase = createClient();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('reviews')
        .select('*, user:profiles!reviews_user_id_fkey(id,username,display_name,avatar_url)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setReviews(data ?? []);
      setLoading(false);
    }
    load();
  }, [projectId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || rating === 0) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from('reviews')
      .upsert(
        {
          user_id: user.id,
          project_id: projectId,
          rating,
          content: text || null,
        },
        { onConflict: 'user_id,project_id' }
      )
      .select('*, user:profiles!reviews_user_id_fkey(id,username,display_name,avatar_url)')
      .single();

    if (data) {
      setReviews((prev) => {
        const filtered = prev.filter((r) => r.user_id !== user.id);
        return [data, ...filtered];
      });
      setText('');
    }
    setSubmitting(false);
  }

  return (
    <div>
      {/* Write review */}
      {user && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-surface-raised border border-line rounded-lg mb-6"
        >
          <h3 className="text-sm font-semibold text-ink mb-3">
            Оставить отзыв
          </h3>
          <div className="mb-3">
            <StarRating
              value={rating}
              interactive
              onChange={(v) => setRating(v)}
              size={24}
            />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Расскажите о произведении..."
            rows={3}
            className="w-full rounded bg-surface-overlay border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y mb-3"
          />
          <Button type="submit" loading={submitting} disabled={rating === 0}>
            Отправить
          </Button>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-surface-raised border border-line rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full skeleton" />
                <div className="h-4 skeleton w-24" />
              </div>
              <div className="h-3 skeleton w-full mb-2" />
              <div className="h-3 skeleton w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-secondary text-center py-8">
          Отзывов пока нет. Будьте первым!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 bg-surface-raised border border-line rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent text-xs font-medium">
                    {rev.user?.display_name?.charAt(0) ?? 'U'}
                  </div>
                  <span className="text-sm font-medium text-ink">
                    {rev.user?.display_name ?? rev.user?.username}
                  </span>
                </div>
                <StarRating value={rev.rating} size={14} />
              </div>
              {rev.content && (
                <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">
                  {rev.content}
                </p>
              )}
              <p className="text-xs text-ink-muted mt-2">
                {new Date(rev.created_at).toLocaleDateString('ru', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}