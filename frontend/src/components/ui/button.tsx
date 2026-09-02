import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent-blue text-white hover:bg-accent-blue-light disabled:opacity-60 disabled:hover:bg-accent-blue',
  ghost: 'bg-[var(--surface-1)] text-fg hover:bg-[var(--surface-2)] border border-subtle',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm font-medium transition-colors ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
