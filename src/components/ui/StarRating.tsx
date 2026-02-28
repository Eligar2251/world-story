'use client';

import { useState } from 'react';

interface Props {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}

export default function StarRating({
  value,
  max = 10,
  size = 16,
  interactive = false,
  onChange,
}: Props) {
  const [hover, setHover] = useState(0);
  const stars = Math.ceil(max / 2);
  const filled = value / 2;
  const hoverFilled = hover / 2;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: stars }).map((_, i) => {
        const starIndex = i + 1;
        const currentFill = interactive && hover > 0 ? hoverFilled : filled;
        const isFull = currentFill >= starIndex;
        const isHalf = !isFull && currentFill >= starIndex - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(starIndex * 2)}
            onMouseEnter={() => interactive && setHover(starIndex * 2)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} p-0 border-none bg-transparent`}
            aria-label={`${starIndex * 2} из ${max}`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`half-${i}`}>
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={
                  isFull
                    ? '#F59E0B'
                    : isHalf
                    ? `url(#half-${i})`
                    : 'none'
                }
                stroke={isFull || isHalf ? '#F59E0B' : 'var(--text-tertiary)'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
      <span className="text-sm text-ink-secondary ml-1">
        {value}/{max}
      </span>
    </div>
  );
}