'use client';

import { useState } from 'react';
import { Plus, Trash2, GitBranch } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Character, CharacterRelation, CharRelationType } from '@/lib/types/world';

const relLabels: Record<CharRelationType, string> = {
  parent: 'Родитель', child: 'Ребёнок', spouse: 'Супруг(а)',
  sibling: 'Брат/Сестра', lover: 'Возлюбленный', rival: 'Соперник',
  mentor: 'Наставник', student: 'Ученик', liege: 'Сюзерен',
  vassal: 'Вассал', friend: 'Друг', enemy: 'Враг',
  bastard_parent: 'Родитель (незаконн.)', bastard_child: 'Ребёнок (незаконн.)',
};

const familyTypes: CharRelationType[] = ['parent', 'child', 'spouse', 'sibling', 'bastard_parent', 'bastard_child'];

interface Props {
  projectId: string;
  characters: Character[];
  relations: CharacterRelation[];
}

export default function FamilyTreePanel({ projectId, characters, relations: init }: Props) {
  const supabase = createClient();
  const [relations, setRelations] = useState(init);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [charA, setCharA] = useState('');
  const [charB, setCharB] = useState('');
  const [relType, setRelType] = useState<CharRelationType>('parent');
  const [filter, setFilter] = useState<'all' | 'family' | 'social'>('all');

  const filtered = filter === 'all' ? relations
    : filter === 'family' ? relations.filter(r => familyTypes.includes(r.relation_type))
    : relations.filter(r => !familyTypes.includes(r.relation_type));

  async function handleAdd() {
    if (!charA || !charB || charA === charB) return;
    setSaving(true);
    const { data } = await supabase.from('character_relations').insert({
      project_id: projectId, character_a_id: charA, character_b_id: charB, relation_type: relType,
    }).select(`*,
      character_a:characters!character_relations_character_a_id_fkey(id,name,status),
      character_b:characters!character_relations_character_b_id_fkey(id,name,status)
    `).single();
    if (data) setRelations(prev => [...prev, data as CharacterRelation]);
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('character_relations').delete().eq('id', id);
    setRelations(prev => prev.filter(r => r.id !== id));
  }

  // Build simple tree SVG
  const familyRels = relations.filter(r => familyTypes.includes(r.relation_type));
  const involvedIds = new Set<string>();
  familyRels.forEach(r => { involvedIds.add(r.character_a_id); involvedIds.add(r.character_b_id); });
  const involved = characters.filter(c => involvedIds.has(c.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Родословные и связи</h2>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>Добавить связь</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(['all', 'family', 'social'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === f ? 'bg-accent-soft text-accent' : 'text-ink-secondary bg-surface-overlay'}`}>
            {f === 'all' ? 'Все' : f === 'family' ? 'Семейные' : 'Социальные'}
          </button>
        ))}
      </div>

      {/* Visual tree for family relations */}
      {filter !== 'social' && involved.length > 0 && (
        <div className="bg-surface-raised border border-line rounded-lg p-4 mb-4 overflow-x-auto">
          <svg width={Math.max(involved.length * 140, 400)} height={200} className="mx-auto">
            {involved.map((ch, i) => {
              const x = i * 140 + 70;
              const y = 40;
              const isAlive = ch.status === 'alive';
              return (
                <g key={ch.id}>
                  <circle cx={x} cy={y} r={24} fill="var(--accent-light)" stroke={isAlive ? 'var(--accent)' : '#EF4444'} strokeWidth={2} />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fill="var(--text-primary)" fontWeight={600}>
                    {ch.name.slice(0, 3)}
                  </text>
                  <text x={x} y={y + 50} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">
                    {ch.name.length > 12 ? ch.name.slice(0, 12) + '...' : ch.name}
                  </text>
                </g>
              );
            })}
            {familyRels.map((r, i) => {
              const ai = involved.findIndex(c => c.id === r.character_a_id);
              const bi = involved.findIndex(c => c.id === r.character_b_id);
              if (ai < 0 || bi < 0) return null;
              const ax = ai * 140 + 70;
              const bx = bi * 140 + 70;
              const isSpouse = r.relation_type === 'spouse';
              return (
                <line key={r.id} x1={ax} y1={64} x2={bx} y2={64}
                  stroke={isSpouse ? '#F59E0B' : 'var(--accent)'}
                  strokeWidth={isSpouse ? 2 : 1.5}
                  strokeDasharray={r.relation_type.includes('bastard') ? '4 4' : undefined} />
              );
            })}
          </svg>
        </div>
      )}

      {/* Relations list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-surface-raised border border-line rounded-lg">
          <GitBranch className="w-12 h-12 mx-auto text-ink-muted mb-3" />
          <p className="text-sm text-ink-muted">Связей пока нет</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(r => (
            <div key={r.id} className="flex items-center gap-2 px-3 py-2 bg-surface-raised border border-line rounded-lg text-sm group">
              <span className="text-ink font-medium">{(r.character_a as any)?.name}</span>
              <Badge>{relLabels[r.relation_type]}</Badge>
              <span className="text-ink font-medium">{(r.character_b as any)?.name}</span>
              <button onClick={() => handleDelete(r.id)} className="ml-auto p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-overlay">
                <Trash2 size={12} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Добавить связь">
        <div className="space-y-4">
          <Select label="Персонаж A" options={characters.map(c => ({ value: c.id, label: c.name }))} value={charA} onChange={e => setCharA(e.target.value)} />
          <Select label="Тип связи" options={Object.entries(relLabels).map(([v, l]) => ({ value: v, label: l }))} value={relType} onChange={e => setRelType(e.target.value as CharRelationType)} />
          <Select label="Персонаж B" options={characters.map(c => ({ value: c.id, label: c.name }))} value={charB} onChange={e => setCharB(e.target.value)} />
          <div className="flex gap-2"><Button onClick={handleAdd} loading={saving}>Добавить</Button><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button></div>
        </div>
      </Modal>
    </div>
  );
}