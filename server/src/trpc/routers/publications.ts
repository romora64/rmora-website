import { z } from 'zod';
import { eq, desc, asc } from 'drizzle-orm';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { db } from '../../db';
import { publications } from '../../db/schema';

const PublicationTypeEnum = z.enum(['Artículo', 'Ponencia', 'Investigación', 'Blog']);

const PublicationInput = z.object({
  type: PublicationTypeEnum,
  title: z.string().min(1, 'El título es requerido').max(500),
  description: z.string().max(5000).optional().nullable(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  storageLink: z.string().url('Debe ser una URL válida').max(500),
});

export const publicationsRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        type: PublicationTypeEnum.optional(),
        orderBy: z.enum(['publishedAt', 'title', 'type']).default('publishedAt'),
        order: z.enum(['asc', 'desc']).default('desc'),
      }).optional(),
    )
    .query(async ({ input }) => {
      const { type, orderBy = 'publishedAt', order = 'desc' } = input ?? {};

      const orderCol = {
        publishedAt: publications.publishedAt,
        title: publications.title,
        type: publications.type,
      }[orderBy];

      const orderFn = order === 'asc' ? asc(orderCol) : desc(orderCol);

      return db
        .select()
        .from(publications)
        .where(type ? eq(publications.type, type) : undefined)
        .orderBy(orderFn);
    }),

  getRecent: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(10).default(3) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 3;
      return db
        .select()
        .from(publications)
        .orderBy(desc(publications.publishedAt))
        .limit(limit);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(publications)
        .where(eq(publications.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  create: adminProcedure
    .input(PublicationInput)
    .mutation(async ({ input }) => {
      const result = await db.insert(publications).values({
        ...input,
        publishedAt: new Date(input.publishedAt + 'T12:00:00'), // mediodía evita desfase UTC
      });
      const id = Number(result[0].insertId);
      const inserted = await db
        .select()
        .from(publications)
        .where(eq(publications.id, id))
        .limit(1);
      return inserted[0];
    }),

  update: adminProcedure
    .input(z.object({ id: z.number().int().positive() }).merge(PublicationInput.partial()))
    .mutation(async ({ input }) => {
      const { id, publishedAt, ...rest } = input;
      const data = {
        ...rest,
        ...(publishedAt ? { publishedAt: new Date(publishedAt + 'T12:00:00') } : {}),
      };
      if (Object.keys(data).length === 0) return null;
      await db.update(publications).set(data).where(eq(publications.id, id));
      const updated = await db
        .select()
        .from(publications)
        .where(eq(publications.id, id))
        .limit(1);
      return updated[0];
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.delete(publications).where(eq(publications.id, input.id));
      return { success: true };
    }),
});
