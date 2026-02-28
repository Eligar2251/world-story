import { createClient } from '@/lib/supabase/server';
import type { Project, Chapter, Volume } from '@/lib/types/database';

export async function getMyProjects() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('projects')
    .select(
      `
      *,
      genre:genres!projects_genre_id_fkey(id,name,slug)
    `
    )
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false });

  return (data as unknown as Project[]) ?? [];
}

export async function getMyProject(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('projects')
    .select(
      `
      *,
      genre:genres!projects_genre_id_fkey(id,name,slug)
    `
    )
    .eq('id', id)
    .eq('author_id', user.id)
    .single();

  if (!data) return null;

  // Загружаем теги отдельно
  const { data: tagLinks } = await supabase
    .from('project_tags')
    .select('tag_id, tags(id,name,slug)')
    .eq('project_id', id);

  const tags = tagLinks?.map((t: any) => t.tags).filter(Boolean) ?? [];

  return { ...(data as unknown as Project), tags } as Project;
}

export async function getProjectVolumes(projectId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('volumes')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  return (data as Volume[]) ?? [];
}

export async function getAllProjectChapters(projectId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  return (data as Chapter[]) ?? [];
}

export async function getChapterForEditor(chapterId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('chapters')
    .select(
      `
      *,
      project:projects!chapters_project_id_fkey(id,title,slug,author_id)
    `
    )
    .eq('id', chapterId)
    .single();

  if (!data) return null;

  const project = (data as any).project;
  if (project?.author_id !== user.id) return null;

  return data as unknown as Chapter & { project: Project };
}

export async function getProjectStats(projectId: string) {
  const supabase = await createClient();

  const [chaptersRes, reviewsRes] = await Promise.all([
    supabase
      .from('chapters')
      .select('word_count,views_count,likes_count,comments_count,status')
      .eq('project_id', projectId),
    supabase
      .from('reviews')
      .select('rating')
      .eq('project_id', projectId),
  ]);

  const chapters = chaptersRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  return {
    totalChapters: chapters.length,
    publishedChapters: chapters.filter((c) => c.status === 'published').length,
    draftChapters: chapters.filter((c) => c.status === 'draft').length,
    totalWords: chapters.reduce((s, c) => s + (c.word_count ?? 0), 0),
    totalViews: chapters.reduce((s, c) => s + (c.views_count ?? 0), 0),
    totalLikes: chapters.reduce((s, c) => s + (c.likes_count ?? 0), 0),
    totalComments: chapters.reduce((s, c) => s + (c.comments_count ?? 0), 0),
    reviewCount: reviews.length,
    avgRating:
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0,
  };
}