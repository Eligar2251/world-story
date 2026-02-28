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

  // Drag state
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
      .select()
      .single();

    if (data) {
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

    const { data } = await supabase
      .from('volumes')
      .insert({
        project_id: project.id,
        title: newVolumeTitle.trim(),
        sort_order: volumes.length,
      })
      .select()
      .single();

    if (data) {
      setVolumes((prev) => [...prev, data as Volume]);
      setExpandedVolumes((prev) => new Set([...prev, data.id]));
      setNewVolumeTitle('');
      setShowNewVolume(false);
    }
    setCreating(false);
  }

  // ---- Delete Chapter ----
  async function handleDeleteChapter(id: string) {
    if (!confirm('Удалить главу?')) return;
    await supabase.from('chapters').delete().eq('id', id);
    setChapters((prev) => prev.filter((c) => c.id !== id));
    setMenuOpen(null);
  }

  // ---- Toggle Publish ----
  async function handleTogglePublish(chapter: Chapter) {
    const newStatus =
      chapter.status === 'published' ? 'draft' : 'published';
    const publishedAt =
      newStatus === 'published' ? new Date().toISOString() : null;

    await supabase
      .from('chapters')
      .update({ status: newStatus, published_at: publishedAt })
      .eq('id', chapter.id);

    setChapters((prev) =>
      prev.map((c) =>
        c.id === chapter.id
          ? { ...c, status: newStatus, published_at: publishedAt }
          : c
      )
    );
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
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...chapters];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    // Update sort_order locally
    const updated = reordered.map((ch, i) => ({
      ...ch,
      sort_order: i,
    }));
    setChapters(updated);

    // Persist
    const promises = updated.map((ch) =>
      supabase
        .from('chapters')
        .update({ sort_order: ch.sort_order })
        .eq('id', ch.id)
    );
    await Promise.all(promises);

    dragItem.current = null;
    dragOverItem.current = null;
  }

  // Group chapters by volume
  const ungrouped = chapters.filter((c) => !c.volume_id);

  return (
    <div>
      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowNewChapter(true)}
        >
          Добавить главу
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          onClick={() => setShowNewVolume(true)}
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
            onClick={() => setShowNewVolume(false)}
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
            onKeyDown={(e) =>
              e.key === 'Enter' && handleCreateChapter()
            }
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
            onClick={() => setShowNewChapter(false)}
          >
            Отмена
          </Button>
        </div>
      )}

      {/* Volumes */}
      {volumes.map((volume) => {
        const volChapters = chapters.filter(
          (c) => c.volume_id === volume.id
        );
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
        {ungrouped.map((ch, i) => (
          <div
            key={ch.id}
            draggable
            onDragStart={() => handleDragStart(chapters.indexOf(ch))}
            onDragEnter={() => handleDragEnter(chapters.indexOf(ch))}
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
        ))}
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
      >
        <span className="text-sm text-ink hover:text-accent transition-colors truncate">
          {chapter.title}
        </span>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-ink-muted hidden sm:inline">
          {chapter.word_count.toLocaleString()} сл.
        </span>
        <Badge variant={statusVariant[chapter.status]}>
          {statusLabel[chapter.status]}
        </Badge>

        <div className="relative">
          <button
            onClick={() =>
              setMenuOpen(menuOpen === chapter.id ? null : chapter.id)
            }
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
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface-raised border border-line rounded-lg shadow-elevated py-1 z-20">
                <Link
                  href={`/editor/${chapter.id}`}
                  onClick={() => setMenuOpen(null)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay"
                >
                  <Edit3 size={14} />
                  Редактировать
                </Link>
                <button
                  onClick={() => onTogglePublish(chapter)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay w-full text-left"
                >
                  {chapter.status === 'published' ? (
                    <>
                      <Lock size={14} />
                      Снять с публикации
                    </>
                  ) : (
                    <>
                      <Globe size={14} />
                      Опубликовать
                    </>
                  )}
                </button>
                {chapter.status === 'published' && (
                  <Link
                    href={`/read/${chapter.id}`}
                    onClick={() => setMenuOpen(null)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface-overlay"
                  >
                    <Eye size={14} />
                    Читать
                  </Link>
                )}
                <button
                  onClick={() => onDelete(chapter.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-surface-overlay w-full text-left"
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