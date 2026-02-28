import { notFound } from 'next/navigation';
import { getMyProject } from '@/lib/api/writer';
import {
  getLocations, getFactions, getCharacters,
  getCharacterRelations, getReligions, getDeities,
  getMagicSystems, getTimelineEras, getTimelineEvents,
  getCreatures, getArtifacts, getFactionRelations,
} from '@/lib/api/world';
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const WorldArchitect = nextDynamic(
  () => import('./WorldArchitect'),
  {
    loading: () => (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="h-8 w-48 skeleton mb-6" />
        <div className="flex gap-6">
          <div className="w-52 space-y-2 hidden md:block">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-9 skeleton rounded-lg" />
            ))}
          </div>
          <div className="flex-1 h-96 skeleton rounded-lg" />
        </div>
      </div>
    ),
  }
);

export default async function WorldPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getMyProject(id);
  if (!project) notFound();

  const [
    locations, factions, factionRelations, characters,
    characterRelations, religions, deities, magicSystems,
    eras, events, creatures, artifacts,
  ] = await Promise.all([
    getLocations(id), getFactions(id), getFactionRelations(id),
    getCharacters(id), getCharacterRelations(id),
    getReligions(id), getDeities(id), getMagicSystems(id),
    getTimelineEras(id), getTimelineEvents(id),
    getCreatures(id), getArtifacts(id),
  ]);

  return (
    <WorldArchitect
      project={project}
      locations={locations}
      factions={factions}
      factionRelations={factionRelations}
      characters={characters}
      characterRelations={characterRelations}
      religions={religions}
      deities={deities}
      magicSystems={magicSystems}
      eras={eras}
      events={events}
      creatures={creatures}
      artifacts={artifacts}
    />
  );
}