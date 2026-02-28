import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LibraryClient from './LibraryClient';

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data } = await supabase
    .from('library_entries')
    .select(
      `
      *,
      project:projects!library_entries_project_id_fkey(
        *,
        author:profiles!projects_author_id_fkey(id,username,display_name,avatar_url),
        genre:genres!projects_genre_id_fkey(id,name,slug)
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-ink mb-6">Моя библиотека</h1>
      <LibraryClient entries={data ?? []} />
    </div>
  );
}