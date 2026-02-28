import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getMyProjects } from '@/lib/api/writer';
import { getGenres } from '@/lib/api/projects';
import Button from '@/components/ui/Button';
import StudioProjectList from './StudioProjectList';


export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const [projects, genres] = await Promise.all([
    getMyProjects(),
    getGenres(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Студия</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Управляйте своими произведениями
          </p>
        </div>
        <Link href="/studio/new">
          <Button icon={<Plus size={16} />}>Новый проект</Button>
        </Link>
      </div>

      <StudioProjectList projects={projects} />
    </div>
  );
}