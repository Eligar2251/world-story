import { notFound } from 'next/navigation';
import { getChapterById, getAdjacentChapters } from '@/lib/api/chapters';
import { getProjectById } from '@/lib/api/projects';
import ReaderClient from './ReaderClient';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const chapter = await getChapterById(chapterId);
  if (!chapter) return { title: 'Не найдено' };
  return { title: `${chapter.title} — WorldStory` };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const chapter = await getChapterById(chapterId);
  if (!chapter) notFound();

  const [project, adjacent] = await Promise.all([
    getProjectById(chapter.project_id),
    getAdjacentChapters(chapter.project_id, chapter.sort_order),
  ]);

  if (!project) notFound();

  return (
    <ReaderClient
      chapter={chapter}
      project={project}
      prevChapter={adjacent.prev}
      nextChapter={adjacent.next}
    />
  );
}