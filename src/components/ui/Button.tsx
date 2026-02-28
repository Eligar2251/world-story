import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-40 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-sm hover:shadow',
  secondary:
    'bg-surface-overlay text-ink border border-line hover:border-accent/30 hover:text-accent active:scale-[0.98]',
  ghost:
    'text-ink-secondary hover:text-ink hover:bg-surface-overlay active:bg-line/50',
  danger:
    'bg-red-600/90 text-white hover:bg-red-700 active:scale-[0.98]',
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2 rounded-lg',
  lg: 'text-sm px-6 py-2.5 rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  icon,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="31.42 31.42"
            strokeDashoffset="10"
          />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}