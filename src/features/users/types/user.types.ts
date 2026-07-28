import type { AccountStatus } from '@/features/auth/types/auth.types';
import type { Role } from '@/features/roles/types/role.types';

export type HoraireType = 'JOUR' | 'NUIT' | 'MIXTE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  whatsappNumber?: string | null;
  profilePicture?: string | null;
  verified: boolean;
  active: boolean;
  status: AccountStatus;
  estArchive: boolean;
  dateNaissance?: string | null;
  dateRecrutement: string;
  adresse?: string | null;
  salaireBase: string; // Prisma Decimal → sérialisé en string via JSON
  typeHoraire: HoraireType;
  soldeConges: number;
  quotaCongesAnnuel: number;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface UsersFilters {
  search?: string;
  roleId?: number;
  estArchive?: boolean;
  page?: number;
  limit?: number;
}
