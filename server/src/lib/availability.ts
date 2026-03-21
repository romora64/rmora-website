import { and, eq, or } from 'drizzle-orm';
import { db } from '../db';
import { availabilityBlocks, meetings } from '../db/schema';
import { config } from '../config';

/**
 * Genera todos los slots base del día según la configuración.
 * Retorna strings 'HH:MM' dentro del horario laboral.
 */
export function generateBaseSlots(): string[] {
  const startMinutes = config.AVAILABILITY_START_HOUR * 60;
  const endMinutes = config.AVAILABILITY_END_HOUR * 60 + config.AVAILABILITY_END_MINUTE;
  const duration = config.MEETING_DURATION_MINUTES;

  const slots: string[] = [];
  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    slots.push(`${h}:${min}`);
  }
  return slots;
}

/** Convierte 'HH:MM' a minutos desde medianoche */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Retorna el lunes de la semana de una fecha dada (medianoche, hora local) */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
  const diff = day === 0 ? -6 : 1 - day; // retroceder al lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retorna los slots disponibles para una fecha dada (YYYY-MM-DD).
 * Filtra slots bloqueados (availabilityBlocks) y slots ya ocupados (meetings).
 */
export async function getAvailableSlots(dateStr: string): Promise<string[]> {
  // 1. Verificar que el día de la semana esté habilitado
  // Parsear como fecha local
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, mo - 1, d);
  const dayOfWeek = dateObj.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

  if (!config.availabilityDays.includes(dayOfWeek)) {
    return [];
  }

  // 2. Generar slots base
  const baseSlots = generateBaseSlots();

  // 3. Obtener bloques de disponibilidad para esta fecha
  //    - Bloques directos en esta fecha exacta
  //    - Bloques recurrentes (weekly, daily, weekday)
  const blocks = await db
    .select()
    .from(availabilityBlocks)
    .where(
      or(
        eq(availabilityBlocks.date, dateStr as unknown as Date),
        eq(availabilityBlocks.recurring, 'weekly'),
        eq(availabilityBlocks.recurring, 'daily'),
        eq(availabilityBlocks.recurring, 'weekday'),
      ),
    );

  // Filtrar bloques aplicables a esta fecha
  const applicableBlocks = blocks.filter((block) => {
    const blockDateStr =
      block.date instanceof Date
        ? block.date.toISOString().slice(0, 10)
        : String(block.date).slice(0, 10);

    // Bloqueo diario aplica a todos los días hábiles desde la fecha del bloque
    if (block.recurring === 'daily') {
      if (dateStr < blockDateStr) return false;
      return true;
    }

    if (block.recurring === 'weekly') {
      // Aplica a todos los días hábiles de la misma semana calendario
      const [by, bmo, bd] = blockDateStr.split('-').map(Number);
      const blockWeekStart = getWeekStart(new Date(by, bmo - 1, bd));
      const queryWeekStart = getWeekStart(new Date(y, mo - 1, d));
      return blockWeekStart.getTime() === queryWeekStart.getTime();
    }

    if (block.recurring === 'weekday') {
      // Aplica al mismo día de la semana, entre fecha inicio y fecha fin
      const [by, bmo, bd] = blockDateStr.split('-').map(Number);
      const blockDayOfWeek = new Date(by, bmo - 1, bd).getDay();
      if (blockDayOfWeek !== dayOfWeek) return false;
      if (dateStr < blockDateStr) return false;
      if (block.endDate) {
        const endStr =
          block.endDate instanceof Date
            ? block.endDate.toISOString().slice(0, 10)
            : String(block.endDate).slice(0, 10);
        if (dateStr > endStr) return false;
      }
      return true;
    }

    // Bloque directo en esta fecha exacta
    return blockDateStr === dateStr;
  });

  // 4. Obtener reuniones ya agendadas en esta fecha (status != cancelled)
  const existingMeetings = await db
    .select({ time: meetings.time })
    .from(meetings)
    .where(
      and(
        eq(meetings.date, dateStr as unknown as Date),
        or(eq(meetings.status, 'pending'), eq(meetings.status, 'completed')),
      ),
    );

  const occupiedTimes = new Set(
    existingMeetings.map((m) => {
      // MySQL TIME retorna 'HH:MM:SS', normalizar a 'HH:MM'
      const t = String(m.time);
      return t.slice(0, 5);
    }),
  );

  // 5. Filtrar slots
  const available = baseSlots.filter((slot) => {
    // Ya ocupado por una reunión
    if (occupiedTimes.has(slot)) return false;

    const slotMin = timeToMinutes(slot);

    // Verificar contra bloques de disponibilidad
    for (const block of applicableBlocks) {
      if (block.blockType === 'full_day') {
        return false;
      }
      if (block.blockType === 'time_range' && block.startTime && block.endTime) {
        const blockStart = timeToMinutes(String(block.startTime).slice(0, 5));
        const blockEnd = timeToMinutes(String(block.endTime).slice(0, 5));
        if (slotMin >= blockStart && slotMin < blockEnd) {
          return false;
        }
      }
    }

    return true;
  });

  return available;
}
