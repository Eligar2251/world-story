'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, BookOpen } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Genre, Tag, Project, ProjectStatus, ProjectVisibility } from '@/lib/types/database';

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
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'draft');
  const [visibility, setVisibility] = useState<ProjectVisibility>(
    project?.visibility ?? 'private'
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    project?.tags?.map((t) => t.id) ?? []
  );
  const [coverUrl, setCoverUrl] = useState(project?.cover_url ?? '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(project?.cover_url ?? '');
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

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл обложки не более 5 МБ');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
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
      let finalCoverUrl = coverUrl;

      // Upload cover
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('covers')
          .upload(path, coverFile, { upsert: true });

        if (upErr) throw new Error('Ошибка загрузки обложки');

        const { data: urlData } = supabase.storage
          .from('covers')
          .getPublicUrl(path);
        finalCoverUrl = urlData.publicUrl;
      }

      const slug = slugify(title) || `project-${Date.now()}`;

      const projectData = {
        title: title.trim(),
        slug,
        description: description.trim() || null,
        cover_url: finalCoverUrl || null,
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
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Cover */}
      <div>
        <label className="text-sm font-medium text-ink-secondary block mb-2">
          Обложка
        </label>
        <div className="flex items-start gap-4">
          <div
            className="w-32 h-48 rounded-lg border-2 border-dashed border-line hover:border-accent flex items-center justify-center cursor-pointer overflow-hidden bg-surface-overlay transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {coverPreview ? (
              <Image
                src={coverPreview}
                alt="Обложка"
                width={128}
                height={192}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2">
                <Upload className="w-6 h-6 text-ink-muted mx-auto mb-1" />
                <span className="text-xs text-ink-muted">Загрузить</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
          {coverPreview && (
            <button
              type="button"
              onClick={() => {
                setCoverFile(null);
                setCoverPreview('');
                setCoverUrl('');
              }}
              className="p-1.5 rounded text-ink-muted hover:text-red-500 hover:bg-surface-overlay"
            >
              <X size={16} />
            </button>
          )}
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
        <label className="text-sm font-medium text-ink-secondary block mb-1.5">
          Аннотация
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="О чём ваша история..."
          rows={5}
          className="w-full rounded bg-surface-overlay border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y"
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
        <label className="text-sm font-medium text-ink-secondary block mb-2">
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
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selected
                    ? 'bg-accent-soft text-accent border-accent/30'
                    : 'bg-surface-overlay text-ink-secondary border-line hover:border-accent/30'
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
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}