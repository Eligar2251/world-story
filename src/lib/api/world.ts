import { createClient } from '@/lib/supabase/server';
import type {
  Location, Faction, Character, CharacterRelation,
  FactionRelation, Religion, Deity, MagicSystem,
  TimelineEra, TimelineEvent, Creature, Artifact,
} from '@/lib/types/world';

export async function getLocations(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('locations')
    .select('*, ruling_faction:factions!fk_locations_ruling_faction(id,name)')
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as Location[];
}

export async function getFactions(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('factions')
    .select('*, headquarters:locations!factions_headquarters_id_fkey(id,name)')
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as Faction[];
}

export async function getFactionRelations(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('faction_relations')
    .select(`
      *,
      faction_a:factions!faction_relations_faction_a_id_fkey(id,name),
      faction_b:factions!faction_relations_faction_b_id_fkey(id,name)
    `)
    .eq('project_id', projectId);
  return (data ?? []) as FactionRelation[];
}

export async function getCharacters(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('characters')
    .select(`
      *,
      faction:factions!characters_faction_id_fkey(id,name),
      location:locations!characters_location_id_fkey(id,name)
    `)
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as Character[];
}

export async function getCharacterRelations(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('character_relations')
    .select(`
      *,
      character_a:characters!character_relations_character_a_id_fkey(id,name,portrait_url,status),
      character_b:characters!character_relations_character_b_id_fkey(id,name,portrait_url,status)
    `)
    .eq('project_id', projectId);
  return (data ?? []) as CharacterRelation[];
}

export async function getReligions(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('religions')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as Religion[];
}

export async function getDeities(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('deities')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as Deity[];
}

export async function getMagicSystems(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('magic_systems')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as MagicSystem[];
}

export async function getTimelineEras(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('timeline_eras')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as TimelineEra[];
}

export async function getTimelineEvents(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('timeline_events')
    .select(`
      *,
      era:timeline_eras!timeline_events_era_id_fkey(id,name,color),
      location:locations!timeline_events_location_id_fkey(id,name)
    `)
    .eq('project_id', projectId)
    .order('year', { ascending: true, nullsFirst: false })
    .order('sort_order');
  return (data ?? []) as TimelineEvent[];
}

export async function getCreatures(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('creatures')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as Creature[];
}

export async function getArtifacts(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('artifacts')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  return (data ?? []) as Artifact[];
}