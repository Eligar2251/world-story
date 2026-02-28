import { notFound, redirect } from 'next/navigation';
import {
  getMyProject,
  getAllProjectChapters,
  getProjectVolumes,
  getProjectStats,
} from '@/lib/api/writer';
import { getGenres, getTags } from '@/lib/api/projects';
import ProjectDashboard from './ProjectDashboard';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getMyProject(id);
  if (!project) notFound();

  const [chapters, volumes, stats, genres, tags] = await Promise.all([
    getAllProjectChapters(id),
    getProjectVolumes(id),
    getProjectStats(id),
    getGenres(),
    getTags(),
  ]);

  return (
    <ProjectDashboard
      project={project}
      chapters={chapters}
      volumes={volumes}
      stats={stats}
      genres={genres}
      tags={tags}
    />
  );
}