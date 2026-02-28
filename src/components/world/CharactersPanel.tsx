'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Plus, Search, Edit3, Trash2, User,
  Heart, Skull, HelpCircle, Eye, EyeOff,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Character, CharacterStatus, Faction, Location } from '@/lib/types/world';

const statusConfig: Record<CharacterStatus, { label: string; variant: 'success' | 'danger' | 'default' | 'warning'; icon: typeof Heart }> = {
  alive: { label: 'Жив', variant: 'success', icon: Heart },
  dead: { label: 'Мёртв', variant: 'danger', icon: Skull },
  unknown: { label: 'Неизвестно', variant: 'default', icon: HelpCircle },
  undead: { label: 'Нежить', variant: 'warning', icon: Skull },
};

interface Props {
  projectId: string;
  characters: Character[];
  factions: Faction[];
  locations: Location[];
}

export default function CharactersPanel({ projectId, characters: init, factions, locations }: Props) {
  const supabase = createClient();
  const [characters, setCharacters] = useState(init);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Character | null>(null);
  const [detailOpen, setDetailOpen] = useState<Character | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState(emptyForm());

  function emptyForm() {
    return {
      name: '', aliases: '', gender: '', age: '', species: 'Human',
      height: '', eye_color: '', hair_color: '', distinguishing_marks: '',
      titles: '', nicknames: '', occupation: '', social_status: '',
      faction_id: '', location_id: '', religion: '',
      motivation: '', fears: '', goals: '', internal_conflict: '',
      personality: '', backstory: '',
      status: 'alive' as CharacterStatus, cause_of_death: '',
      inventory: '', notes: '', is_public: false,
    };
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(ch: Character) {
    setEditing(ch);
    setForm({
      name: ch.name, aliases: ch.aliases ?? '', gender: ch.gender ?? '',
      age: ch.age ?? '', species: ch.species, height: ch.height ?? '',
      eye_color: ch.eye_color ?? '', hair_color: ch.hair_color ?? '',
      distinguishing_marks: ch.distinguishing_marks ?? '',
      titles: ch.titles ?? '', nicknames: ch.nicknames ?? '',
      occupation: ch.occupation ?? '', social_status: ch.social_status ?? '',
      faction_id: ch.faction_id ?? '', location_id: ch.location_id ?? '',
      religion: ch.religion ?? '', motivation: ch.motivation ?? '',
      fears: ch.fears ?? '', goals: ch.goals ?? '',
      internal_conflict: ch.internal_conflict ?? '',
      personality: ch.personality ?? '', backstory: ch.backstory ?? '',
      status: ch.status, cause_of_death: ch.cause_of_death ?? '',
      inventory: ch.inventory ?? '', notes: ch.notes ?? '',
      is_public: ch.is_public,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      project_id: projectId,
      name: form.name.trim(),
      aliases: form.aliases || null,
      gender: form.gender || null,
      age: form.age || null,
      species: form.species || 'Human',
      height: form.height || null,
      eye_color: form.eye_color || null,
      hair_color: form.hair_color || null,
      distinguishing_marks: form.distinguishing_marks || null,
      titles: form.titles || null,
      nicknames: form.nicknames || null,
      occupation: form.occupation || null,
      social_status: form.social_status || null,
      faction_id: form.faction_id || null,
      location_id: form.location_id || null,
      religion: form.religion || null,
      motivation: form.motivation || null,
      fears: form.fears || null,
      goals: form.goals || null,
      internal_conflict: form.internal_conflict || null,
      personality: form.personality || null,
      backstory: form.backstory || null,
      status: form.status,
      cause_of_death: form.cause_of_death || null,
      inventory: form.inventory || null,
      notes: form.notes || null,
      is_public: form.is_public,
    };

    if (editing) {
      const { data } = await supabase.from('characters').update(payload).eq('id', editing.id).select().single();
      if (data) setCharacters(prev => prev.map(c => c.id === editing.id ? { ...c, ...data } : c));
    } else {
      const { data } = await supabase.from('characters').insert({ ...payload, sort_order: characters.length }).select().single();
      if (data) setCharacters(prev => [...prev, data as Character]);
    }

    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить персонажа?')) return;
    await supabase.from('characters').delete().eq('id', id);
    setCharacters(prev => prev.filter(c => c.id !== id));
    setDetailOpen(null);
  }

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.aliases?.toLowerCase().includes(search.toLowerCase()))
  );

  const F = (key: keyof typeof form, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Персонажи ({characters.length})</h2>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>Добавить</Button>
      </div>

      {characters.length > 3 && (
        <div className="mb-4">
          <Input
            placeholder="Поиск персонажа..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyCharState onClick={openCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(ch => {
            const sc = statusConfig[ch.status];
            const StatusIcon = sc.icon;
            return (
              <div
                key={ch.id}
                className="bg-surface-raised border border-line rounded-lg p-4 hover:shadow-soft transition-shadow cursor-pointer group"
                onClick={() => setDetailOpen(ch)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center text-accent font-semibold text-lg shrink-0">
                    {ch.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink truncate">{ch.name}</h3>
                    {ch.titles && <p className="text-xs text-ink-muted truncate">{ch.titles}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={sc.variant}>
                        <StatusIcon size={10} className="mr-0.5" />{sc.label}
                      </Badge>
                      {ch.faction && <span className="text-xs text-ink-muted">{(ch.faction as any).name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={e => { e.stopPropagation(); openEdit(ch); }} className="p-1 rounded hover:bg-surface-overlay">
                      <Edit3 size={12} className="text-ink-muted" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(ch.id); }} className="p-1 rounded hover:bg-surface-overlay">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail sidebar modal */}
      {detailOpen && (
        <Modal open={!!detailOpen} onClose={() => setDetailOpen(null)} title={detailOpen.name} wide>
          <CharacterDetail ch={detailOpen} onEdit={() => { setDetailOpen(null); openEdit(detailOpen); }} />
        </Modal>
      )}

      {/* Edit/Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать персонажа' : 'Новый персонаж'} wide>
        <div className="space-y-5">
          {/* Basic */}
          <SectionLabel label="Основное" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Имя" value={form.name} onChange={e => F('name', e.target.value)} required />
            <Input label="Псевдонимы" value={form.aliases} onChange={e => F('aliases', e.target.value)} />
            <Input label="Пол" value={form.gender} onChange={e => F('gender', e.target.value)} />
            <Input label="Возраст" value={form.age} onChange={e => F('age', e.target.value)} />
            <Input label="Раса/Вид" value={form.species} onChange={e => F('species', e.target.value)} />
            <Select label="Статус" options={[
              { value: 'alive', label: 'Жив' }, { value: 'dead', label: 'Мёртв' },
              { value: 'unknown', label: 'Неизвестно' }, { value: 'undead', label: 'Нежить' },
            ]} value={form.status} onChange={e => F('status', e.target.value)} />
          </div>
          {form.status === 'dead' && (
            <Input label="Причина смерти" value={form.cause_of_death} onChange={e => F('cause_of_death', e.target.value)} />
          )}

          {/* Physical */}
          <SectionLabel label="Внешность" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Рост" value={form.height} onChange={e => F('height', e.target.value)} />
            <Input label="Цвет глаз" value={form.eye_color} onChange={e => F('eye_color', e.target.value)} />
            <Input label="Цвет волос" value={form.hair_color} onChange={e => F('hair_color', e.target.value)} />
          </div>
          <TextArea label="Особые приметы" value={form.distinguishing_marks} onChange={e => F('distinguishing_marks', e.target.value)} rows={2} />

          {/* Social */}
          <SectionLabel label="Социальное" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Титулы" value={form.titles} onChange={e => F('titles', e.target.value)} />
            <Input label="Прозвища" value={form.nicknames} onChange={e => F('nicknames', e.target.value)} />
            <Input label="Занятие" value={form.occupation} onChange={e => F('occupation', e.target.value)} />
            <Input label="Социальный статус" value={form.social_status} onChange={e => F('social_status', e.target.value)} />
            <Select label="Фракция" options={[
              { value: '', label: 'Нет' },
              ...factions.map(f => ({ value: f.id, label: f.name })),
            ]} value={form.faction_id} onChange={e => F('faction_id', e.target.value)} />
            <Select label="Локация" options={[
              { value: '', label: 'Нет' },
              ...locations.map(l => ({ value: l.id, label: l.name })),
            ]} value={form.location_id} onChange={e => F('location_id', e.target.value)} />
            <Input label="Религия" value={form.religion} onChange={e => F('religion', e.target.value)} />
          </div>

          {/* Psychology */}
          <SectionLabel label="Психология" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextArea label="Мотивация" value={form.motivation} onChange={e => F('motivation', e.target.value)} rows={2} />
            <TextArea label="Страхи" value={form.fears} onChange={e => F('fears', e.target.value)} rows={2} />
            <TextArea label="Цели" value={form.goals} onChange={e => F('goals', e.target.value)} rows={2} />
            <TextArea label="Внутренний конфликт" value={form.internal_conflict} onChange={e => F('internal_conflict', e.target.value)} rows={2} />
          </div>
          <TextArea label="Личность" value={form.personality} onChange={e => F('personality', e.target.value)} rows={3} />
          <TextArea label="Предыстория" value={form.backstory} onChange={e => F('backstory', e.target.value)} rows={4} />

          {/* Extra */}
          <SectionLabel label="Дополнительно" />
          <TextArea label="Инвентарь" value={form.inventory} onChange={e => F('inventory', e.target.value)} rows={2} />
          <TextArea label="Заметки автора" value={form.notes} onChange={e => F('notes', e.target.value)} rows={2} />
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input type="checkbox" checked={form.is_public} onChange={e => F('is_public', e.target.checked)} className="accent-accent" />
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

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}

function CharacterDetail({ ch, onEdit }: { ch: Character; onEdit: () => void }) {
  const fields: [string, string | null][] = [
    ['Пол', ch.gender], ['Возраст', ch.age], ['Раса', ch.species],
    ['Рост', ch.height], ['Глаза', ch.eye_color], ['Волосы', ch.hair_color],
    ['Титулы', ch.titles], ['Прозвища', ch.nicknames],
    ['Занятие', ch.occupation], ['Статус', ch.social_status],
    ['Религия', ch.religion],
  ];

  const textFields: [string, string | null][] = [
    ['Особые приметы', ch.distinguishing_marks],
    ['Мотивация', ch.motivation], ['Страхи', ch.fears],
    ['Цели', ch.goals], ['Внутренний конфликт', ch.internal_conflict],
    ['Личность', ch.personality], ['Предыстория', ch.backstory],
    ['Инвентарь', ch.inventory],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fields.filter(([, v]) => v).map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="text-sm text-ink">{value}</p>
          </div>
        ))}
      </div>
      {textFields.filter(([, v]) => v).map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-ink-muted mb-1">{label}</p>
          <p className="text-sm text-ink-secondary whitespace-pre-line">{value}</p>
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={onEdit} icon={<Edit3 size={14} />}>
        Редактировать
      </Button>
    </div>
  );
}

function EmptyCharState({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center py-16 bg-surface-raised border border-line rounded-lg">
      <User className="w-12 h-12 mx-auto text-ink-muted mb-3" />
      <p className="text-sm text-ink-muted mb-3">Персонажей пока нет</p>
      <Button size="sm" onClick={onClick}>Добавить персонажа</Button>
    </div>
  );
}