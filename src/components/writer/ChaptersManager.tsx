'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  GripVertical,
  Edit3,
  Trash2,
  Globe,
  Lock,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  Eye,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Project, Chapter, Volume } from '@/lib/types/database';

const statusVariant: Record<string, 'default' | 'success' | 'accent'> = {
  draft: 'default',
  published: 'success',
  scheduled: 'accent',
};

const statusLabel: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликовано',
  scheduled: 'Запланировано',
};

interface Props {
  project: Project;
  chapters: Chapter[];
  volumes: Volume[];
}

export default function ChaptersManager({
  project,
  chapters: initChapters,
  volumes: initVolumes,
}: Props) {
  const supabase = createClient();
  const [chapters, setChapters] = useState(initChapters);
  const [volumes, setVolumes] = useState(initVolumes);
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [showNewVolume, setShowNewVolume] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(
    new Set(initVolumes.map((v) => v.id))
  );

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  function toggleVolume(id: string) {
    setExpandedVolumes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ---- Create Chapter ----
  async function handleCreateChapter(volumeId?: string) {
    if (!newTitle.trim()) return;
    setCreating(true);

    const slug =
      newTitle
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s-]/gi, '')
        .replace(/\s+/g, '-')
        .slice(0, 60) || `chapter-${Date.now()}`;

    const sortOrder = chapters.length;

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        project_id: project.id,
        volume_id: volumeId || null,
        title: newTitle.trim(),
        slug: `${slug}-${Date.now()}`,
        sort_order: sortOrder,
        status: 'draft',
        content: '',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Create chapter error:', error);
      alert(`Ошибка создания главы: ${error.message}`);
    } else if (data) {
      setChapters((prev) => [...prev, data as Chapter]);
      setNewTitle('');
      setShowNewChapter(false);
    }
    setCreating(false);
  }

  // ---- Create Volume ----
  async function handleCreateVolume() {
    if (!newVolumeTitle.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('volumes')
      .insert({
        project_id: project.id,
        title: newVolumeTitle.trim(),
        sort_order: volumes.length,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Create volume error:', error);
      alert(`Ошибка создания тома: ${error.message}`);
    } else if (data) {
      setVolumes((prev) => [...prev, data as Volume]);
      setExpandedVolumes((prev) => new Set([...prev, data.id]));
      setNewVolumeTitle('');
      setShowNewVolume(false);
    }
    setCreating(false);
  }

  // ---- Delete Chapter ----
  async function handleDeleteChapter(id: string) {
    if (!confirm('Удалить главу? Это действие нельзя отменить.')) return;

    const { error } = await supabase.from('chapters').delete().eq('id', id);

    if (error) {
      console.error('Delete chapter error:', error);
      alert(`Ошибка удаления: ${error.message}`);
    } else {
      setChapters((prev) => prev.filter((c) => c.id !== id));
    }
    setMenuOpen(null);
  }

  // ---- Toggle Publish ----
  async function handleTogglePublish(chapter: Chapter) {
    const newStatus = chapter.status === 'published' ? 'draft' : 'published';
    const publishedAt = newStatus === 'published' ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('chapters')
      .update({
        status: newStatus,
        published_at: publishedAt,
      })
      .eq('id', chapter.id)
      .select('*')
      .single();

    if (error) {
      console.error('Toggle publish error:', error);
      alert(`Ошибка: ${error.message}`);
      return;
    }

    if (data) {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapter.id ? (data as Chapter) : c
        )
      );
    }

    setMenuOpen(null);
  }

  // ---- Drag and Drop ----
  function handleDragStart(index: number) {
    dragItem.current = index;
  }

  function handleDragEnter(index: number) {
    dragOverItem.current = index;
  }

  async function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const reordered = [...chapters];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    const updated = reordered.map((ch, i) => ({
      ...ch,
      sort_order: i,
    }));
    setChapters(updated);

    // Persist sort order
    await Promise.all(
      updated.map((ch) =>
        supabase
          .from('chapters')
          .update({ sort_order: ch.sort_order })
          .eq('id', ch.id)
      )
    );

    dragItem.current = null;
    dragOverItem.current = null;
  }

  // Group chapters
  const ungrouped = chapters.filter((c) => !c.volume_id);

  return (
    <div>
      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => {
            setShowNewChapter(true);
            setShowNewVolume(false);
          }}
        >
          Добавить главу
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          onClick={() => {
            setShowNewVolume(true);
            setShowNewChapter(false);
          }}
        >
          Добавить том
        </Button>
      </div>

      {/* New volume form */}
      {showNewVolume && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-surface-raised border border-line rounded-lg">
          <Input
            placeholder="Название тома..."
            value={newVolumeTitle}
            onChange={(e) => setNewVolumeTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateVolume()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleCreateVolume} loading={creating}>
            Создать
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowNewVolume(false);
              setNewVolumeTitle('');
            }}
          >
            Отмена
          </Button>
        </div>
      )}

      {/* New chapter form */}
      {showNewChapter && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-surface-raised border border-line rounded-lg">
          <Input
            placeholder="Название главы..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateChapter()}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => handleCreateChapter()}
            loading={creating}
          >
            Создать
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowNewChapter(false);
              setNewTitle('');
            }}
          >
            Отмена
          </Button>
        </div>
      )}

      {/* Volumes */}
      {volumes.map((volume) => {
        const volChapters = chapters
          .filter((c) => c.volume_id === volume.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        const expanded = expandedVolumes.has(volume.id);

        return (
          <div key={volume.id} className="mb-3">
            <button
              onClick={() => toggleVolume(volume.id)}
              className="flex items-center gap-2 w-full text-left px-3 py-2.5 bg-surface-overlay border border-line rounded-lg hover:bg-line/50 transition-colors"
            >
              {expanded ? (
                <ChevronDown size={16} className="text-ink-muted" />
              ) : (
                <ChevronRight size={16} className="text-ink-muted" />
              )}
              <span className="text-sm font-semibold text-ink">
                {volume.title}
              </span>
              <span className="text-xs text-ink-muted ml-1">
                ({volChapters.length})
              </span>
            </button>
            {expanded && (
              <div className="ml-4 mt-1 space-y-1">
                {volChapters.map((ch) => (
                  <ChapterRow
                    key={ch.id}
                    chapter={ch}
                    projectId={project.id}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onDelete={handleDeleteChapter}
                    onTogglePublish={handleTogglePublish}
                  />
                ))}
                {volChapters.length === 0 && (
                  <p className="text-xs text-ink-muted py-2 pl-3">
                    В этом томе пока нет глав
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Ungrouped chapters */}
      {ungrouped.length > 0 && volumes.length > 0 && (
        <p className="text-xs text-ink-muted mb-2 mt-4">Без тома</p>
      )}
      <div className="space-y-1">
        {ungrouped.map((ch) => {
          const globalIndex = chapters.indexOf(ch);
          return (
            <div
              key={ch.id}
              draggable
              onDragStart={() => handleDragStart(globalIndex)}
              onDragEnter={() => handleDragEnter(globalIndex)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <ChapterRow
                chapter={ch}
                projectId={project.id}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                onDelete={handleDeleteChapter}
                onTogglePublish={handleTogglePublish}
                draggable
              />
            </div>
          );
        })}
      </div>

      {chapters.length === 0 && !showNewChapter && (
        <div className="text-center py-12 text-ink-secondary text-sm">
          Добавьте первую главу, чтобы начать
        </div>
      )}
    </div>
  );
}

/* ===== Chapter Row ===== */

function ChapterRow({
  chapter,
  projectId,
  menuOpen,
  setMenuOpen,
  onDelete,
  onTogglePublish,
  draggable,
}: {
  chapter: Chapter;
  projectId: string;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (ch: Chapter) => void;
  draggable?: boolean;
}) {
  const [publishing, setPublishing] = useState(false);

  async function handlePublishClick() {
    setPublishing(true);
    await onTogglePublish(chapter);
    setPublishing(false);
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-raised border border-line rounded-lg hover:shadow-soft transition-shadow group">
      {draggable && (
        <GripVertical
          size={14}
          className="text-ink-muted cursor-grab shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}

      <Link
        href={`/editor/${chapter.id}`}
        className="flex-1 min-w-0 flex items-center gap-3"
        prefetch={false}
      >
        <span className="text-sm text-ink hover:text-accent transition-colors truncate">
          {chapter.title}
        </span>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-ink-muted hidden sm:inline">
          {(chapter.word_count ?? 0).toLocaleString()} сл.
        </span>
        <Badge variant={statusVariant[chapter.status] ?? 'default'}>
          {statusLabel[chapter.status] ?? chapter.status}
        </Badge>

        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(menuOpen === chapter.id ? null : chapter.id);
            }}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-overlay transition-colors"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen === chapter.id && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(null)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface-raised border border-line rounded-xl shadow-elevated py-1.5 z-20">
                <Link
                  href={`/editor/${chapter.id}`}
                  onClick={() => setMenuOpen(null)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay transition-colors"
                >
                  <Edit3 size={14} />
                  Редактировать
                </Link>
                <button
                  onClick={handlePublishClick}
                  disabled={publishing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay transition-colors w-full text-left disabled:opacity-50"
                >
                  {publishing ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.42 31.42" strokeDashoffset="10" />
                    </svg>
                  ) : chapter.status === 'published' ? (
                    <Lock size={14} />
                  ) : (
                    <Globe size={14} />
                  )}
                  {chapter.status === 'published'
                    ? 'Снять с публикации'
                    : 'Опубликовать'}
                </button>
                {chapter.status === 'published' && (
                  <Link
                    href={`/read/${chapter.id}`}
                    onClick={() => setMenuOpen(null)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay transition-colors"
                  >
                    <Eye size={14} />
                    Читать
                  </Link>
                )}
                <div className="border-t border-line my-1" />
                <button
                  onClick={() => onDelete(chapter.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors w-full text-left"
                >
                  <Trash2 size={14} />
                  Удалить
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}