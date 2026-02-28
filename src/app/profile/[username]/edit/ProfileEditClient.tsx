'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Аватар не более 2 МБ');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${profile.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (upErr) throw new Error('Ошибка загрузки аватара');
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          website: website.trim() || null,
          avatar_url: finalAvatarUrl || null,
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
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-sm text-red-500">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-sm text-green-600">
          Профиль обновлён! Перенаправление...
        </div>
      )}

      {/* Avatar */}
      <div>
        <label className="text-sm font-medium text-ink-secondary block mb-2">Аватар</label>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full bg-accent-soft flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-line hover:border-accent transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {avatarPreview ? (
              <Image src={avatarPreview} alt="Аватар" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-6 h-6 text-ink-muted" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          {avatarPreview && (
            <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(''); setAvatarUrl(''); }} className="text-sm text-red-500 hover:underline">
              Удалить
            </button>
          )}
        </div>
      </div>

      <Input label="Имя пользователя" value={profile.username} disabled className="opacity-60" />
      <Input label="Отображаемое имя" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ваше имя" />
      <TextArea label="О себе" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Расскажите о себе..." />
      <Input label="Веб-сайт" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>Сохранить</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Отмена</Button>
      </div>
    </form>
  );
}