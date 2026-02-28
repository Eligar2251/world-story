'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Users, Shield, GitBranch,
  Sparkles, BookOpen as BookIcon, Clock, Skull, Gem,
  ChevronRight,
} from 'lucide-react';
import type { Project } from '@/lib/types/database';
import type * as W from '@/lib/types/world';
import GeographyPanel from '@/components/world/GeographyPanel';
import CharactersPanel from '@/components/world/CharactersPanel';
import FactionsPanel from '@/components/world/FactionsPanel';
import TimelinePanel from '@/components/world/TimelinePanel';
import ReligionsPanel from '@/components/world/ReligionsPanel';
import MagicPanel from '@/components/world/MagicPanel';
import BestiaryPanel from '@/components/world/BestiaryPanel';
import ArtifactsPanel from '@/components/world/ArtifactsPanel';
import FamilyTreePanel from '@/components/world/FamilyTreePanel';

const sections = [
  { id: 'geography', label: 'География', icon: MapPin },
  { id: 'characters', label: 'Персонажи', icon: Users },
  { id: 'factions', label: 'Фракции', icon: Shield },
  { id: 'family', label: 'Родословные', icon: GitBranch },
  { id: 'timeline', label: 'Таймлайн', icon: Clock },
  { id: 'religions', label: 'Религии', icon: BookIcon },
  { id: 'magic', label: 'Магия', icon: Sparkles },
  { id: 'bestiary', label: 'Бестиарий', icon: Skull },
  { id: 'artifacts', label: 'Артефакты', icon: Gem },
];

interface Props {
  project: Project;
  locations: W.Location[];
  factions: W.Faction[];
  factionRelations: W.FactionRelation[];
  characters: W.Character[];
  characterRelations: W.CharacterRelation[];
  religions: W.Religion[];
  deities: W.Deity[];
  magicSystems: W.MagicSystem[];
  eras: W.TimelineEra[];
  events: W.TimelineEvent[];
  creatures: W.Creature[];
  artifacts: W.Artifact[];
}

export default function WorldArchitect(props: Props) {
  const [active, setActive] = useState('geography');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/project/${props.project.id}`}
          className="p-2 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink">Архитектор мира</h1>
          <p className="text-sm text-ink-muted">{props.project.title}</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="hidden md:block w-52 shrink-0">
          <div className="sticky top-20 space-y-0.5">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    transition-colors text-left
                    ${isActive
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-ink-secondary hover:bg-surface-overlay hover:text-ink'
                    }
                  `}
                >
                  <Icon size={16} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile tabs */}
        <div className="md:hidden w-full mb-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-1">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap
                    ${active === s.id
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-ink-secondary bg-surface-overlay'
                    }
                  `}
                >
                  <Icon size={14} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {active === 'geography' && (
            <GeographyPanel
              projectId={props.project.id}
              locations={props.locations}
              factions={props.factions}
            />
          )}
          {active === 'characters' && (
            <CharactersPanel
              projectId={props.project.id}
              characters={props.characters}
              factions={props.factions}
              locations={props.locations}
            />
          )}
          {active === 'factions' && (
            <FactionsPanel
              projectId={props.project.id}
              factions={props.factions}
              factionRelations={props.factionRelations}
              locations={props.locations}
            />
          )}
          {active === 'family' && (
            <FamilyTreePanel
              projectId={props.project.id}
              characters={props.characters}
              relations={props.characterRelations}
            />
          )}
          {active === 'timeline' && (
            <TimelinePanel
              projectId={props.project.id}
              eras={props.eras}
              events={props.events}
              locations={props.locations}
            />
          )}
          {active === 'religions' && (
            <ReligionsPanel
              projectId={props.project.id}
              religions={props.religions}
              deities={props.deities}
            />
          )}
          {active === 'magic' && (
            <MagicPanel
              projectId={props.project.id}
              systems={props.magicSystems}
            />
          )}
          {active === 'bestiary' && (
            <BestiaryPanel
              projectId={props.project.id}
              creatures={props.creatures}
            />
          )}
          {active === 'artifacts' && (
            <ArtifactsPanel
              projectId={props.project.id}
              artifacts={props.artifacts}
            />
          )}
        </div>
      </div>
    </div>
  );
}