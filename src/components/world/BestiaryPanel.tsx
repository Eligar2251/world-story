'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Skull } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Creature, DangerLevel } from '@/lib/types/world';

const dangerLabels: Record<DangerLevel, string> = { harmless: 'Безвредный', low: 'Низкая', medium: 'Средняя', high: 'Высокая', extreme: 'Экстремальная', legendary: 'Легендарная' };
const dangerColors: Record<DangerLevel, 'default'|'success'|'warning'|'danger'|'accent'> = { harmless: 'success', low: 'success', medium: 'warning', high: 'danger', extreme: 'danger', legendary: 'accent' };

interface Props { projectId: string; creatures: Creature[]; }

export default function BestiaryPanel({ projectId, creatures: init }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState(init);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Creature | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [speciesType, setSpeciesType] = useState('');
  const [habitat, setHabitat] = useState('');
  const [description, setDescription] = useState('');
  const [abilities, setAbilities] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [history, setHistory] = useState('');
  const [magicRel, setMagicRel] = useState('');
  const [danger, setDanger] = useState<DangerLevel>('medium');

  function openCreate() { setEditing(null); setName(''); setSpeciesType(''); setHabitat(''); setDescription(''); setAbilities(''); setWeaknesses(''); setHistory(''); setMagicRel(''); setDanger('medium'); setModalOpen(true); }
  function openEdit(c: Creature) { setEditing(c); setName(c.name); setSpeciesType(c.species_type??''); setHabitat(c.habitat??''); setDescription(c.description??''); setAbilities(c.abilities??''); setWeaknesses(c.weaknesses??''); setHistory(c.history??''); setMagicRel(c.magic_relation??''); setDanger(c.danger_level??'medium'); setModalOpen(true); }

  async function handleSave() {
    if (!name.trim()) return; setSaving(true);
    const payload = { project_id: projectId, name: name.trim(), species_type: speciesType||null, habitat: habitat||null, description: description||null, abilities: abilities||null, weaknesses: weaknesses||null, history: history||null, magic_relation: magicRel||null, danger_level: danger };
    if (editing) { const { data } = await supabase.from('creatures').update(payload).eq('id', editing.id).select().single(); if (data) setItems(p => p.map(i => i.id === editing.id ? {...i,...data} : i)); }
    else { const { data } = await supabase.from('creatures').insert({...payload, sort_order: items.length}).select().single(); if (data) setItems(p => [...p, data as Creature]); }
    setModalOpen(false); setSaving(false);
  }

  async function handleDelete(id: string) { if (!confirm('Удалить?')) return; await supabase.from('creatures').delete().eq('id', id); setItems(p => p.filter(i => i.id !== id)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Бестиарий ({items.length})</h2>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>Добавить</Button>
      </div>
      {items.length === 0 ? <div className="text-center py-16 bg-surface-raised border border-line rounded-lg"><Skull className="w-12 h-12 mx-auto text-ink-muted mb-3" /><p className="text-sm text-ink-muted mb-3">Существ пока нет</p><Button size="sm" onClick={openCreate}>Создать</Button></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{items.map(c => (
          <div key={c.id} className="bg-surface-raised border border-line rounded-lg p-4 group">
            <div className="flex items-start justify-between">
              <div><h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {c.species_type && <span className="text-xs text-ink-muted">{c.species_type}</span>}
                  {c.danger_level && <Badge variant={dangerColors[c.danger_level]}>{dangerLabels[c.danger_level]}</Badge>}
                </div>
                {c.description && <p className="text-xs text-ink-secondary mt-2 line-clamp-2">{c.description}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-surface-overlay"><Edit3 size={12} className="text-ink-muted" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-surface-overlay"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать' : 'Новое существо'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Название" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Тип/Вид" value={speciesType} onChange={e => setSpeciesType(e.target.value)} />
            <Input label="Среда обитания" value={habitat} onChange={e => setHabitat(e.target.value)} />
            <Select label="Уровень опасности" options={Object.entries(dangerLabels).map(([v,l]) => ({value:v,label:l}))} value={danger} onChange={e => setDanger(e.target.value as DangerLevel)} />
          </div>
          <TextArea label="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <TextArea label="Способности" value={abilities} onChange={e => setAbilities(e.target.value)} rows={2} />
          <TextArea label="Уязвимости" value={weaknesses} onChange={e => setWeaknesses(e.target.value)} rows={2} />
          <TextArea label="История" value={history} onChange={e => setHistory(e.target.value)} rows={2} />
          <TextArea label="Связь с магией" value={magicRel} onChange={e => setMagicRel(e.target.value)} rows={2} />
          <div className="flex gap-2"><Button onClick={handleSave} loading={saving}>Сохранить</Button><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button></div>
        </div>
      </Modal>
    </div>
  );
}