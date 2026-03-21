import { router, publicProcedure } from '../trpc';

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('session', { httpOnly: true, sameSite: 'lax' });
    return { success: true };
  }),
});
