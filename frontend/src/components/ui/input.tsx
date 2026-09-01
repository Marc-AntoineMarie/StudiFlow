import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon, ...props }, ref) => (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={`w-full rounded-xl border border-subtle bg-white/5 py-2.5 text-sm text-fg placeholder:text-fg-dim outline-none transition-colors focus:border-accent-blue focus:bg-white/[0.07] ${icon ? 'pl-10 pr-3' : 'px-3'} ${className}`}
        {...props}
      />
    </div>
  ),
);
Input.displayName = 'Input';
