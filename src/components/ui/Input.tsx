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
          <label className="text-sm font-medium text-ink-secondary">
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
              w-full rounded bg-surface-overlay border border-line
              px-3 py-2 text-sm text-ink
              placeholder:text-ink-muted
              focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
              transition-colors
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-400/40' : ''}
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