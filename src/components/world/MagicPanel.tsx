'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { MagicSystem, MagicType } from '@/lib/types/world';

const typeLabels: Record<MagicType, string> = { hard: 'Жёсткая', soft: 'Мягкая', hybrid: 'Гибрид' };

interface Props { projectId: string; systems: MagicSystem[]; }

export default function MagicPanel({ projectId, systems: init }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState(init);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MagicSystem | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<MagicType>('hard');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [limitations, setLimitations] = useState('');
  const [cost, setCost] = useState('');
  const [practitioners, setPractitioners] = useState('');
  const [histEvents, setHistEvents] = useState('');

  function openCreate() { setEditing(null); setName(''); setType('hard'); setSource(''); setDescription(''); setLimitations(''); setCost(''); setPractitioners(''); setHistEvents(''); setModalOpen(true); }
  function openEdit(m: MagicSystem) { setEditing(m); setName(m.name); setType(m.type); setSource(m.source??''); setDescription(m.description??''); setLimitations(m.limitations??''); setCost(m.cost??''); setPractitioners(m.known_practitioners??''); setHistEvents(m.historical_events??''); setModalOpen(true); }

  async function handleSave() {
    if (!name.trim()) return; setSaving(true);
    const payload = { project_id: projectId, name: name.trim(), type, source: source||null, description: description||null, limitations: limitations||null, cost: cost||null, known_practitioners: practitioners||null, historical_events: histEvents||null };
    if (editing) { const { data } = await supabase.from('magic_systems').update(payload).eq('id', editing.id).select().single(); if (data) setItems(p => p.map(i => i.id === editing.id ? {...i,...data} : i)); }
    else { const { data } = await supabase.from('magic_systems').insert({...payload, sort_order: items.length}).select().single(); if (data) setItems(p => [...p, data as MagicSystem]); }
    setModalOpen(false); setSaving(false);
  }

  async function handleDelete(id: string) { if (!confirm('Удалить?')) return; await supabase.from('magic_systems').delete().eq('id', id); setItems(p => p.filter(i => i.id !== id)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Магические системы ({items.length})</h2>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>Добавить</Button>
      </div>
      {items.length === 0 ? <EmptyMagic onClick={openCreate} /> : (
        <div className="space-y-3">{items.map(m => (
          <div key={m.id} className="bg-surface-raised border border-line rounded-lg p-4 group">
            <div className="flex items-start justify-between">
              <div><div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-ink">{m.name}</h3><Badge>{typeLabels[m.type]}</Badge></div>
              {m.source && <p className="text-xs text-ink-muted mt-1">Источник: {m.source}</p>}
              {m.description && <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{m.description}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => openEdit(m)} className="p-1 rounded hover:bg-surface-overlay"><Edit3 size={12} className="text-ink-muted" /></button>
                <button onClick={() => handleDelete(m.id)} className="p-1 rounded hover:bg-surface-overlay"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать' : 'Новая система магии'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Название" value={name} onChange={e => setName(e.target.value)} required />
            <Select label="Тип" options={Object.entries(typeLabels).map(([v,l]) => ({value:v,label:l}))} value={type} onChange={e => setType(e.target.value as MagicType)} />
          </div>
          <Input label="Источник силы" value={source} onChange={e => setSource(e.target.value)} />
          <TextArea label="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <TextArea label="Ограничения" value={limitations} onChange={e => setLimitations(e.target.value)} rows={2} />
          <Input label="Цена магии" value={cost} onChange={e => setCost(e.target.value)} />
          <TextArea label="Известные маги" value={practitioners} onChange={e => setPractitioners(e.target.value)} rows={2} />
          <TextArea label="Исторические события" value={histEvents} onChange={e => setHistEvents(e.target.value)} rows={2} />
          <div className="flex gap-2"><Button onClick={handleSave} loading={saving}>Сохранить</Button><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button></div>
        </div>
      </Modal>
    </div>
  );
}

function EmptyMagic({ onClick }: { onClick: () => void }) {
  return <div className="text-center py-16 bg-surface-raised border border-line rounded-lg"><Sparkles className="w-12 h-12 mx-auto text-ink-muted mb-3" /><p className="text-sm text-ink-muted mb-3">Магических систем пока нет</p><Button size="sm" onClick={onClick}>Создать</Button></div>;
}