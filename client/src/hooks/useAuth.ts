import { trpc } from '@/lib/trpc';

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    user: user ?? null,
    isLoading,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
  };
}
