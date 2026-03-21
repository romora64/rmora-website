import { router, publicProcedure } from './trpc';
import { authRouter } from './routers/auth';
import { publicationsRouter } from './routers/publications';
import { messagesRouter } from './routers/messages';
import { meetingsRouter } from './routers/meetings';
import { availabilityRouter } from './routers/availability';
import { resourcesRouter } from './routers/resources';
import { licensesRouter } from './routers/licenses';
import { testimonialsRouter } from './routers/testimonials';

export { router, publicProcedure } from './trpc';
export { adminProcedure, protectedProcedure } from './trpc';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => ({
    status: '✓ Sistema operativo',
    timestamp: new Date().toISOString(),
  })),
  auth: authRouter,
  publications: publicationsRouter,
  messages: messagesRouter,
  meetings: meetingsRouter,
  availability: availabilityRouter,
  resources: resourcesRouter,
  licenses: licensesRouter,
  testimonials: testimonialsRouter,
});

export type AppRouter = typeof appRouter;
