import { useToastStore } from '@/shared/store/toast.store';
import { Icon } from './Icon';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed bottom-lg right-lg z-[200] flex flex-col gap-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`toast-enter flex items-center gap-md rounded-xl border px-lg py-md shadow-xl ${
            t.variant === 'success'
              ? 'border-outline-variant bg-inverse-surface text-inverse-on-surface'
              : 'border-error/20 bg-error-container text-on-error-container'
          }`}
        >
          <Icon
            name={t.variant === 'success' ? 'check_circle' : 'error'}
            filled={t.variant === 'success'}
            className={t.variant === 'success' ? 'text-emerald-400' : 'text-error'}
          />
          <p className="font-body-md text-body-md font-medium">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="ml-md rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
            aria-label="Fermer"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
      ))}
    </div>
  );
}
