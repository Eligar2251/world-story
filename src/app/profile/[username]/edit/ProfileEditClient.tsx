'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/database';

interface Props {
  profile: Profile;
}

export default function ProfileEditClient({ profile }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Аватар не более 2 МБ');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Допустимы только изображения');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Генерируем уникальный путь: userId/timestamp.ext
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `${profile.id}/${Date.now()}.${ext}`;

      // Удаляем старый аватар если есть
      if (avatarUrl) {
        const oldPath = extractStoragePath(avatarUrl, 'avatars');
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Загружаем новый
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Ошибка загрузки: ${uploadError.message}`);
      }

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Сразу обновляем в БД
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (dbError) {
        throw new Error(`Ошибка сохранения: ${dbError.message}`);
      }

      setAvatarUrl(publicUrl);
      setAvatarPreview(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить аватар');
    } finally {
      setUploading(false);
      // Сбрасываем input чтобы можно было загрузить тот же файл
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleRemoveAvatar() {
    if (avatarUrl) {
      const oldPath = extractStoragePath(avatarUrl, 'avatars');
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', profile.id);

    setAvatarUrl('');
    setAvatarPreview('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          website: website.trim() || null,
          // avatar_url уже обновлён при загрузке
        })
        .eq('id', profile.id);

      if (updateErr) throw new Error(updateErr.message);

      setSuccess(true);
      setTimeout(() => {
        router.push(`/profile/${profile.username}`);
        router.refresh();
      }, 1000);
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
      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-sm text-emerald-700">
          Профиль обновлён! Перенаправление...
        </div>
      )}

      {/* Avatar */}
      <div>
        <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide block mb-2">
          Аватар
        </label>
        <div className="flex items-center gap-4">
          <div
            className={`
              w-20 h-20 rounded-full flex items-center justify-center overflow-hidden
              cursor-pointer border-2 border-dashed border-line hover:border-accent/40
              transition-all duration-150 relative
              ${uploading ? 'opacity-60 pointer-events-none' : ''}
            `}
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Аватар"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="bg-accent-soft w-full h-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-ink-muted" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-surface/60 flex items-center justify-center rounded-full">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm text-accent hover:underline disabled:opacity-50"
            >
              {avatarPreview ? 'Заменить' : 'Загрузить'}
            </button>
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="text-sm text-red-500 hover:underline disabled:opacity-50"
              >
                Удалить
              </button>
            )}
            <span className="text-2xs text-ink-muted">
              JPG, PNG, WebP. До 2 МБ.
            </span>
          </div>
        </div>
      </div>

      <Input
        label="Имя пользователя"
        value={profile.username}
        disabled
        className="opacity-50"
      />
      <Input
        label="Отображаемое имя"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Ваше имя"
      />
      <TextArea
        label="О себе"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        placeholder="Расскажите о себе..."
      />
      <Input
        label="Веб-сайт"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://example.com"
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          Сохранить
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

/**
 * Извлекает путь файла из публичного URL Supabase Storage
 */
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