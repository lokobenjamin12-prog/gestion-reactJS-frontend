import { forwardRef, type SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className = '', ...props }, ref) => (
  <select
    ref={ref}
    className={`rounded-lg border border-outline-variant bg-white px-md py-sm font-label-md text-label-md text-on-surface-variant outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));

Select.displayName = 'Select';
