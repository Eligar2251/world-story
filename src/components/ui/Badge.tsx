import type { ReactNode } from 'react';

type Variant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

const styles: Record<Variant, string> = {
  default: 'bg-surface-overlay text-ink-secondary border border-line',
  accent: 'bg-accent-soft text-accent border border-accent/15',
  success: 'bg-emerald-500/8 text-emerald-700 border border-emerald-500/15',
  warning: 'bg-amber-500/8 text-amber-700 border border-amber-500/15',
  danger: 'bg-red-500/8 text-red-700 border border-red-500/15',
};

interface Props {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium leading-tight ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}