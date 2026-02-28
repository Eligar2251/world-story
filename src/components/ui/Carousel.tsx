'use client';

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  title: string;
  children: ReactNode;
  href?: string;
}

export default function Carousel({ title, children, href }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    check();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', check, { passive: true });
    // ResizeObserver вместо window.resize — точнее и дешевле
    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', check);
      ro.disconnect();
    };
  }, [check]);

  function scroll(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(':scope > *')?.clientWidth ?? 160;
    el.scrollBy({
      left: dir * cardWidth * 3,
      behavior: 'smooth',
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <div className="flex items-center gap-2">
          {href && (
            <Link
              href={href}
              prefetch={false}
              className="text-sm text-accent hover:underline mr-2"
            >
              Все
            </Link>
          )}
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className="p-1.5 rounded-lg border border-line text-ink-secondary hover:bg-surface-overlay disabled:opacity-30 transition-colors"
            aria-label="Назад"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className="p-1.5 rounded-lg border border-line text-ink-secondary hover:bg-surface-overlay disabled:opacity-30 transition-colors"
            aria-label="Вперёд"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none pb-2 will-change-scroll"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {children}
      </div>
    </section>
  );
}