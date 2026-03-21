import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { db } from '../../db';
import { resources } from '../../db/schema';

const ResourceBase = z.object({
  title: z.string().min(1, 'El título es requerido').max(255),
  resourceType: z.enum(['Documento', 'Software', 'Concepto']),
  publicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  description: z.string().min(1, 'La descripción es requerida'),
  context: z.string().optional(),
  objective: z.string().optional(),
  license: z.string().max(50).optional(),
  link: z.string().url('Ingresa una URL válida').max(500).optional(),
});

const ResourceInput = ResourceBase.refine(
  (d) => !d.link || !!d.license,
  { message: 'Se requiere licencia cuando hay un enlace de descarga.', path: ['license'] },
);

export const resourcesRouter = router({
  getAll: publicProcedure.query(async () => {
    return db.select().from(resources).orderBy(desc(resources.publicationDate));
  }),

  create: adminProcedure.input(ResourceInput).mutation(async ({ input }) => {
    const result = await db.insert(resources).values({
      title: input.title,
      resourceType: input.resourceType,
      publicationDate: new Date(input.publicationDate + 'T12:00:00'),
      description: input.description,
      context: input.context ?? null,
      objective: input.objective ?? null,
      license: input.license ?? null,
      link: input.link ?? null,
    });
    const id = Number(result[0].insertId);
    const [inserted] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
    return inserted;
  }),

  update: adminProcedure
    .input(z.object({ id: z.number().int().positive() }).merge(ResourceBase.partial()))
    .mutation(async ({ input }) => {
      const { id, publicationDate, context, objective, license, link, ...rest } = input;
      const data = {
        ...rest,
        ...(publicationDate ? { publicationDate: new Date(publicationDate + 'T12:00:00') } : {}),
        ...(context !== undefined ? { context: context || null } : {}),
        ...(objective !== undefined ? { objective: objective || null } : {}),
        ...(license !== undefined ? { license: license || null } : {}),
        ...(link !== undefined ? { link: link || null } : {}),
      };
      if (Object.keys(data).length === 0) return null;
      await db.update(resources).set(data).where(eq(resources.id, id));
      const [updated] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const [resource] = await db.select().from(resources).where(eq(resources.id, input.id)).limit(1);
      if (!resource) throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurso no encontrado' });
      await db.delete(resources).where(eq(resources.id, input.id));
      return { success: true };
    }),
});
