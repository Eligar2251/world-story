import { createClient } from '@/lib/supabase/server';
import type { Project, Genre, Tag } from '@/lib/types/database';

export interface ProjectFilters {
  genre?: string;
  status?: string;
  tag?: string;
  sort?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const PER_PAGE = 20;

export async function getProjects(filters: ProjectFilters = {}) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? PER_PAGE;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('projects')
    .select(
      `
      *,
      author:profiles!projects_author_id_fkey(id,username,display_name,avatar_url),
      genre:genres!projects_genre_id_fkey(id,name,slug)
    `,
      { count: 'exact' }
    )
    .eq('visibility', 'public');

  if (filters.genre && filters.genre !== 'all') {
    query = query.eq('genre.slug', filters.genre);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  switch (filters.sort) {
    case 'popular':
      query = query.order('views_count', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating_avg', { ascending: false });
      break;
    case 'new':
      query = query.order('created_at', { ascending: false });
      break;
    case 'updated':
      query = query.order('updated_at', { ascending: false });
      break;
    case 'likes':
      query = query.order('likes_count', { ascending: false });
      break;
    default:
      query = query.order('updated_at', { ascending: false });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  return {
    projects: (data as unknown as Project[]) ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
    page,
  };
}

export async function getProjectById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      author:profiles!projects_author_id_fkey(id,username,display_name,avatar_url,bio),
      genre:genres!projects_genre_id_fkey(id,name,slug)
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) return null;

  // get tags
  const { data: tagLinks } = await supabase
    .from('project_tags')
    .select('tag_id, tags(id,name,slug)')
    .eq('project_id', id);

  const tags =
    tagLinks?.map((t: any) => t.tags).filter(Boolean) ?? [];

  return { ...(data as unknown as Project), tags } as Project;
}

export async function getProjectChapters(projectId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  return data ?? [];
}

export async function getGenres() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('genres')
    .select('*')
    .order('name');
  return (data as Genre[]) ?? [];
}

export async function getTags() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tags')
    .select('*')
    .order('name');
  return (data as Tag[]) ?? [];
}

export async function getPopularProjects(limit = 10) {
  return getProjects({ sort: 'popular', limit });
}

export async function getNewProjects(limit = 10) {
  return getProjects({ sort: 'new', limit });
}

export async function getCompletedProjects(limit = 10) {
  return getProjects({ status: 'completed', sort: 'popular', limit });
}