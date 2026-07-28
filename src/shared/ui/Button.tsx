import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary text-white shadow-md hover:bg-primary-hover hover:shadow-lg disabled:bg-primary/40 disabled:shadow-none',
  secondary: 'bg-surface-container text-on-surface hover:bg-surface-container-high disabled:text-outline',
  outline: 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low disabled:text-outline',
  ghost: 'bg-transparent text-primary hover:bg-primary/5 disabled:text-outline',
  danger: 'bg-error text-on-error shadow-md hover:bg-error/90 hover:shadow-lg disabled:bg-error/40 disabled:shadow-none',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-sm rounded-lg px-md py-md font-headline-md text-headline-md transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
