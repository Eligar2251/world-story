export type LocationType =
  | 'world' | 'continent' | 'region' | 'state'
  | 'city' | 'castle' | 'district' | 'landmark' | 'other';

export interface Location {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  type: LocationType;
  description: string | null;
  climate: string | null;
  population: string | null;
  economy: string | null;
  ruling_faction_id: string | null;
  map_image_url: string | null;
  pin_x: number | null;
  pin_y: number | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: Location[];
  ruling_faction?: Faction;
}

export type FactionType =
  | 'house' | 'guild' | 'order' | 'kingdom'
  | 'tribe' | 'cult' | 'company' | 'other';

export type FactionStatus = 'active' | 'destroyed' | 'reformed' | 'dormant';

export interface Faction {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  type: FactionType;
  motto: string | null;
  colors: string | null;
  emblem_url: string | null;
  description: string | null;
  founder: string | null;
  headquarters_id: string | null;
  status: FactionStatus;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  headquarters?: Location;
}

export type FactionRelationType =
  | 'vassal' | 'ally' | 'enemy' | 'trade' | 'neutral' | 'war';

export interface FactionRelation {
  id: string;
  project_id: string;
  faction_a_id: string;
  faction_b_id: string;
  relation_type: FactionRelationType;
  description: string | null;
  faction_a?: Faction;
  faction_b?: Faction;
}

export type CharacterStatus = 'alive' | 'dead' | 'unknown' | 'undead';

export interface Character {
  id: string;
  project_id: string;
  name: string;
  aliases: string | null;
  portrait_url: string | null;
  age: string | null;
  birth_date: string | null;
  death_date: string | null;
  gender: string | null;
  species: string;
  height: string | null;
  eye_color: string | null;
  hair_color: string | null;
  distinguishing_marks: string | null;
  titles: string | null;
  nicknames: string | null;
  faction_id: string | null;
  location_id: string | null;
  religion: string | null;
  occupation: string | null;
  social_status: string | null;
  motivation: string | null;
  fears: string | null;
  goals: string | null;
  internal_conflict: string | null;
  personality: string | null;
  backstory: string | null;
  status: CharacterStatus;
  cause_of_death: string | null;
  inventory: string | null;
  notes: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  faction?: Faction;
  location?: Location;
}

export type CharRelationType =
  | 'parent' | 'child' | 'spouse' | 'sibling'
  | 'lover' | 'rival' | 'mentor' | 'student'
  | 'liege' | 'vassal' | 'friend' | 'enemy'
  | 'bastard_parent' | 'bastard_child';

export interface CharacterRelation {
  id: string;
  project_id: string;
  character_a_id: string;
  character_b_id: string;
  relation_type: CharRelationType;
  description: string | null;
  character_a?: Character;
  character_b?: Character;
}

export interface Religion {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  clergy_structure: string | null;
  rituals: string | null;
  sacred_texts: string | null;
  taboos: string | null;
  regions: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Deity {
  id: string;
  religion_id: string;
  project_id: string;
  name: string;
  domain: string | null;
  description: string | null;
  symbol: string | null;
  sort_order: number;
}

export type MagicType = 'hard' | 'soft' | 'hybrid';

export interface MagicSystem {
  id: string;
  project_id: string;
  name: string;
  type: MagicType;
  source: string | null;
  description: string | null;
  limitations: string | null;
  cost: string | null;
  known_practitioners: string | null;
  historical_events: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TimelineEra {
  id: string;
  project_id: string;
  name: string;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
  color: string;
  sort_order: number;
}

export type EventType =
  | 'event' | 'war' | 'battle' | 'coup'
  | 'disaster' | 'founding' | 'death' | 'birth' | 'other';

export interface TimelineEvent {
  id: string;
  project_id: string;
  era_id: string | null;
  title: string;
  date_label: string | null;
  year: number | null;
  type: EventType;
  description: string | null;
  participants: string | null;
  outcome: string | null;
  consequences: string | null;
  location_id: string | null;
  sort_order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  era?: TimelineEra;
  location?: Location;
}

export type DangerLevel =
  | 'harmless' | 'low' | 'medium' | 'high' | 'extreme' | 'legendary';

export interface Creature {
  id: string;
  project_id: string;
  name: string;
  image_url: string | null;
  species_type: string | null;
  habitat: string | null;
  description: string | null;
  abilities: string | null;
  weaknesses: string | null;
  history: string | null;
  magic_relation: string | null;
  danger_level: DangerLevel | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ArtifactType =
  | 'weapon' | 'armor' | 'relic' | 'book'
  | 'currency' | 'poison' | 'tool' | 'technology' | 'other';

export interface Artifact {
  id: string;
  project_id: string;
  name: string;
  image_url: string | null;
  type: ArtifactType;
  description: string | null;
  history: string | null;
  powers: string | null;
  current_owner: string | null;
  location_id: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}