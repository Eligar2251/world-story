import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, icon, className = '', ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-lg bg-surface border border-line
              px-3 py-2 text-sm text-ink
              placeholder:text-ink-muted
              focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50
              transition-all duration-150
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500/60 focus:ring-red-400/30' : ''}
              ${className}
            `}
            {...rest}
          />
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;