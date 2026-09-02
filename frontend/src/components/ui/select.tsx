import { SelectHTMLAttributes, forwardRef } from 'react';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full rounded-xl border border-subtle bg-[var(--surface-1)] px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-accent-blue focus:bg-[var(--surface-4)] ${className}`}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
