'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Save, Settings, Maximize, Minimize,
  Clock, FileText, Bold, Italic, Heading1, Heading2,
  List as ListIcon, ListOrdered, Quote, Minus,
  StickyNote, X, Check, AlertCircle,
  PanelRightOpen, PanelRightClose,
  Search, Users, MapPin, Shield,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import type { Chapter, Project } from '@/lib/types/database';
import type { Character, Faction, Location } from '@/lib/types/world';

interface VersionEntry {
  timestamp: string;
  content: string;
  wordCount: number;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface WorldData {
  characters: Character[];
  factions: Faction[];
  locations: Location[];
}

interface Props {
  chapter: Chapter;
  project: Project;
  worldData: WorldData;
}

export default function EditorClient({ chapter, project, worldData }: Props) {
  const supabase = createClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const [content, setContent] = useState(chapter.content ?? '');
  const [title, setTitle] = useState(chapter.title);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [focusMode, setFocusMode] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [wordCount, setWordCount] = useState(chapter.word_count ?? 0);
  const [charCount, setCharCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Split View
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitTab, setSplitTab] = useState<'characters' | 'locations' | 'factions'>('characters');
  const [splitSearch, setSplitSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<Character | Faction | Location | null>(null);

  // Word count
  useEffect(() => {
    const trimmed = content.trim();
    if (trimmed === '') {
      setWordCount(0);
      setCharCount(0);
    } else {
      setWordCount(trimmed.split(/\s+/).length);
      setCharCount(trimmed.length);
    }
  }, [content]);

  // Load notes
  useEffect(() => {
    const saved = localStorage.getItem(`ws-notes-${chapter.id}`);
    if (saved) setNotes(saved);
    const savedVersions = localStorage.getItem(`ws-versions-${chapter.id}`);
    if (savedVersions) {
      try { setVersions(JSON.parse(savedVersions)); } catch {}
    }
  }, [chapter.id]);

  // Save notes
  useEffect(() => {
    localStorage.setItem(`ws-notes-${chapter.id}`, notes);
  }, [notes, chapter.id]);

  // Save function
  const save = useCallback(
    async (newContent?: string, newTitle?: string) => {
      const c = newContent ?? content;
      const t = newTitle ?? title;
      setSaveStatus('saving');

      const { error } = await supabase
        .from('chapters')
        .update({ content: c, title: t })
        .eq('id', chapter.id);

      if (error) {
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
        setLastSaved(new Date());
        const newVersion: VersionEntry = {
          timestamp: new Date().toISOString(),
          content: c,
          wordCount: c.trim() ? c.trim().split(/\s+/).length : 0,
        };
        setVersions((prev) => {
          const updated = [newVersion, ...prev].slice(0, 50);
          localStorage.setItem(`ws-versions-${chapter.id}`, JSON.stringify(updated));
          return updated;
        });
      }
    },
    [content, title, chapter.id, supabase]
  );

  function handleContentChange(value: string) {
    setContent(value);
    setSaveStatus('unsaved');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => save(value, title), 3000);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    setSaveStatus('unsaved');
  }

  async function handleManualSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await save();
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        setFocusMode((f) => !f);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        insertFormatting('**');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        insertFormatting('*');
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [content, title]);

  // Warn on unsaved leave
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  // Text formatting
  function insertFormatting(prefix: string, suffix = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const before = content.slice(0, start);
    const after = content.slice(end);
    const newContent = `${before}${prefix}${selected}${suffix || prefix}${after}`;
    handleContentChange(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  // Insert entity name at cursor
  function insertEntityName(name: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(start);
    const newContent = `${before}${name}${after}`;
    handleContentChange(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + name.length, start + name.length);
    });
  }

  function restoreVersion(version: VersionEntry) {
    if (!confirm('Восстановить эту версию? Текущий текст будет заменён.')) return;
    handleContentChange(version.content);
    setShowVersions(false);
  }

  // Entity names for highlighting
  const entityNames = useMemo(() => {
    const names: string[] = [];
    worldData.characters.forEach((c) => { names.push(c.name); if (c.aliases) names.push(...c.aliases.split(',')); });
    worldData.factions.forEach((f) => names.push(f.name));
    worldData.locations.forEach((l) => names.push(l.name));
    return [...new Set(names.map((n) => n.trim()).filter((n) => n.length > 1))];
  }, [worldData]);

  // Count entity mentions in current text
  const mentionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entityNames.forEach((name) => {
      const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex);
      if (matches) counts[name] = matches.length;
    });
    return counts;
  }, [content, entityNames]);

  // Filtered split view items
  const filteredSplitItems = useMemo(() => {
    const s = splitSearch.toLowerCase();
    if (splitTab === 'characters') {
      return worldData.characters.filter((c) =>
        c.name.toLowerCase().includes(s) || (c.aliases?.toLowerCase().includes(s))
      );
    }
    if (splitTab === 'factions') {
      return worldData.factions.filter((f) => f.name.toLowerCase().includes(s));
    }
    return worldData.locations.filter((l) => l.name.toLowerCase().includes(s));
  }, [splitTab, splitSearch, worldData]);

  const toolbarButtons = [
    { icon: Bold, label: 'Жирный (Ctrl+B)', action: () => insertFormatting('**') },
    { icon: Italic, label: 'Курсив (Ctrl+I)', action: () => insertFormatting('*') },
    { icon: Heading1, label: 'Заголовок 1', action: () => insertFormatting('# ', '\n') },
    { icon: Heading2, label: 'Заголовок 2', action: () => insertFormatting('## ', '\n') },
    { type: 'divider' as const },
    { icon: ListIcon, label: 'Список', action: () => insertFormatting('- ', '\n') },
    { icon: ListOrdered, label: 'Нум. список', action: () => insertFormatting('1. ', '\n') },
    { icon: Quote, label: 'Цитата', action: () => insertFormatting('> ', '\n') },
    { icon: Minus, label: 'Разделитель', action: () => insertFormatting('\n---\n', '') },
  ];

  function SaveStatusIcon() {
    switch (saveStatus) {
      case 'saved': return <Check size={14} className="text-green-500" />;
      case 'saving': return (
        <svg className="animate-spin h-3.5 w-3.5 text-ink-muted" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.42 31.42" strokeDashoffset="10" />
        </svg>
      );
      case 'unsaved': return <div className="w-2 h-2 rounded-full bg-amber-500" />;
      case 'error': return <AlertCircle size={14} className="text-red-500" />;
    }
  }

  const saveLabel: Record<SaveStatus, string> = {
    saved: 'Сохранено', saving: 'Сохранение...', unsaved: 'Не сохранено', error: 'Ошибка',
  };

  // Close side panels when split opens
  function toggleSplit() {
    if (!splitOpen) { setShowNotes(false); setShowVersions(false); }
    setSplitOpen(!splitOpen);
  }

  return (
    <div className={`min-h-screen flex flex-col ${focusMode ? 'bg-surface' : ''}`}>
      {/* Progress indicator (thin bar) */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-line z-[60]">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${wordCount > 0 ? Math.min((wordCount / 2000) * 100, 100) : 0}%` }}
        />
      </div>

      {/* Top bar */}
      <div className={`shrink-0 border-b border-line bg-surface-raised z-30 ${focusMode ? 'opacity-0 hover:opacity-100 transition-opacity duration-300' : ''}`}>
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/project/${project.id}`} className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-ink-muted truncate">{project.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <SaveStatusIcon />
              <span className="hidden sm:inline">{saveLabel[saveStatus]}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs text-ink-muted px-2 py-1 rounded bg-surface-overlay">
              <FileText size={12} />
              {wordCount.toLocaleString()} сл.
            </div>

            {/* Entity mentions count */}
            {Object.keys(mentionCounts).length > 0 && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-ink-muted px-2 py-1 rounded bg-surface-overlay">
                <Users size={12} />
                {Object.keys(mentionCounts).length} сущн.
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={() => { setShowNotes(!showNotes); if (!showNotes) { setShowVersions(false); setSplitOpen(false); } }} icon={<StickyNote size={14} />}>
              <span className="hidden sm:inline">Заметки</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => { setShowVersions(!showVersions); if (!showVersions) { setShowNotes(false); setSplitOpen(false); } }} icon={<Clock size={14} />}>
              <span className="hidden sm:inline">Версии</span>
            </Button>

            <Button variant={splitOpen ? 'secondary' : 'ghost'} size="sm" onClick={toggleSplit} icon={splitOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}>
              <span className="hidden sm:inline">Мир</span>
            </Button>

            <button onClick={() => setFocusMode(!focusMode)} className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors" title={focusMode ? 'Выйти (Ctrl+Enter)' : 'Фокус (Ctrl+Enter)'}>
              {focusMode ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>

            <Button size="sm" onClick={handleManualSave} icon={<Save size={14} />}>
              <span className="hidden sm:inline">Сохранить</span>
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        {!focusMode && (
          <div className="flex items-center gap-0.5 px-4 pb-2 overflow-x-auto scrollbar-none">
            {toolbarButtons.map((btn, i) => {
              if ('type' in btn && btn.type === 'divider') {
                return <div key={`d-${i}`} className="w-px h-5 bg-line mx-1" />;
              }
              const b = btn as { icon: typeof Bold; label: string; action: () => void };
              const Icon = b.icon;
              return (
                <button key={b.label} onClick={b.action} title={b.label} className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-surface-overlay transition-colors">
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="mx-auto w-full px-4 py-6" style={{ maxWidth: 780 }}>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Название главы"
              className="w-full text-2xl font-bold text-ink bg-transparent border-none outline-none mb-6 placeholder:text-ink-muted"
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Начните писать..."
              className="w-full min-h-[60vh] text-ink bg-transparent border-none outline-none resize-none placeholder:text-ink-muted"
              style={{ fontFamily: "'Georgia', 'Cambria', serif", fontSize: '17px', lineHeight: '1.85' }}
            />
          </div>
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="w-80 border-l border-line bg-surface-raised shrink-0 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <h3 className="text-sm font-semibold text-ink">Заметки</h3>
              <button onClick={() => setShowNotes(false)} className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-overlay"><X size={14} /></button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Заметки к главе..."
              className="flex-1 p-4 text-sm text-ink bg-transparent border-none outline-none resize-none placeholder:text-ink-muted"
            />
          </div>
        )}

        {/* Versions panel */}
        {showVersions && (
          <div className="w-80 border-l border-line bg-surface-raised shrink-0 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <h3 className="text-sm font-semibold text-ink">История версий</h3>
              <button onClick={() => setShowVersions(false)} className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-overlay"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="p-4 text-sm text-ink-muted">Пока нет сохранённых версий</p>
              ) : (
                <div className="divide-y divide-line">
                  {versions.map((v, i) => (
                    <button key={i} onClick={() => restoreVersion(v)} className="w-full text-left px-4 py-3 hover:bg-surface-overlay transition-colors">
                      <p className="text-sm text-ink">{new Date(v.timestamp).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{v.wordCount.toLocaleString()} слов</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== SPLIT VIEW — World Wiki ===== */}
        {splitOpen && (
          <div className="w-96 border-l border-line bg-surface-raised shrink-0 flex flex-col">
            {/* Split header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <h3 className="text-sm font-semibold text-ink">Вики мира</h3>
              <button onClick={() => setSplitOpen(false)} className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-overlay"><X size={14} /></button>
            </div>

            {/* Split tabs */}
            <div className="flex border-b border-line">
              {([
                { id: 'characters' as const, label: 'Персонажи', icon: Users, count: worldData.characters.length },
                { id: 'locations' as const, label: 'Локации', icon: MapPin, count: worldData.locations.length },
                { id: 'factions' as const, label: 'Фракции', icon: Shield, count: worldData.factions.length },
              ]).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setSplitTab(tab.id); setSelectedEntity(null); }}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium border-b-2 transition-colors ${
                      splitTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    <Icon size={12} />
                    {tab.label}
                    <span className="text-[10px] opacity-60">({tab.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-line">
              <Input
                placeholder="Поиск..."
                value={splitSearch}
                onChange={(e) => setSplitSearch(e.target.value)}
                icon={<Search size={12} />}
                className="text-xs py-1.5"
              />
            </div>

            {/* Entity detail or list */}
            <div className="flex-1 overflow-y-auto">
              {selectedEntity ? (
                <EntityDetail
                  entity={selectedEntity}
                  type={splitTab}
                  onBack={() => setSelectedEntity(null)}
                  onInsert={(name) => insertEntityName(name)}
                  mentionCount={mentionCounts[selectedEntity.name] ?? 0}
                />
              ) : (
                <div className="divide-y divide-line">
                  {(filteredSplitItems as any[]).map((item: any) => {
                    const mentions = mentionCounts[item.name] ?? 0;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedEntity(item)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-overlay transition-colors flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-ink font-medium truncate">{item.name}</p>
                          {splitTab === 'characters' && item.titles && (
                            <p className="text-xs text-ink-muted truncate">{item.titles}</p>
                          )}
                          {splitTab === 'locations' && item.type && (
                            <p className="text-xs text-ink-muted capitalize">{item.type}</p>
                          )}
                          {splitTab === 'factions' && item.type && (
                            <p className="text-xs text-ink-muted capitalize">{item.type}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {mentions > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-soft text-accent font-medium">
                              {mentions}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              insertEntityName(item.name);
                            }}
                            className="p-1 rounded text-accent hover:bg-accent-soft transition-colors"
                            title="Вставить имя в текст"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>
                      </button>
                    );
                  })}
                  {filteredSplitItems.length === 0 && (
                    <p className="p-4 text-xs text-ink-muted text-center">Ничего не найдено</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className={`shrink-0 border-t border-line bg-surface-raised px-4 py-2 flex items-center justify-between text-xs text-ink-muted ${focusMode ? 'opacity-0 hover:opacity-100 transition-opacity' : ''}`}>
        <div className="flex items-center gap-4">
          <span>{wordCount.toLocaleString()} слов</span>
          <span>{charCount.toLocaleString()} символов</span>
          <span>~{Math.ceil(wordCount / 200)} мин чтения</span>
          {Object.keys(mentionCounts).length > 0 && (
            <span>{Object.keys(mentionCounts).length} упоминаний сущностей</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span>Сохранено в {lastSaved.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          <Badge variant={chapter.status === 'published' ? 'success' : 'default'}>
            {chapter.status === 'published' ? 'Опубликовано' : 'Черновик'}
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* ===== Entity Detail in Split View ===== */

function EntityDetail({
  entity,
  type,
  onBack,
  onInsert,
  mentionCount,
}: {
  entity: any;
  type: string;
  onBack: () => void;
  onInsert: (name: string) => void;
  mentionCount: number;
}) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-accent hover:underline mb-3">
        <ArrowLeft size={12} />
        Назад к списку
      </button>

      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-ink">{entity.name}</h3>
          {mentionCount > 0 && (
            <p className="text-xs text-accent mt-0.5">
              Упомянут {mentionCount} раз в тексте
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onInsert(entity.name)}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          Вставить
        </Button>
      </div>

      <div className="space-y-3 text-sm">
        {type === 'characters' && (
          <>
            <DetailField label="Статус" value={entity.status === 'alive' ? 'Жив' : entity.status === 'dead' ? 'Мёртв' : entity.status} />
            <DetailField label="Пол" value={entity.gender} />
            <DetailField label="Возраст" value={entity.age} />
            <DetailField label="Раса" value={entity.species} />
            <DetailField label="Титулы" value={entity.titles} />
            <DetailField label="Прозвища" value={entity.nicknames} />
            <DetailField label="Занятие" value={entity.occupation} />
            <DetailField label="Мотивация" value={entity.motivation} />
            <DetailField label="Страхи" value={entity.fears} />
            <DetailField label="Цели" value={entity.goals} />
            <DetailField label="Личность" value={entity.personality} />
            <DetailField label="Предыстория" value={entity.backstory} />
            <DetailField label="Инвентарь" value={entity.inventory} />
          </>
        )}

        {type === 'locations' && (
          <>
            <DetailField label="Тип" value={entity.type} />
            <DetailField label="Климат" value={entity.climate} />
            <DetailField label="Население" value={entity.population} />
            <DetailField label="Экономика" value={entity.economy} />
            <DetailField label="Описание" value={entity.description} />
          </>
        )}

        {type === 'factions' && (
          <>
            <DetailField label="Тип" value={entity.type} />
            <DetailField label="Статус" value={entity.status} />
            <DetailField label="Девиз" value={entity.motto} />
            <DetailField label="Цвета" value={entity.colors} />
            <DetailField label="Основатель" value={entity.founder} />
            <DetailField label="Описание" value={entity.description} />
          </>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-ink-muted font-medium">{label}</p>
      <p className="text-sm text-ink-secondary whitespace-pre-line">{value}</p>
    </div>
  );
}

function ArrowLeft2({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}