import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc';
import { db } from '../../db';
import { availabilityBlocks } from '../../db/schema';

const BlockInput = z.object({
  blockType: z.enum(['full_day', 'time_range']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().max(500).optional(),
  recurring: z.enum(['none', 'weekly', 'daily', 'weekday']).default('none'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const availabilityRouter = router({
  getAll: adminProcedure.query(async () => {
    return db.select().from(availabilityBlocks).orderBy(availabilityBlocks.date);
  }),

  create: adminProcedure.input(BlockInput).mutation(async ({ input }) => {
    if (input.blockType === 'time_range' && (!input.startTime || !input.endTime)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Se requieren hora de inicio y fin para bloqueo por franja horaria.',
      });
    }

    await db.insert(availabilityBlocks).values({
      blockType: input.blockType,
      date: new Date(input.date + 'T12:00:00'),
      // time() columns accept 'HH:MM:SS' strings
      ...(input.startTime ? { startTime: input.startTime + ':00' } : {}),
      ...(input.endTime ? { endTime: input.endTime + ':00' } : {}),
      reason: input.reason ?? null,
      recurring: input.recurring,
      ...(input.endDate ? { endDate: new Date(input.endDate + 'T12:00:00') } : {}),
    });

    return { success: true };
  }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [block] = await db
        .select()
        .from(availabilityBlocks)
        .where(eq(availabilityBlocks.id, input.id))
        .limit(1);
      if (!block) throw new TRPCError({ code: 'NOT_FOUND', message: 'Bloque no encontrado' });

      await db.delete(availabilityBlocks).where(eq(availabilityBlocks.id, input.id));
      return { success: true };
    }),
});
