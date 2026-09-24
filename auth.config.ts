import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname.startsWith('/api/auth');
      const isLoginRoute = nextUrl.pathname === '/login';

      if (isAuthRoute) return true;

      if (isLoginRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      // Protected routes
      return isLoggedIn;
    },
  },
  providers: [],
};
