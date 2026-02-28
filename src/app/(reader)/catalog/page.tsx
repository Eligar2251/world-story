import { Suspense } from 'react';
import { getProjects, getGenres } from '@/lib/api/projects';
import CatalogClient from './CatalogClient';

export const revalidate = 60;

interface Props {
  searchParams: Promise<{
    genre?: string;
    status?: string;
    sort?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const genres = await getGenres();

  const filters = {
    genre: params.genre,
    status: params.status,
    sort: params.sort || 'updated',
    search: params.search,
    page: Number(params.page) || 1,
  };

  const result = await getProjects(filters);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-ink mb-6">Каталог</h1>
      <CatalogClient
        initialProjects={result.projects}
        initialTotal={result.total}
        initialPage={result.page}
        totalPages={result.totalPages}
        genres={genres}
        initialFilters={filters}
      />
    </div>
  );
}