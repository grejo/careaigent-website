import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
      const isLoginPage = request.nextUrl.pathname === '/admin/login';
      if (isAdminRoute && !isLoginPage) return !!auth;
      return true;
    },
  },
  providers: [],
};
