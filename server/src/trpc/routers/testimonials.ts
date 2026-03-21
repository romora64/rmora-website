import { z } from 'zod';
import { eq, asc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { db } from '../../db';
import { testimonials } from '../../db/schema';

const TestimonialBase = z.object({
  opinion: z.string().min(1, 'La opinión es requerida'),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  relation: z.string().min(1, 'La relación es requerida').max(100),
  institution: z.string().max(255).optional(),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const testimonialsRouter = router({
  // ─── Público ──────────────────────────────────────────────────────────────
  getActive: publicProcedure.query(async () => {
    return db
      .select()
      .from(testimonials)
      .where(eq(testimonials.active, true))
      .orderBy(asc(testimonials.displayOrder));
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────
  getAll: adminProcedure.query(async () => {
    return db.select().from(testimonials).orderBy(asc(testimonials.displayOrder));
  }),

  create: adminProcedure.input(TestimonialBase).mutation(async ({ input }) => {
    const result = await db.insert(testimonials).values({
      opinion: input.opinion,
      name: input.name,
      relation: input.relation,
      institution: input.institution ?? null,
      displayOrder: input.displayOrder,
      active: input.active,
    });
    const id = Number(result[0].insertId);
    const [inserted] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
    return inserted;
  }),

  update: adminProcedure
    .input(z.object({ id: z.number().int().positive() }).merge(TestimonialBase.partial()))
    .mutation(async ({ input }) => {
      const { id, institution, ...rest } = input;
      const data = {
        ...rest,
        ...(institution !== undefined ? { institution: institution || null } : {}),
      };
      if (Object.keys(data).length === 0) return null;
      await db.update(testimonials).set(data).where(eq(testimonials.id, id));
      const [updated] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const [t] = await db.select().from(testimonials).where(eq(testimonials.id, input.id)).limit(1);
      if (!t) throw new TRPCError({ code: 'NOT_FOUND', message: 'Testimonio no encontrado' });
      await db.delete(testimonials).where(eq(testimonials.id, input.id));
      return { success: true };
    }),
});
