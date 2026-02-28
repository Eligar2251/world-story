import { notFound } from 'next/navigation';
import { getMyProject } from '@/lib/api/writer';
import {
  getLocations, getFactions, getCharacters,
  getCharacterRelations, getReligions, getDeities,
  getMagicSystems, getTimelineEras, getTimelineEvents,
  getCreatures, getArtifacts, getFactionRelations,
} from '@/lib/api/world';
import WorldArchitect from './WorldArchitect';

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