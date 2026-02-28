import { notFound } from 'next/navigation';
import { getProjectById, getProjectChapters } from '@/lib/api/projects';
import WorkPageClient from './WorkPageClient';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return { title: 'Не найдено' };
  return {
    title: `${project.title} — WorldStory`,
    description: project.description?.slice(0, 160),
  };
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const chapters = await getProjectChapters(id);

  return <WorkPageClient project={project} chapters={chapters} />;
}