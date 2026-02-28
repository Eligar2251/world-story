'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, BookOpen, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type {
  Genre,
  Tag,
  Project,
  ProjectStatus,
  ProjectVisibility,
} from '@/lib/types/database';

const statusOptions = [
  { value: 'draft', label: 'Черновик' },
  { value: 'ongoing', label: 'В работе' },
  { value: 'completed', label: 'Завершено' },
  { value: 'hiatus', label: 'На паузе' },
];

const visibilityOptions = [
  { value: 'private', label: 'Приватный' },
  { value: 'public', label: 'Публичный' },
];

interface Props {
  genres: Genre[];
  tags: Tag[];
  project?: Project;
}

export default function ProjectForm({ genres, tags, project }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!project;

  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [genreId, setGenreId] = useState(String(project?.genre_id ?? ''));
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? 'draft'
  );
  const [visibility, setVisibility] = useState<ProjectVisibility>(
    project?.visibility ?? 'private'
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    project?.tags?.map((t) => t.id) ?? []
  );
  const [coverUrl, setCoverUrl] = useState(project?.cover_url ?? '');
  const [coverPreview, setCoverPreview] = useState(project?.cover_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Обложка не более 5 МБ');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Допустимы только изображения');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      // Удаляем старую обложку
      if (coverUrl) {
        const oldPath = extractStoragePath(coverUrl, 'covers');
        if (oldPath) {
          await supabase.storage.from('covers').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Ошибка загрузки: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      setCoverUrl(urlData.publicUrl);
      setCoverPreview(urlData.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить обложку');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleRemoveCover() {
    if (coverUrl && user) {
      const oldPath = extractStoragePath(coverUrl, 'covers');
      if (oldPath) {
        supabase.storage.from('covers').remove([oldPath]);
      }
    }
    setCoverUrl('');
    setCoverPreview('');
  }

  function toggleTag(tagId: number) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      setError('Введите название');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const slug = slugify(title) || `project-${Date.now()}`;

      const projectData = {
        title: title.trim(),
        slug,
        description: description.trim() || null,
        cover_url: coverUrl || null,
        genre_id: genreId ? Number(genreId) : null,
        status,
        visibility,
        author_id: user.id,
      };

      let projectId = project?.id;

      if (isEdit && projectId) {
        const { error: updateErr } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId);
        if (updateErr) throw new Error(updateErr.message);
      } else {
        const { data: newProject, error: insertErr } = await supabase
          .from('projects')
          .insert(projectData)
          .select('id')
          .single();
        if (insertErr) throw new Error(insertErr.message);
        projectId = newProject.id;
      }

      // Sync tags
      await supabase
        .from('project_tags')
        .delete()
        .eq('project_id', projectId);

      if (selectedTags.length > 0) {
        await supabase.from('project_tags').insert(
          selectedTags.map((tagId) => ({
            project_id: projectId!,
            tag_id: tagId,
          }))
        );
      }

      router.push(`/project/${projectId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/8 border border-red-500/15 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Cover */}
      <div>
        <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide block mb-2">
          Обложка
        </label>
        <div className="flex items-start gap-4">
          <div
            className={`
              w-32 h-48 rounded-xl border-2 border-dashed border-line
              hover:border-accent/40 flex items-center justify-center
              cursor-pointer overflow-hidden bg-surface-overlay
              transition-all duration-150 relative
              ${uploading ? 'opacity-60 pointer-events-none' : ''}
            `}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {coverPreview ? (
              <Image
                src={coverPreview}
                alt="Обложка"
                width={128}
                height={192}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="text-center p-2">
                <Upload className="w-5 h-5 text-ink-muted mx-auto mb-1" />
                <span className="text-2xs text-ink-muted">Загрузить</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-surface/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleCoverChange}
            className="hidden"
          />

          <div className="flex flex-col gap-1 pt-1">
            {coverPreview && (
              <button
                type="button"
                onClick={handleRemoveCover}
                disabled={uploading}
                className="text-sm text-red-500 hover:underline disabled:opacity-50 text-left"
              >
                Удалить обложку
              </button>
            )}
            <span className="text-2xs text-ink-muted">
              JPG, PNG, WebP. До 5 МБ.
              <br />
              Рекомендуемое 400 x 600
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <Input
        label="Название"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название вашего произведения"
        required
      />

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide block mb-1.5">
          Аннотация
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="О чём ваша история..."
          rows={5}
          className="w-full rounded-lg bg-surface border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-y transition-all"
        />
      </div>

      {/* Genre & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Жанр"
          options={[
            { value: '', label: 'Выберите жанр' },
            ...genres.map((g) => ({ value: String(g.id), label: g.name })),
          ]}
          value={genreId}
          onChange={(e) => setGenreId(e.target.value)}
        />
        <Select
          label="Статус"
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
        />
        <Select
          label="Видимость"
          options={visibilityOptions}
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as ProjectVisibility)
          }
        />
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide block mb-2">
          Теги
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                  selected
                    ? 'bg-accent-soft text-accent border-accent/25'
                    : 'bg-surface-overlay text-ink-secondary border-line hover:border-accent/25 hover:text-ink'
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Сохранить' : 'Создать проект'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

function extractStoragePath(url: string, bucket: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  } catch {
    return null;
  }
}