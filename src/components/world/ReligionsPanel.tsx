'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import type { Religion, Deity } from '@/lib/types/world';

interface Props { projectId: string; religions: Religion[]; deities: Deity[]; }

export default function ReligionsPanel({ projectId, religions: init, deities: initDeities }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState(init);
  const [deities, setDeities] = useState(initDeities);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Religion | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clergyStructure, setClergyStructure] = useState('');
  const [rituals, setRituals] = useState('');
  const [sacredTexts, setSacredTexts] = useState('');
  const [taboos, setTaboos] = useState('');
  const [regions, setRegions] = useState('');

  function openCreate() { setEditing(null); setName(''); setDescription(''); setClergyStructure(''); setRituals(''); setSacredTexts(''); setTaboos(''); setRegions(''); setModalOpen(true); }
  function openEdit(r: Religion) { setEditing(r); setName(r.name); setDescription(r.description??''); setClergyStructure(r.clergy_structure??''); setRituals(r.rituals??''); setSacredTexts(r.sacred_texts??''); setTaboos(r.taboos??''); setRegions(r.regions??''); setModalOpen(true); }

  async function handleSave() {
    if (!name.trim()) return; setSaving(true);
    const payload = { project_id: projectId, name: name.trim(), description: description||null, clergy_structure: clergyStructure||null, rituals: rituals||null, sacred_texts: sacredTexts||null, taboos: taboos||null, regions: regions||null };
    if (editing) { const { data } = await supabase.from('religions').update(payload).eq('id', editing.id).select().single(); if (data) setItems(p => p.map(i => i.id === editing.id ? {...i,...data} : i)); }
    else { const { data } = await supabase.from('religions').insert({...payload, sort_order: items.length}).select().single(); if (data) setItems(p => [...p, data as Religion]); }
    setModalOpen(false); setSaving(false);
  }

  async function handleDelete(id: string) { if (!confirm('Удалить?')) return; await supabase.from('religions').delete().eq('id', id); setItems(p => p.filter(i => i.id !== id)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Религии ({items.length})</h2>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>Добавить</Button>
      </div>
      {items.length === 0 ? <EmptyIcon icon={<BookOpen className="w-12 h-12 text-ink-muted" />} label="Религий пока нет" onClick={openCreate} /> : (
        <div className="space-y-3">
          {items.map(r => (
            <div key={r.id} className="bg-surface-raised border border-line rounded-lg p-4 group">
              <div className="flex items-start justify-between">
                <div><h3 className="text-sm font-semibold text-ink">{r.name}</h3>
                {r.description && <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{r.description}</p>}
                {r.clergy_structure && <p className="text-xs text-ink-muted mt-1">Духовенство: {r.clergy_structure}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(r)} className="p-1 rounded hover:bg-surface-overlay"><Edit3 size={12} className="text-ink-muted" /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-surface-overlay"><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать' : 'Новая религия'} wide>
        <div className="space-y-4">
          <Input label="Название" value={name} onChange={e => setName(e.target.value)} required />
          <TextArea label="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <TextArea label="Иерархия духовенства" value={clergyStructure} onChange={e => setClergyStructure(e.target.value)} rows={2} />
          <TextArea label="Ритуалы" value={rituals} onChange={e => setRituals(e.target.value)} rows={2} />
          <TextArea label="Священные тексты" value={sacredTexts} onChange={e => setSacredTexts(e.target.value)} rows={2} />
          <TextArea label="Табу" value={taboos} onChange={e => setTaboos(e.target.value)} rows={2} />
          <Input label="Распространение по регионам" value={regions} onChange={e => setRegions(e.target.value)} />
          <div className="flex gap-2"><Button onClick={handleSave} loading={saving}>Сохранить</Button><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button></div>
        </div>
      </Modal>
    </div>
  );
}

function EmptyIcon({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <div className="text-center py-16 bg-surface-raised border border-line rounded-lg">{icon}<p className="text-sm text-ink-muted mb-3 mt-3">{label}</p><Button size="sm" onClick={onClick}>Создать</Button></div>;
}