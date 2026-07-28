import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const textareaId = id ?? props.name;

    return (
      <div>
        {label && (
          <label htmlFor={textareaId} className="mb-1 block font-label-md text-label-md text-on-surface-variant">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full rounded-lg border px-md py-sm font-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:ring-2 focus:ring-primary/10 ${
            error ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
          } ${className}`}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="mt-xs flex items-center gap-xs font-body-sm text-body-sm text-error">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
