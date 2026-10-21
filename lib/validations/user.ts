import { z } from 'zod';

export const userRoleEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'PIMPINAN',
  'STAFF',
]);

export const ROLE_SUFFIX_MAP: Record<z.infer<typeof userRoleEnum>, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  PIMPINAN: 'Pimpinan',
  STAFF: 'Staff',
};

export function getRoleSuffix(role?: string | null): string {
  if (!role) return 'Staff';
  return ROLE_SUFFIX_MAP[role as keyof typeof ROLE_SUFFIX_MAP] || 'Staff';
}

export function stripRoleSuffix(name?: string | null): string {
  if (!name) return '';
  return name
    .replace(
      /\s*\((?:Pimpinan[^)]*|Staff[^)]*|Staf[^)]*|Admin[^)]*|Super\s*Admin[^)]*|Pelaksana[^)]*|Koordinator[^)]*)\)\s*$/i,
      ''
    )
    .trim();
}

export function formatUserFullName(name?: string | null, role?: string | null): string {
  const base = stripRoleSuffix(name);
  if (!base) return '';
  const suffix = getRoleSuffix(role);
  return `${base} (${suffix})`;
}

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh huruf, angka, titik, strip, dan underscore')
    .optional()
    .nullable(),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: userRoleEnum.default('STAFF'),
  biroId: z.string().optional().default('BIRO-IKK'),
  teamId: z.string().optional().nullable(),
  teamIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  id: z.string().min(1, 'ID pengguna wajib disertakan'),
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh huruf, angka, titik, strip, dan underscore')
    .optional()
    .nullable(),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  role: userRoleEnum,
  biroId: z.string().optional().default('BIRO-IKK'),
  teamId: z.string().optional().nullable(),
  teamIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
