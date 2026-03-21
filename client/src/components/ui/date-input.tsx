import { useState, useEffect } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: string;       // YYYY-MM-DD (formato interno / API)
  onChange?: (value: string) => void; // emite YYYY-MM-DD cuando es válido, '' si no
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** YYYY-MM-DD → DD-MM-YYYY para mostrar al usuario */
function toDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

/** DD-MM-YYYY → YYYY-MM-DD para el API; '' si formato inválido */
function toIso(display: string): string {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(display)) return '';
  const [d, m, y] = display.split('-');
  return `${y}-${m}-${d}`;
}

/** Inserta guiones automáticamente mientras el usuario escribe */
function autoFormat(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/** YYYY-MM-DD → Date (local, sin offset de zona horaria) */
function isoToDate(iso: string): Date | undefined {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date → YYYY-MM-DD */
function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DateInput({
  value = '',
  onChange,
  placeholder = 'DD-MM-YYYY',
  className,
  disabled,
}: DateInputProps) {
  const [display, setDisplay] = useState(() => toDisplay(value));
  const [open, setOpen] = useState(false);

  // Sincroniza cuando el valor externo cambia (p.ej. al abrir edición)
  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = autoFormat(e.target.value);
    setDisplay(formatted);
    onChange?.(toIso(formatted));
  }

  function handleDaySelect(date: Date | undefined) {
    if (!date) return;
    const iso = dateToIso(date);
    setDisplay(toDisplay(iso));
    onChange?.(iso);
    setOpen(false);
  }

  const selectedDate = isoToDate(value);

  return (
    <div className={cn('relative flex items-center', className)}>
      <Input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleTextChange}
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
        className="pr-9 font-mono tracking-wider"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'absolute right-0 h-full px-2.5 flex items-center text-muted-foreground',
              'hover:text-foreground transition-colors',
              'focus:outline-none focus:ring-1 focus:ring-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            aria-label="Abrir selector de fecha"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            defaultMonth={selectedDate ?? new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
