export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export type ProjectStatus = 'draft' | 'ongoing' | 'completed' | 'hiatus';
export type ProjectVisibility = 'private' | 'public';

export interface Project {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  genre_id: number | null;
  rating_avg: number;
  views_count: number;
  likes_count: number;
  subscribers_count: number;
  chapters_count: number;
  created_at: string;
  updated_at: string;
  // joined
  author?: Profile;
  genre?: Genre;
  tags?: Tag[];
}

export type ChapterStatus = 'draft' | 'published' | 'scheduled';

export interface Chapter {
  id: string;
  project_id: string;
  volume_id: string | null;
  title: string;
  slug: string;
  content: string;
  word_count: number;
  status: ChapterStatus;
  published_at: string | null;
  scheduled_at: string | null;
  sort_order: number;
  likes_count: number;
  views_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Volume {
  id: string;
  project_id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

export type Shelf = 'reading' | 'planned' | 'completed' | 'favorite';

export interface LibraryEntry {
  id: string;
  user_id: string;
  project_id: string;
  shelf: Shelf;
  created_at: string;
  project?: Project;
}

export interface Review {
  id: string;
  user_id: string;
  project_id: string;
  rating: number;
  content: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface Comment {
  id: string;
  user_id: string;
  chapter_id: string;
  parent_id: string | null;
  content: string;
  is_spoiler: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: Profile;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}