import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { db } from '../../db';
import { meetings } from '../../db/schema';
import { getAvailableSlots } from '../../lib/availability';
import { createMeetingEvent, cancelMeetingEvent } from '../../services/googleCalendar';
import {
  sendMeetingConfirmationToAttendee,
  sendMeetingNotificationToAdmin,
} from '../../services/resend';

const RequestMeetingInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  attendeeName: z.string().min(1, 'El nombre es requerido').max(255),
  attendeeEmail: z.string().email('Correo inválido').max(255),
  notes: z.string().max(2000).optional(),
});

export const meetingsRouter = router({
  /**
   * Retorna los slots disponibles para una fecha dada.
   * Input: YYYY-MM-DD
   * Output: string[] con los slots 'HH:MM'
   */
  getAvailableSlots: publicProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ input }) => {
      const slots = await getAvailableSlots(input.date);
      return { date: input.date, slots };
    }),

  /**
   * Solicita una reunión: valida disponibilidad, crea evento en Calendar,
   * guarda en DB y envía emails de confirmación.
   */
  requestMeeting: publicProcedure.input(RequestMeetingInput).mutation(async ({ input }) => {
    const { date, time, attendeeName, attendeeEmail, notes } = input;

    // 1. Validar que el slot sigue disponible
    const available = await getAvailableSlots(date);
    if (!available.includes(time)) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'El horario seleccionado ya no está disponible. Por favor elige otro.',
      });
    }

    // 2. Crear evento en Google Calendar (genera Meet link)
    let calendarEventId = '';
    let meetLink = '';
    try {
      const result = await createMeetingEvent({ date, time, attendeeName, attendeeEmail, notes });
      calendarEventId = result.calendarEventId;
      meetLink = result.meetLink;
    } catch (err) {
      console.error('Error creando evento en Google Calendar:', err);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No se pudo crear el evento en el calendario. Intente de nuevo.',
      });
    }

    // 3. Guardar reunión en DB
    await db.insert(meetings).values({
      date: new Date(date + 'T12:00:00'), // mediodía para evitar offset timezone en DATE
      time: time + ':00',                 // MySQL TIME espera HH:MM:SS
      attendeeName,
      attendeeEmail,
      notes: notes ?? null,
      calendarEventId,
      meetLink,
      status: 'pending',
    });

    // 4. Enviar emails (no bloquear si falla)
    try {
      await Promise.all([
        sendMeetingConfirmationToAttendee({ attendeeName, attendeeEmail, date, time, meetLink }),
        sendMeetingNotificationToAdmin({ attendeeName, attendeeEmail, date, time, notes, meetLink }),
      ]);
    } catch (err) {
      console.error('Error enviando emails de reunión:', err);
    }

    return { success: true, meetLink };
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────

  getAll: adminProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'completed', 'cancelled']).optional(),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input?.status) conditions.push(eq(meetings.status, input.status));
      if (input?.from) conditions.push(gte(meetings.date, new Date(input.from + 'T12:00:00')));
      if (input?.to) conditions.push(lte(meetings.date, new Date(input.to + 'T12:00:00')));

      return db
        .select()
        .from(meetings)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(meetings.date), desc(meetings.time));
    }),

  getUpcoming: adminProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return db
      .select()
      .from(meetings)
      .where(and(gte(meetings.date, today), eq(meetings.status, 'pending')))
      .orderBy(meetings.date, meetings.time)
      .limit(5);
  }),

  getDashboardStats: adminProcedure.query(async () => {
    const allMeetings = await db.select({ status: meetings.status, date: meetings.date }).from(meetings);
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      pending: allMeetings.filter((m) => m.status === 'pending').length,
      thisMonth: allMeetings.filter((m) => {
        const d = m.date instanceof Date ? m.date : new Date(String(m.date));
        return d >= firstOfMonth && m.status !== 'cancelled';
      }).length,
    };
  }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(['pending', 'completed', 'cancelled']) }))
    .mutation(async ({ input }) => {
      const [meeting] = await db.select().from(meetings).where(eq(meetings.id, input.id)).limit(1);
      if (!meeting) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reunión no encontrada' });

      // Si se cancela, intentar eliminar el evento del calendario
      if (input.status === 'cancelled' && meeting.calendarEventId) {
        try {
          await cancelMeetingEvent(meeting.calendarEventId);
        } catch (err) {
          console.error('Error cancelando evento en Calendar:', err);
        }
      }

      await db.update(meetings).set({ status: input.status }).where(eq(meetings.id, input.id));
      return { success: true };
    }),

  updateInternalNotes: adminProcedure
    .input(z.object({ id: z.number(), internalNotes: z.string().max(5000) }))
    .mutation(async ({ input }) => {
      await db
        .update(meetings)
        .set({ internalNotes: input.internalNotes })
        .where(eq(meetings.id, input.id));
      return { success: true };
    }),
});
