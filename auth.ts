import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const loginSchema = z.object({
  email: z.string().min(1, 'Email atau username wajib diisi'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  basePath: '/api/auth',
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email atau Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email: identifier, password } = parsed.data;
        const normalizedIdentifier = identifier.toLowerCase().trim();

        // 1. Coba cari berdasarkan username khusus ATAU email
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: normalizedIdentifier },
              { email: normalizedIdentifier },
              { email: `${normalizedIdentifier}@kek.go.id` },
            ],
          },
          include: {
            biro: true,
            team: true,
            userTeams: {
              include: {
                team: true,
              },
            },
          },
        });

        // Reject if user doesn't exist, has no password, or is deactivated
        if (!user || !user.password || !user.isActive) {
          return null;
        }

        let isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch && (password === 'AktivitasBiro3!2026' || password === 'DevOnly!2026')) {
          const isDevMatch = await bcrypt.compare('DevOnly!2026', user.password);
          const isAktMatch = await bcrypt.compare('AktivitasBiro3!2026', user.password);
          if (isDevMatch || isAktMatch) {
            isPasswordMatch = true;
          }
        }

        if (!isPasswordMatch) {
          return null;
        }

        const assignedTeamsMap = new Map<string, { id: string; code: string; name: string; role?: string | null }>();
        if (user.team && user.team.isActive) {
          assignedTeamsMap.set(user.team.id, {
            id: user.team.id,
            code: user.team.code,
            name: user.team.name,
            role: 'PRIMARY',
          });
        }
        if (user.userTeams && Array.isArray(user.userTeams)) {
          for (const ut of user.userTeams) {
            if (ut.team && ut.team.isActive && !assignedTeamsMap.has(ut.team.id)) {
              assignedTeamsMap.set(ut.team.id, {
                id: ut.team.id,
                code: ut.team.code,
                name: ut.team.name,
                role: ut.role || 'ANGGOTA',
              });
            }
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          biroId: user.biroId,
          biroCode: user.biro.code,
          biroName: user.biro.shortName,
          teamId: user.teamId,
          teamCode: user.team?.code,
          teamName: user.team?.name,
          assignedTeams: Array.from(assignedTeamsMap.values()),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = (user as any).username;
        token.role = user.role;
        token.biroId = user.biroId;
        token.biroCode = user.biroCode;
        token.biroName = user.biroName;
        token.teamId = user.teamId;
        token.teamCode = user.teamCode;
        token.teamName = user.teamName;
        token.assignedTeams = (user as any).assignedTeams || [];
      }

      // Handle client-side session update
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.user?.name) token.name = session.user.name;
        if (session.role) token.role = session.role;
        if (session.user?.role) token.role = session.user.role;
        if (session.biroCode) token.biroCode = session.biroCode;
        if (session.user?.biroCode) token.biroCode = session.user.biroCode;
        if (session.biroName) token.biroName = session.biroName;
        if (session.user?.biroName) token.biroName = session.user.biroName;
        if (session.teamCode) token.teamCode = session.teamCode;
        if (session.user?.teamCode) token.teamCode = session.user.teamCode;
        if (session.teamName) token.teamName = session.teamName;
        if (session.user?.teamName) token.teamName = session.user.teamName;
        if (session.user?.assignedTeams) token.assignedTeams = session.user.assignedTeams;
      }

      // Realtime sync from database: ensures profile edits and team assignments are immediately reflected
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              name: true,
              role: true,
              isActive: true,
              teamId: true,
              team: { select: { id: true, code: true, name: true, isActive: true } },
              biro: { select: { id: true, code: true, shortName: true } },
              userTeams: {
                select: {
                  role: true,
                  team: { select: { id: true, code: true, name: true, isActive: true } },
                },
              },
            },
          });
          if (dbUser && dbUser.isActive) {
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.teamId = dbUser.teamId;
            token.teamCode = dbUser.team?.code;
            token.teamName = dbUser.team?.name;
            if (dbUser.biro) {
              token.biroId = dbUser.biro.id;
              token.biroCode = dbUser.biro.code;
              token.biroName = dbUser.biro.shortName;
            }

            const teamsMap = new Map<string, { id: string; code: string; name: string; role?: string | null }>();
            if (dbUser.team && dbUser.team.isActive) {
              teamsMap.set(dbUser.team.id, {
                id: dbUser.team.id,
                code: dbUser.team.code,
                name: dbUser.team.name,
                role: 'PRIMARY',
              });
            }
            if (dbUser.userTeams) {
              for (const ut of dbUser.userTeams) {
                if (ut.team && ut.team.isActive && !teamsMap.has(ut.team.id)) {
                  teamsMap.set(ut.team.id, {
                    id: ut.team.id,
                    code: ut.team.code,
                    name: ut.team.name,
                    role: ut.role || 'ANGGOTA',
                  });
                }
              }
            }
            token.assignedTeams = Array.from(teamsMap.values());
          }
        } catch {
          // If DB query fails temporarily, retain token data
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string) || session.user.name;
        session.user.username = (token.username as string) || null;
        session.user.role = token.role as UserRole;
        session.user.biroId = token.biroId as string;
        session.user.biroCode = token.biroCode as string;
        session.user.biroName = token.biroName as string;
        session.user.teamId = (token.teamId as string) || null;
        session.user.teamCode = (token.teamCode as string) || null;
        session.user.teamName = (token.teamName as string) || null;
        session.user.assignedTeams = (token.assignedTeams as any) || [];
      }
      return session;
    },
  },
});
