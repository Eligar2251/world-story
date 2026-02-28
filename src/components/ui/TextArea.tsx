import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, className = '', ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink-secondary">{label}</label>
      )}
      <textarea
        ref={ref}
        className={`w-full rounded bg-surface-overlay border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y ${className}`}
        {...rest}
      />
    </div>
  )
);
TextArea.displayName = 'TextArea';
export default TextArea;