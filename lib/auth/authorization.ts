import { auth } from '@/auth';
import { UserRole } from '@prisma/client';

export type AppPermission =
  | 'view:dashboard'
  | 'view:meeting'
  | 'create:meeting'
  | 'edit:meeting'
  | 'delete:meeting'
  | 'manage:participants'
  | 'create:minutes'
  | 'edit:minutes'
  | 'view:minutes'
  | 'create:action_item'
  | 'edit:action_item'
  | 'delete:action_item'
  | 'manage:users'
  | 'manage:biro';

export const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  SUPER_ADMIN: [
    'view:dashboard',
    'view:meeting',
    'create:meeting',
    'edit:meeting',
    'delete:meeting',
    'manage:participants',
    'create:minutes',
    'edit:minutes',
    'view:minutes',
    'create:action_item',
    'edit:action_item',
    'delete:action_item',
    'manage:users',
    'manage:biro',
  ],
  ADMIN: [
    'view:dashboard',
    'view:meeting',
    'create:meeting',
    'edit:meeting',
    'delete:meeting',
    'manage:participants',
    'create:minutes',
    'edit:minutes',
    'view:minutes',
    'create:action_item',
    'edit:action_item',
    'delete:action_item',
  ],
  NOTULIS: [
    'view:dashboard',
    'view:meeting',
    'create:meeting',
    'manage:participants',
    'create:minutes',
    'edit:minutes',
    'view:minutes',
    'create:action_item',
    'edit:action_item',
    'delete:action_item',
  ],
  STAFF: [
    'view:dashboard',
    'view:meeting',
    'view:minutes',
    'edit:action_item', // Subject to ownership check
  ],
  VIEWER: [
    'view:dashboard',
    'view:meeting',
    'view:minutes',
  ],
};

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  biroId: string;
  biroCode?: string;
  biroName?: string;
}

let testUserOverride: AuthUser | null = null;

/**
 * For testing purposes only: override current user in test scripts
 */
export function setTestAuthUser(user: AuthUser | null) {
  testUserOverride = user;
}

/**
 * Get current authenticated user session from Auth.js
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (testUserOverride) {
    return testUserOverride;
  }
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return null;
    }
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      biroId: session.user.biroId,
      biroCode: session.user.biroCode,
      biroName: session.user.biroName,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require valid authentication. Throws error if not logged in.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: Anda harus masuk ke sistem terlebih dahulu.');
  }
  return user;
}

/**
 * Require specific role(s). Throws error if not authorized.
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]): Promise<AuthUser> {
  const user = await requireAuth();
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(user.role)) {
    throw new Error('Forbidden: Peran pengguna Anda tidak memiliki hak akses untuk tindakan ini.');
  }

  return user;
}

/**
 * Check if a role has permission, with optional ownership validation for STAFF.
 */
export function hasPermission(
  role: UserRole,
  permission: AppPermission,
  context?: { actionItemPicUserId?: string | null; currentUserId?: string }
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  if (!rolePerms.includes(permission)) {
    return false;
  }

  // Ownership rule: STAFF can only edit action items assigned to them
  if (role === 'STAFF' && permission === 'edit:action_item') {
    if (!context?.currentUserId || !context?.actionItemPicUserId) {
      return false;
    }
    return context.currentUserId === context.actionItemPicUserId;
  }

  return true;
}

/**
 * Require specific permission. Throws error if not authorized.
 */
export async function requirePermission(
  permission: AppPermission,
  context?: { actionItemPicUserId?: string | null }
): Promise<AuthUser> {
  const user = await requireAuth();

  const isAllowed = hasPermission(user.role, permission, {
    actionItemPicUserId: context?.actionItemPicUserId,
    currentUserId: user.id,
  });

  if (!isAllowed) {
    throw new Error(`Forbidden: Anda tidak memiliki izin (${permission}) untuk operasi ini.`);
  }

  return user;
}
