import { useEffect, useRef } from 'react';

/** Scrolle jusqu'au bandeau d'erreur et lui donne le focus dès qu'il apparaît — utile quand le formulaire est long et que l'utilisateur ne voit pas le haut de page après avoir soumis. */
export function useScrollToError(isError: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isError) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.current?.focus();
    }
  }, [isError]);

  return ref;
}
