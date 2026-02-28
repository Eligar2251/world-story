import { getGenres, getTags } from '@/lib/api/projects';
import ProjectForm from '@/components/writer/ProjectForm';

export const dynamic = 'force-dynamic';

export default async function NewProjectPage() {
  const [genres, tags] = await Promise.all([getGenres(), getTags()]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-ink mb-6">Новый проект</h1>
      <ProjectForm genres={genres} tags={tags} />
    </div>
  );
}