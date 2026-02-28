import type { ReactNode } from 'react';

type Variant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

const styles: Record<Variant, string> = {
  default: 'bg-surface-overlay text-ink-secondary',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-green-500/10 text-green-600',
  warning: 'bg-amber-500/10 text-amber-600',
  danger: 'bg-red-500/10 text-red-600',
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
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}