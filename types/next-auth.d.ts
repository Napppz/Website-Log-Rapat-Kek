import { UserRole } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      biroId: string;
      biroCode?: string;
      biroName?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    role?: UserRole;
    biroId?: string;
    biroCode?: string;
    biroName?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
    biroId?: string;
    biroCode?: string;
    biroName?: string;
  }
}
