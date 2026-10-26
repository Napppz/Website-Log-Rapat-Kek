'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export interface LoginResult {
  success: boolean;
  error?: string;
  url?: string;
}

export async function loginWithCredentialsAction(credentials: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<LoginResult> {
  const { email, password, redirectTo = '/' } = credentials;

  try {
    const res = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirectTo,
      redirect: false,
    });

    return {
      success: true,
      url: typeof res === 'string' ? res : redirectTo,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: 'Email atau kata sandi tidak cocok. Silakan periksa kembali kredensial Anda.',
          };
        default:
          return {
            success: false,
            error: 'Autentikasi gagal. Silakan periksa kembali akun dan kata sandi Anda.',
          };
      }
    }

    // In Next.js, redirect() throws a special error which must be re-thrown if redirect is true
    // But since redirect is false, check if error has digest starting with NEXT_REDIRECT
    const err = error as Error & { digest?: string };
    if (err?.digest?.includes('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      return {
        success: true,
        url: redirectTo,
      };
    }

    return {
      success: false,
      error: 'Terjadi kendala pada sistem autentikasi. Silakan coba lagi.',
    };
  }
}

export async function logoutAction(redirectTo = '/login') {
  await signOut({ redirectTo });
}
