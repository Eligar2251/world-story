'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, MapPin, ChevronRight, ChevronDown,
  Upload, Trash2, Edit3, Globe, Mountain,
  Building, Castle, TreePine,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Location, LocationType, Faction } from '@/lib/types/world';

const typeIcons: Record<LocationType, typeof Globe> = {
  world: Globe, continent: Mountain, region: TreePine,
  state: Building, city: Building, castle: Castle,
  district: MapPin, landmark: MapPin, other: MapPin,
};

const typeLabels: Record<LocationType, string> = {
  world: 'Мир', continent: 'Континент', region: 'Регион',
  state: 'Государство', city: 'Город', castle: 'Замок',
  district: 'Район', landmark: 'Достопримечательность', other: 'Другое',
};

const typeOptions = Object.entries(typeLabels).map(([v, l]) => ({
  value: v, label: l,
}));

interface Props {
  projectId: string;
  locations: Location[];
  factions: Faction[];
}

export default function GeographyPanel({ projectId, locations: init, factions }: Props) {
  const supabase = createClient();
  const [locations, setLocations] = useState(init);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [mapView, setMapView] = useState<Location | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('city');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [climate, setClimate] = useState('');
  const [population, setPopulation] = useState('');
  const [economy, setEconomy] = useState('');
  const [rulingFactionId, setRulingFactionId] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  function openCreate(parentId?: string) {
    setEditing(null);
    setName('');
    setType(parentId ? 'city' : 'world');
    setParentId(parentId ?? '');
    setDescription('');
    setClimate('');
    setPopulation('');
    setEconomy('');
    setRulingFactionId('');
    setIsPublic(false);
    setModalOpen(true);
  }

  function openEdit(loc: Location) {
    setEditing(loc);
    setName(loc.name);
    setType(loc.type);
    setParentId(loc.parent_id ?? '');
    setDescription(loc.description ?? '');
    setClimate(loc.climate ?? '');
    setPopulation(loc.population ?? '');
    setEconomy(loc.economy ?? '');
    setRulingFactionId(loc.ruling_faction_id ?? '');
    setIsPublic(loc.is_public);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      project_id: projectId,
      name: name.trim(),
      type,
      parent_id: parentId || null,
      description: description || null,
      climate: climate || null,
      population: population || null,
      economy: economy || null,
      ruling_faction_id: rulingFactionId || null,
      is_public: isPublic,
    };

    if (editing) {
      const { data } = await supabase
        .from('locations').update(payload).eq('id', editing.id).select().single();
      if (data) setLocations(prev => prev.map(l => l.id === editing.id ? { ...l, ...data } : l));
    } else {
      const { data } = await supabase
        .from('locations').insert({ ...payload, sort_order: locations.length }).select().single();
      if (data) setLocations(prev => [...prev, data as Location]);
    }

    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить локацию?')) return;
    await supabase.from('locations').delete().eq('id', id);
    setLocations(prev => prev.filter(l => l.id !== id));
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // Build tree
  function buildTree(parentId: string | null): Location[] {
    return locations
      .filter(l => l.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function LocationNode({ loc, depth = 0 }: { loc: Location; depth?: number }) {
    const children = buildTree(loc.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded.has(loc.id);
    const Icon = typeIcons[loc.type] ?? MapPin;

    return (
      <div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-overlay transition-colors group"
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(loc.id)} className="p-0.5">
              {isExpanded
                ? <ChevronDown size={14} className="text-ink-muted" />
                : <ChevronRight size={14} className="text-ink-muted" />
              }
            </button>
          ) : (
            <span className="w-5" />
          )}

          <Icon size={14} className="text-accent shrink-0" />
          <span className="text-sm text-ink flex-1 truncate">{loc.name}</span>
          <Badge className="text-[10px]">{typeLabels[loc.type]}</Badge>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openCreate(loc.id)} className="p-1 rounded hover:bg-line" title="Добавить внутрь">
              <Plus size={12} className="text-ink-muted" />
            </button>
            <button onClick={() => openEdit(loc)} className="p-1 rounded hover:bg-line" title="Редактировать">
              <Edit3 size={12} className="text-ink-muted" />
            </button>
            <button onClick={() => handleDelete(loc.id)} className="p-1 rounded hover:bg-line" title="Удалить">
              <Trash2 size={12} className="text-red-400" />
            </button>
          </div>
        </div>

        {isExpanded && children.map(c => (
          <LocationNode key={c.id} loc={c} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const roots = buildTree(null);

  const parentOptions = [
    { value: '', label: 'Нет (корневой уровень)' },
    ...locations.map(l => ({
      value: l.id,
      label: `${'— '.repeat(getDepth(l.id, locations))}${l.name}`,
    })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">География</h2>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => openCreate()}>
          Добавить
        </Button>
      </div>

      {roots.length === 0 ? (
        <EmptyState label="Добавьте первую локацию" onClick={() => openCreate()} />
      ) : (
        <div className="bg-surface-raised border border-line rounded-lg divide-y divide-line">
          {roots.map(loc => <LocationNode key={loc.id} loc={loc} />)}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать локацию' : 'Новая локация'}
        wide
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Название" value={name} onChange={e => setName(e.target.value)} required />
            <Select label="Тип" options={typeOptions} value={type} onChange={e => setType(e.target.value as LocationType)} />
          </div>
          <Select label="Родительская локация" options={parentOptions} value={parentId} onChange={e => setParentId(e.target.value)} />
          <TextArea label="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Климат" value={climate} onChange={e => setClimate(e.target.value)} />
            <Input label="Население" value={population} onChange={e => setPopulation(e.target.value)} />
            <Input label="Экономика" value={economy} onChange={e => setEconomy(e.target.value)} />
          </div>
          <Select
            label="Правящая фракция"
            options={[{ value: '', label: 'Нет' }, ...factions.map(f => ({ value: f.id, label: f.name }))]}
            value={rulingFactionId}
            onChange={e => setRulingFactionId(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-accent" />
            Видимо читателям
          </label>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} loading={saving}>Сохранить</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function getDepth(id: string, all: Location[], depth = 0): number {
  const loc = all.find(l => l.id === id);
  if (!loc?.parent_id) return depth;
  return getDepth(loc.parent_id, all, depth + 1);
}

function EmptyState({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="text-center py-16 bg-surface-raised border border-line rounded-lg">
      <svg className="w-12 h-12 mx-auto text-ink-muted mb-3" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <p className="text-sm text-ink-muted mb-3">{label}</p>
      <Button size="sm" onClick={onClick}>Создать</Button>
    </div>
  );
}