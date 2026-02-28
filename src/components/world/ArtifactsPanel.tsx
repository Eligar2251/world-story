'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Gem } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Artifact, ArtifactType } from '@/lib/types/world';

const typeLabels: Record<ArtifactType, string> = { weapon: 'Оружие', armor: 'Броня', relic: 'Реликвия', book: 'Книга', currency: 'Валюта', poison: 'Яд', tool: 'Инструмент', technology: 'Технология', other: 'Другое' };

interface Props { projectId: string; artifacts: Artifact[]; }

export default function ArtifactsPanel({ projectId, artifacts: init }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState(init);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Artifact | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ArtifactType>('relic');
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState('');
  const [powers, setPowers] = useState('');
  const [owner, setOwner] = useState('');

  function openCreate() { setEditing(null); setName(''); setType('relic'); setDescription(''); setHistory(''); setPowers(''); setOwner(''); setModalOpen(true); }
  function openEdit(a: Artifact) { setEditing(a); setName(a.name); setType(a.type); setDescription(a.description??''); setHistory(a.history??''); setPowers(a.powers??''); setOwner(a.current_owner??''); setModalOpen(true); }

  async function handleSave() {
    if (!name.trim()) return; setSaving(true);
    const payload = { project_id: projectId, name: name.trim(), type, description: description||null, history: history||null, powers: powers||null, current_owner: owner||null };
    if (editing) { const { data } = await supabase.from('artifacts').update(payload).eq('id', editing.id).select().single(); if (data) setItems(p => p.map(i => i.id === editing.id ? {...i,...data} : i)); }
    else { const { data } = await supabase.from('artifacts').insert({...payload, sort_order: items.length}).select().single(); if (data) setItems(p => [...p, data as Artifact]); }
    setModalOpen(false); setSaving(false);
  }

  async function handleDelete(id: string) { if (!confirm('Удалить?')) return; await supabase.from('artifacts').delete().eq('id', id); setItems(p => p.filter(i => i.id !== id)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Артефакты ({items.length})</h2>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>Добавить</Button>
      </div>
      {items.length === 0 ? <div className="text-center py-16 bg-surface-raised border border-line rounded-lg"><Gem className="w-12 h-12 mx-auto text-ink-muted mb-3" /><p className="text-sm text-ink-muted mb-3">Артефактов пока нет</p><Button size="sm" onClick={openCreate}>Создать</Button></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{items.map(a => (
          <div key={a.id} className="bg-surface-raised border border-line rounded-lg p-4 group">
            <div className="flex items-start justify-between">
              <div><h3 className="text-sm font-semibold text-ink">{a.name}</h3>
                <Badge className="mt-1">{typeLabels[a.type]}</Badge>
                {a.description && <p className="text-xs text-ink-secondary mt-2 line-clamp-2">{a.description}</p>}
                {a.current_owner && <p className="text-xs text-ink-muted mt-1">Владелец: {a.current_owner}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => openEdit(a)} className="p-1 rounded hover:bg-surface-overlay"><Edit3 size={12} className="text-ink-muted" /></button>
                <button onClick={() => handleDelete(a.id)} className="p-1 rounded hover:bg-surface-overlay"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать' : 'Новый артефакт'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Название" value={name} onChange={e => setName(e.target.value)} required />
            <Select label="Тип" options={Object.entries(typeLabels).map(([v,l]) => ({value:v,label:l}))} value={type} onChange={e => setType(e.target.value as ArtifactType)} />
          </div>
          <TextArea label="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <TextArea label="История" value={history} onChange={e => setHistory(e.target.value)} rows={2} />
          <TextArea label="Силы/Свойства" value={powers} onChange={e => setPowers(e.target.value)} rows={2} />
          <Input label="Текущий владелец" value={owner} onChange={e => setOwner(e.target.value)} />
          <div className="flex gap-2"><Button onClick={handleSave} loading={saving}>Сохранить</Button><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button></div>
        </div>
      </Modal>
    </div>
  );
}