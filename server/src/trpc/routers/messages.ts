import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { db } from '../../db';
import { contactMessages } from '../../db/schema';
import { sendContactMessageNotificationToAdmin } from '../../services/resend';

const SendMessageInput = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  email: z.string().email('Correo inválido').max(255),
  subject: z.string().min(1, 'El asunto es requerido').max(500),
  message: z.string().min(1, 'El mensaje es requerido').max(5000),
});

export const messagesRouter = router({
  send: publicProcedure.input(SendMessageInput).mutation(async ({ input }) => {
    await db.insert(contactMessages).values(input);

    // Notificar al admin por email (no bloquear si falla)
    try {
      await sendContactMessageNotificationToAdmin({
        senderName: input.name,
        senderEmail: input.email,
        subject: input.subject,
        message: input.message,
      });
    } catch (err) {
      console.error('Error enviando notificación de mensaje:', err);
    }

    return { success: true };
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────

  getAll: adminProcedure
    .input(z.object({ status: z.enum(['unread', 'read', 'replied', 'archived']).optional() }).optional())
    .query(async ({ input }) => {
      return db
        .select()
        .from(contactMessages)
        .where(input?.status ? eq(contactMessages.status, input.status) : undefined)
        .orderBy(desc(contactMessages.createdAt));
    }),

  getUnreadCount: adminProcedure.query(async () => {
    const rows = await db
      .select({ id: contactMessages.id })
      .from(contactMessages)
      .where(eq(contactMessages.status, 'unread'));
    return { count: rows.length };
  }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(['unread', 'read', 'replied', 'archived']) }))
    .mutation(async ({ input }) => {
      const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, input.id)).limit(1);
      if (!msg) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mensaje no encontrado' });
      await db.update(contactMessages).set({ status: input.status }).where(eq(contactMessages.id, input.id));
      return { success: true };
    }),
});
