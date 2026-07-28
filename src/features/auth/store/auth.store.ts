import { create } from 'zustand';
import { type AuthUser, extractPermissionSlugs } from '../types/auth.types';

type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  permissions: Set<string>;
  setUser: (user: AuthUser) => void;
  clear: () => void;
  hasPermission: (slug: string) => boolean;
}

const SUPER_ADMIN_SLUG = 'Manage_system';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',
  permissions: new Set(),
  setUser: (user) =>
    set({
      user,
      status: 'authenticated',
      permissions: new Set(extractPermissionSlugs(user.role)),
    }),
  clear: () => set({ user: null, status: 'unauthenticated', permissions: new Set() }),
  hasPermission: (slug) => {
    const permissions = get().permissions;
    return permissions.has(SUPER_ADMIN_SLUG) || permissions.has(slug);
  },
}));
