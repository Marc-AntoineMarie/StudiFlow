import { TextareaHTMLAttributes, forwardRef } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-xl border border-subtle bg-[var(--surface-1)] px-3 py-2.5 text-sm text-fg placeholder:text-fg-dim outline-none transition-colors focus:border-accent-blue focus:bg-[var(--surface-4)] ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
