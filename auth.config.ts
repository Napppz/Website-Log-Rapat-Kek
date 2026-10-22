import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  basePath: '/api/auth',
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname.startsWith('/api/auth');
      const isLoginRoute = nextUrl.pathname === '/login';
      const isCalendarIcsRoute = nextUrl.pathname.endsWith('/ics');
      const isPublicDoc = nextUrl.pathname.endsWith('.html') || nextUrl.pathname.endsWith('.drawio') || nextUrl.pathname.endsWith('.puml') || nextUrl.pathname.endsWith('.pdf');

      if (isAuthRoute || isCalendarIcsRoute || isPublicDoc) return true;

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
