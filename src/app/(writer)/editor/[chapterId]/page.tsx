import { notFound } from 'next/navigation';
import { getChapterForEditor } from '@/lib/api/writer';
import { getCharacters, getFactions, getLocations } from '@/lib/api/world';
import EditorClient from './EditorClient';

export const dynamic = 'force-dynamic';
export default async function EditorPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const data = await getChapterForEditor(chapterId);
  if (!data) notFound();

  const { project, ...chapter } = data as any;

  const [characters, factions, locations] = await Promise.all([
    getCharacters(project.id),
    getFactions(project.id),
    getLocations(project.id),
  ]);

  return (
    <EditorClient
      chapter={chapter}
      project={project}
      worldData={{ characters, factions, locations }}
    />
  );
}