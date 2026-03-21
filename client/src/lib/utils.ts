import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseDateSafe(date: string | Date): Date {
  // Para objetos Date y strings ISO (ej. "2026-03-18T00:00:00.000Z"),
  // extraer la parte de fecha en UTC para evitar que UTC-6 muestre el día anterior.
  if (date instanceof Date) {
    const [y, m, d] = date.toISOString().slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // Extraer YYYY-MM-DD de cualquier formato que empiece con una fecha ISO
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(date)?.[1];
  if (dateOnly) {
    const [y, m, d] = dateOnly.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(date);
}

export function formatDate(date: string | Date): string {
  return parseDateSafe(date).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  return parseDateSafe(date).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}
