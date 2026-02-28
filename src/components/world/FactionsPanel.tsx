'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Shield, Link2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Faction, FactionType, FactionStatus, FactionRelation, FactionRelationType, Location } from '@/lib/types/world';

const typeLabels: Record<FactionType, string> = {
  house: 'Дом', guild: 'Гильдия', order: 'Орден', kingdom: 'Королевство',
  tribe: 'Племя', cult: 'Культ', company: 'Компания', other: 'Другое',
};
const statusLabels: Record<FactionStatus, string> = {
  active: 'Действует', destroyed: 'Уничтожен', reformed: 'Реформирован', dormant: 'В спячке',
};
const relationLabels: Record<FactionRelationType, string> = {
  vassal: 'Вассал', ally: 'Союзник', enemy: 'Враг',
  trade: 'Торговля', neutral: 'Нейтралитет', war: 'Война',
};
const relationColors: Record<FactionRelationType, string> = {
  vassal: 'text-blue-400', ally: 'text-green-400', enemy: 'text-red-400',
  trade: 'text-amber-400', neutral: 'text-ink-muted', war: 'text-red-600',
};

interface Props {
  projectId: string;
  factions: Faction[];
  factionRelations: FactionRelation[];
  locations: Location[];
}

export default function FactionsPanel({ projectId, factions: init, factionRelations: initRels, locations }: Props) {
  const supabase = createClient();
  const [factions, setFactions] = useState(init);
  const [relations, setRelations] = useState(initRels);
  const [modalOpen, setModalOpen] = useState(false);
  const [relModalOpen, setRelModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faction | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<FactionType>('house');
  const [motto, setMotto] = useState('');
  const [colors, setColors] = useState('');
  const [description, setDescription] = useState('');
  const [founder, setFounder] = useState('');
  const [headquartersId, setHeadquartersId] = useState('');
  const [status, setStatus] = useState<FactionStatus>('active');
  const [parentId, setParentId] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Relation form
  const [relA, setRelA] = useState('');
  const [relB, setRelB] = useState('');
  const [relType, setRelType] = useState<FactionRelationType>('ally');

  function openCreate() {
    setEditing(null);
    setName(''); setType('house'); setMotto(''); setColors('');
    setDescription(''); setFounder(''); setHeadquartersId('');
    setStatus('active'); setParentId(''); setIsPublic(false);
    setModalOpen(true);
  }

  function openEdit(f: Faction) {
    setEditing(f);
    setName(f.name); setType(f.type); setMotto(f.motto ?? '');
    setColors(f.colors ?? ''); setDescription(f.description ?? '');
    setFounder(f.founder ?? ''); setHeadquartersId(f.headquarters_id ?? '');
    setStatus(f.status); setParentId(f.parent_id ?? ''); setIsPublic(f.is_public);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      project_id: projectId, name: name.trim(), type, motto: motto || null,
      colors: colors || null, description: description || null,
      founder: founder || null, headquarters_id: headquartersId || null,
      status, parent_id: parentId || null, is_public: isPublic,
    };

    if (editing) {
      const { data } = await supabase.from('factions').update(payload).eq('id', editing.id).select().single();
      if (data) setFactions(prev => prev.map(f => f.id === editing.id ? { ...f, ...data } : f));
    } else {
      const { data } = await supabase.from('factions').insert({ ...payload, sort_order: factions.length }).select().single();
      if (data) setFactions(prev => [...prev, data as Faction]);
    }
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить фракцию?')) return;
    await supabase.from('factions').delete().eq('id', id);
    setFactions(prev => prev.filter(f => f.id !== id));
  }

  async function handleAddRelation() {
    if (!relA || !relB || relA === relB) return;
    setSaving(true);
    const { data } = await supabase.from('faction_relations').insert({
      project_id: projectId, faction_a_id: relA, faction_b_id: relB, relation_type: relType,
    }).select(`*, faction_a:factions!faction_relations_faction_a_id_fkey(id,name), faction_b:factions!faction_relations_faction_b_id_fkey(id,name)`).single();
    if (data) setRelations(prev => [...prev, data as FactionRelation]);
    setRelModalOpen(false);
    setSaving(false);
  }

  async function handleDeleteRelation(id: string) {
    await supabase.from('faction_relations').delete().eq('id', id);
    setRelations(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Фракции ({factions.length})</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={<Link2 size={14} />} onClick={() => setRelModalOpen(true)}>Связь</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>Добавить</Button>
        </div>
      </div>

      {/* Factions grid */}
      {factions.length === 0 ? (
        <EmptyFactionState onClick={openCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {factions.map(f => (
            <div key={f.id} className="bg-surface-raised border border-line rounded-lg p-4 group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{f.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>{typeLabels[f.type]}</Badge>
                    <Badge variant={f.status === 'active' ? 'success' : f.status === 'destroyed' ? 'danger' : 'default'}>
                      {statusLabels[f.status]}
                    </Badge>
                  </div>
                  {f.motto && <p className="text-xs text-ink-muted italic mt-2">&laquo;{f.motto}&raquo;</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(f)} className="p-1 rounded hover:bg-surface-overlay"><Edit3 size={12} className="text-ink-muted" /></button>
                  <button onClick={() => handleDelete(f.id)} className="p-1 rounded hover:bg-surface-overlay"><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Relations */}
      {relations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">Отношения</h3>
          <div className="space-y-1">
            {relations.map(r => (
              <div key={r.id} className="flex items-center gap-2 px-3 py-2 bg-surface-raised border border-line rounded-lg text-sm group">
                <span className="text-ink">{(r.faction_a as any)?.name}</span>
                <span className={`text-xs font-medium ${relationColors[r.relation_type]}`}>
                  — {relationLabels[r.relation_type]} —
                </span>
                <span className="text-ink">{(r.faction_b as any)?.name}</span>
                <button onClick={() => handleDeleteRelation(r.id)} className="ml-auto p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-overlay">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faction modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать фракцию' : 'Новая фракция'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Название" value={name} onChange={e => setName(e.target.value)} required />
            <Select label="Тип" options={Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))} value={type} onChange={e => setType(e.target.value as FactionType)} />
            <Input label="Девиз" value={motto} onChange={e => setMotto(e.target.value)} />
            <Input label="Цвета" value={colors} onChange={e => setColors(e.target.value)} />
            <Input label="Основатель" value={founder} onChange={e => setFounder(e.target.value)} />
            <Select label="Статус" options={Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))} value={status} onChange={e => setStatus(e.target.value as FactionStatus)} />
            <Select label="Штаб" options={[{ value: '', label: 'Нет' }, ...locations.map(l => ({ value: l.id, label: l.name }))]} value={headquartersId} onChange={e => setHeadquartersId(e.target.value)} />
            <Select label="Сюзерен" options={[{ value: '', label: 'Нет' }, ...factions.filter(f => f.id !== editing?.id).map(f => ({ value: f.id, label: f.name }))]} value={parentId} onChange={e => setParentId(e.target.value)} />
          </div>
          <TextArea label="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-accent" />
            Видимо читателям
          </label>
          <div className="flex gap-2"><Button onClick={handleSave} loading={saving}>Сохранить</Button><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button></div>
        </div>
      </Modal>

      {/* Relation modal */}
      <Modal open={relModalOpen} onClose={() => setRelModalOpen(false)} title="Добавить связь">
        <div className="space-y-4">
          <Select label="Фракция A" options={factions.map(f => ({ value: f.id, label: f.name }))} value={relA} onChange={e => setRelA(e.target.value)} />
          <Select label="Тип связи" options={Object.entries(relationLabels).map(([v, l]) => ({ value: v, label: l }))} value={relType} onChange={e => setRelType(e.target.value as FactionRelationType)} />
          <Select label="Фракция B" options={factions.map(f => ({ value: f.id, label: f.name }))} value={relB} onChange={e => setRelB(e.target.value)} />
          <div className="flex gap-2"><Button onClick={handleAddRelation} loading={saving}>Добавить</Button><Button variant="ghost" onClick={() => setRelModalOpen(false)}>Отмена</Button></div>
        </div>
      </Modal>
    </div>
  );
}

function EmptyFactionState({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center py-16 bg-surface-raised border border-line rounded-lg">
      <Shield className="w-12 h-12 mx-auto text-ink-muted mb-3" />
      <p className="text-sm text-ink-muted mb-3">Фракций пока нет</p>
      <Button size="sm" onClick={onClick}>Создать фракцию</Button>
    </div>
  );
}