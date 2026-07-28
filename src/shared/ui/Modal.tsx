import type { MouseEvent, ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}

export function Modal({ open, onClose, children, widthClassName = 'max-w-[480px]' }: ModalProps) {
  if (!open) return null;

  const stopPropagation = (e: MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 p-md backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl ${widthClassName}`}
        onClick={stopPropagation}
      >
        {children}
      </div>
    </div>
  );
}
