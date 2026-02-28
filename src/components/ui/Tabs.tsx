'use client';

import { useState, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface Props {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  children: (activeTab: string) => ReactNode;
}

export default function Tabs({ tabs, defaultTab, onChange, children }: Props) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  function handleClick(id: string) {
    setActive(id);
    onChange?.(id);
  }

  return (
    <div>
      <div className="flex border-b border-line overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleClick(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
              whitespace-nowrap border-b-2 transition-colors
              ${
                active === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-secondary hover:text-ink hover:border-line'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active === tab.id
                    ? 'bg-accent-soft text-accent'
                    : 'bg-surface-overlay text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">{children(active)}</div>
    </div>
  );
}