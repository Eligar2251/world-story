import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, Calendar, Globe, BookOpen, Eye, Heart,
} from 'lucide-react';
import ProjectCard from '@/components/cards/ProjectCard';
import type { Profile, Project } from '@/lib/types/database';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username} — WorldStory` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) notFound();

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      author:profiles!projects_author_id_fkey(id,username,display_name,avatar_url),
      genre:genres!projects_genre_id_fkey(id,name,slug)
    `)
    .eq('author_id', profile.id)
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false });

  const totalViews = (projects ?? []).reduce((s, p: any) => s + (p.views_count ?? 0), 0);
  const totalLikes = (projects ?? []).reduce((s, p: any) => s + (p.likes_count ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-accent-soft flex items-center justify-center text-accent text-3xl font-bold shrink-0 overflow-hidden">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.username}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            (profile.display_name ?? profile.username).charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-ink-muted">@{profile.username}</p>

          {profile.bio && (
            <p className="text-sm text-ink-secondary mt-3 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm text-ink-muted flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              На платформе с{' '}
              {new Date(profile.created_at).toLocaleDateString('ru', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <Globe size={14} />
                {profile.website.replace(/https?:\/\//, '')}
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-ink">{(projects ?? []).length}</p>
              <p className="text-xs text-ink-muted">Произведений</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-ink">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-ink-muted">Просмотров</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-ink">{totalLikes.toLocaleString()}</p>
              <p className="text-xs text-ink-muted">Лайков</p>
            </div>
          </div>
        </div>
      </div>

      {/* Works */}
      <h2 className="text-lg font-bold text-ink mb-4">
        Произведения ({(projects ?? []).length})
      </h2>

      {(projects ?? []).length === 0 ? (
        <div className="text-center py-16 bg-surface-raised border border-line rounded-lg">
          <BookOpen className="w-12 h-12 mx-auto text-ink-muted mb-3" />
          <p className="text-sm text-ink-muted">Автор пока не опубликовал произведений</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(projects as unknown as Project[]).map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}