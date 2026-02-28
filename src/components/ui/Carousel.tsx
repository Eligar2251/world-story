'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  title: string;
  children: ReactNode;
  href?: string;
}

export default function Carousel({ title, children, href }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function check() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    check();
    const el = scrollRef.current;
    el?.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el?.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  function scroll(dir: -1 | 1) {
    scrollRef.current?.scrollBy({
      left: dir * 300,
      behavior: 'smooth',
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <div className="flex items-center gap-2">
          {href && (
            <a
              href={href}
              className="text-sm text-accent hover:underline mr-2"
            >
              Все
            </a>
          )}
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className="p-1.5 rounded border border-line text-ink-secondary hover:bg-surface-overlay disabled:opacity-30 transition-colors"
            aria-label="Назад"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className="p-1.5 rounded border border-line text-ink-secondary hover:bg-surface-overlay disabled:opacity-30 transition-colors"
            aria-label="Вперёд"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {children}
      </div>
    </section>
  );
}