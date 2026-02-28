import { createClient } from '@/lib/supabase/server';
import type { Chapter } from '@/lib/types/database';

export async function getChapterById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Chapter;
}

export async function getAdjacentChapters(
  projectId: string,
  sortOrder: number
) {
  const supabase = await createClient();

  const { data: prev } = await supabase
    .from('chapters')
    .select('id,title,slug,sort_order')
    .eq('project_id', projectId)
    .eq('status', 'published')
    .lt('sort_order', sortOrder)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const { data: next } = await supabase
    .from('chapters')
    .select('id,title,slug,sort_order')
    .eq('project_id', projectId)
    .eq('status', 'published')
    .gt('sort_order', sortOrder)
    .order('sort_order', { ascending: true })
    .limit(1)
    .single();

  return { prev, next };
}