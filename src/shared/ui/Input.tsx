import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
  trailing?: ReactNode;
  labelRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, trailing, labelRight, id, className = '', ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div>
        {(label || labelRight) && (
          <div className="mb-1 flex items-center justify-between">
            {label && (
              <label htmlFor={inputId} className="font-label-md text-label-md text-on-surface-variant">
                {label}
              </label>
            )}
            {labelRight}
          </div>
        )}
        <div className="relative">
          {icon && (
            <Icon
              name={icon}
              className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-outline"
            />
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg border py-md font-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:ring-2 focus:ring-primary/10 ${
              icon ? 'pl-[44px]' : 'pl-md'
            } ${trailing ? 'pr-[44px]' : 'pr-md'} ${
              error ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
            } ${className}`}
            aria-invalid={!!error}
            {...props}
          />
          {trailing && <div className="absolute right-md top-1/2 -translate-y-1/2">{trailing}</div>}
        </div>
        {error ? (
          <p className="mt-xs flex items-center gap-xs font-body-sm text-body-sm text-error">
            <Icon name="warning" className="text-[14px]" />
            {error}
          </p>
        ) : hint ? (
          <p className="mt-xs flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
            <Icon name="info" className="text-[14px]" />
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
