import { useAuthStore } from '@/features/auth/store/auth.store';

export function usePermission(slug: string): boolean {
  return useAuthStore((s) => s.hasPermission(slug));
}
