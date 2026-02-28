'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit3, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { TimelineEra, TimelineEvent, EventType, Location } from '@/lib/types/world';

const eventTypeLabels: Record<EventType, string> = {
  event: 'Событие', war: 'Война', battle: 'Битва', coup: 'Переворот',
  disaster: 'Катастрофа', founding: 'Основание', death: 'Смерть',
  birth: 'Рождение', other: 'Другое',
};

const eventTypeColors: Record<EventType, string> = {
  event: '#6366F1', war: '#EF4444', battle: '#F97316', coup: '#8B5CF6',
  disaster: '#DC2626', founding: '#22C55E', death: '#6B7280',
  birth: '#3B82F6', other: '#9CA3AF',
};

interface Props {
  projectId: string;
  eras: TimelineEra[];
  events: TimelineEvent[];
  locations: Location[];
}

export default function TimelinePanel({ projectId, eras: initEras, events: initEvents, locations }: Props) {
  const supabase = createClient();
  const [eras, setEras] = useState(initEras);
  const [events, setEvents] = useState(initEvents);
  const [eraModal, setEraModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [saving, setSaving] = useState(false);

  // Era form
  const [eraName, setEraName] = useState('');
  const [eraStart, setEraStart] = useState('');
  const [eraEnd, setEraEnd] = useState('');
  const [eraColor, setEraColor] = useState('#6366F1');

  // Event form
  const [evTitle, setEvTitle] = useState('');
  const [evYear, setEvYear] = useState('');
  const [evDateLabel, setEvDateLabel] = useState('');
  const [evType, setEvType] = useState<EventType>('event');
  const [evEraId, setEvEraId] = useState('');
  const [evDescription, setEvDescription] = useState('');
  const [evParticipants, setEvParticipants] = useState('');
  const [evOutcome, setEvOutcome] = useState('');
  const [evConsequences, setEvConsequences] = useState('');
  const [evLocationId, setEvLocationId] = useState('');

  function openCreateEvent() {
    setEditingEvent(null);
    setEvTitle(''); setEvYear(''); setEvDateLabel(''); setEvType('event');
    setEvEraId(''); setEvDescription(''); setEvParticipants('');
    setEvOutcome(''); setEvConsequences(''); setEvLocationId('');
    setEventModal(true);
  }

  function openEditEvent(ev: TimelineEvent) {
    setEditingEvent(ev);
    setEvTitle(ev.title); setEvYear(ev.year?.toString() ?? '');
    setEvDateLabel(ev.date_label ?? ''); setEvType(ev.type);
    setEvEraId(ev.era_id ?? ''); setEvDescription(ev.description ?? '');
    setEvParticipants(ev.participants ?? ''); setEvOutcome(ev.outcome ?? '');
    setEvConsequences(ev.consequences ?? ''); setEvLocationId(ev.location_id ?? '');
    setEventModal(true);
  }

  async function handleSaveEra() {
    if (!eraName.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('timeline_eras').insert({
      project_id: projectId, name: eraName.trim(),
      start_year: eraStart ? Number(eraStart) : null,
      end_year: eraEnd ? Number(eraEnd) : null,
      color: eraColor, sort_order: eras.length,
    }).select().single();
    if (data) setEras(prev => [...prev, data as TimelineEra]);
    setEraModal(false);
    setEraName(''); setEraStart(''); setEraEnd('');
    setSaving(false);
  }

  async function handleSaveEvent() {
    if (!evTitle.trim()) return;
    setSaving(true);
    const payload = {
      project_id: projectId, title: evTitle.trim(),
      year: evYear ? Number(evYear) : null,
      date_label: evDateLabel || null, type: evType,
      era_id: evEraId || null, description: evDescription || null,
      participants: evParticipants || null, outcome: evOutcome || null,
      consequences: evConsequences || null, location_id: evLocationId || null,
    };

    if (editingEvent) {
      const { data } = await supabase.from('timeline_events').update(payload).eq('id', editingEvent.id)
        .select(`*, era:timeline_eras!timeline_events_era_id_fkey(id,name,color), location:locations!timeline_events_location_id_fkey(id,name)`).single();
      if (data) setEvents(prev => prev.map(e => e.id === editingEvent.id ? data as TimelineEvent : e));
    } else {
      const { data } = await supabase.from('timeline_events').insert({ ...payload, sort_order: events.length })
        .select(`*, era:timeline_eras!timeline_events_era_id_fkey(id,name,color), location:locations!timeline_events_location_id_fkey(id,name)`).single();
      if (data) setEvents(prev => [...prev, data as TimelineEvent]);
    }
    setEventModal(false);
    setSaving(false);
  }

  async function handleDeleteEvent(id: string) {
    await supabase.from('timeline_events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  async function handleDeleteEra(id: string) {
    if (!confirm('Удалить эпоху?')) return;
    await supabase.from('timeline_eras').delete().eq('id', id);
    setEras(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Таймлайн</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEraModal(true)} icon={<Plus size={14} />}>Эпоха</Button>
          <Button size="sm" onClick={openCreateEvent} icon={<Plus size={14} />}>Событие</Button>
        </div>
      </div>

      {/* Eras bar */}
      {eras.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-2">
          {eras.map(era => (
            <div key={era.id} className="shrink-0 px-3 py-2 rounded-lg border border-line bg-surface-raised flex items-center gap-2 group">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: era.color }} />
              <span className="text-sm text-ink font-medium">{era.name}</span>
              {(era.start_year || era.end_year) && (
                <span className="text-xs text-ink-muted">
                  {era.start_year ?? '?'} — {era.end_year ?? '?'}
                </span>
              )}
              <button onClick={() => handleDeleteEra(era.id)} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-overlay">
                <Trash2 size={10} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Timeline visual */}
      {events.length === 0 ? (
        <div className="text-center py-16 bg-surface-raised border border-line rounded-lg">
          <Clock className="w-12 h-12 mx-auto text-ink-muted mb-3" />
          <p className="text-sm text-ink-muted mb-3">Событий пока нет</p>
          <Button size="sm" onClick={openCreateEvent}>Добавить событие</Button>
        </div>
      ) : (
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-line" />

          <div className="space-y-4">
            {events.map(ev => (
              <div key={ev.id} className="relative group">
                {/* Dot */}
                <div
                  className="absolute -left-5 top-3 w-3 h-3 rounded-full border-2 border-surface"
                  style={{ backgroundColor: eventTypeColors[ev.type] }}
                />

                <div className="bg-surface-raised border border-line rounded-lg p-4 hover:shadow-soft transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {ev.year !== null && (
                          <span className="text-xs font-mono text-accent font-bold">
                            {ev.date_label || `Год ${ev.year}`}
                          </span>
                        )}
                        <Badge>{eventTypeLabels[ev.type]}</Badge>
                        {ev.era && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: (ev.era as any).color + '20', color: (ev.era as any).color }}>
                            {(ev.era as any).name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-ink">{ev.title}</h3>
                      {ev.description && <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{ev.description}</p>}
                      {ev.participants && <p className="text-xs text-ink-muted mt-1">Участники: {ev.participants}</p>}
                      {ev.outcome && <p className="text-xs text-ink-muted">Итог: {ev.outcome}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={() => openEditEvent(ev)} className="p-1 rounded hover:bg-surface-overlay"><Edit3 size={12} className="text-ink-muted" /></button>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="p-1 rounded hover:bg-surface-overlay"><Trash2 size={12} className="text-red-400" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Era modal */}
      <Modal open={eraModal} onClose={() => setEraModal(false)} title="Новая эпоха">
        <div className="space-y-4">
          <Input label="Название" value={eraName} onChange={e => setEraName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Начало (год)" type="number" value={eraStart} onChange={e => setEraStart(e.target.value)} />
            <Input label="Конец (год)" type="number" value={eraEnd} onChange={e => setEraEnd(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-secondary block mb-1.5">Цвет</label>
            <input type="color" value={eraColor} onChange={e => setEraColor(e.target.value)} className="w-10 h-10 rounded border border-line cursor-pointer" />
          </div>
          <div className="flex gap-2"><Button onClick={handleSaveEra} loading={saving}>Создать</Button><Button variant="ghost" onClick={() => setEraModal(false)}>Отмена</Button></div>
        </div>
      </Modal>

      {/* Event modal */}
      <Modal open={eventModal} onClose={() => setEventModal(false)} title={editingEvent ? 'Редактировать событие' : 'Новое событие'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Название" value={evTitle} onChange={e => setEvTitle(e.target.value)} required />
            <Select label="Тип" options={Object.entries(eventTypeLabels).map(([v, l]) => ({ value: v, label: l }))} value={evType} onChange={e => setEvType(e.target.value as EventType)} />
            <Input label="Год" type="number" value={evYear} onChange={e => setEvYear(e.target.value)} />
            <Input label="Дата (текст)" value={evDateLabel} onChange={e => setEvDateLabel(e.target.value)} placeholder="3-й день Осени" />
            <Select label="Эпоха" options={[{ value: '', label: 'Нет' }, ...eras.map(e => ({ value: e.id, label: e.name }))]} value={evEraId} onChange={e => setEvEraId(e.target.value)} />
            <Select label="Локация" options={[{ value: '', label: 'Нет' }, ...locations.map(l => ({ value: l.id, label: l.name }))]} value={evLocationId} onChange={e => setEvLocationId(e.target.value)} />
          </div>
          <TextArea label="Описание" value={evDescription} onChange={e => setEvDescription(e.target.value)} rows={3} />
          <TextArea label="Участники" value={evParticipants} onChange={e => setEvParticipants(e.target.value)} rows={2} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextArea label="Итог" value={evOutcome} onChange={e => setEvOutcome(e.target.value)} rows={2} />
            <TextArea label="Последствия" value={evConsequences} onChange={e => setEvConsequences(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2"><Button onClick={handleSaveEvent} loading={saving}>Сохранить</Button><Button variant="ghost" onClick={() => setEventModal(false)}>Отмена</Button></div>
        </div>
      </Modal>
    </div>
  );
}