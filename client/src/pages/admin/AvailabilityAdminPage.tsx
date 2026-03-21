import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarOff, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DateInput } from '@/components/ui/date-input';
import { formatDateShort } from '@/lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const blockSchema = z
  .object({
    blockType: z.enum(['full_day', 'time_range']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    reason: z.string().max(500).optional(),
    recurring: z.enum(['none', 'weekly', 'daily', 'weekday']).default('none'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .refine(
    (d) => {
      if (d.blockType === 'time_range') return !!d.startTime && !!d.endTime;
      return true;
    },
    { message: 'Indica hora de inicio y fin para el bloqueo por franja.', path: ['startTime'] },
  )
  .refine(
    (d) => {
      if (d.recurring === 'weekday') return !!d.endDate;
      return true;
    },
    { message: 'Indica la fecha de fin para el bloqueo recurrente.', path: ['endDate'] },
  );

type BlockValues = z.infer<typeof blockSchema>;

// ─── Formulario de nuevo bloque ───────────────────────────────────────────────

interface BlockFormProps {
  open: boolean;
  onClose: () => void;
}

function BlockForm({ open, onClose }: BlockFormProps) {
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlockValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: { blockType: 'full_day', recurring: 'none' },
  });

  const blockType = watch('blockType');
  const recurring = watch('recurring');

  const createMutation = trpc.availability.create.useMutation({
    onSuccess: () => {
      utils.availability.getAll.invalidate();
      reset();
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo bloqueo de disponibilidad</DialogTitle>
          <DialogDescription>
            Bloquea un día completo o una franja horaria específica.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          {/* Tipo de bloqueo */}
          <div className="space-y-1.5">
            <Label>Tipo de bloqueo *</Label>
            <Controller
              control={control}
              name="blockType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Día completo</SelectItem>
                    <SelectItem value="time_range">Franja horaria</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label>Fecha *</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateInput value={field.value ?? ''} onChange={field.onChange} className="max-w-[180px]" />
              )}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          {/* Horas (solo si es franja) */}
          {blockType === 'time_range' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Inicio *</Label>
                <Input type="time" {...register('startTime')} />
                {errors.startTime && (
                  <p className="text-xs text-destructive">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Fin *</Label>
                <Input type="time" {...register('endTime')} />
              </div>
            </div>
          )}

          {/* Recurrencia */}
          <div className="space-y-1.5">
            <Label>Recurrencia</Label>
            <Controller
              control={control}
              name="recurring"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin recurrencia (solo esa fecha)</SelectItem>
                    <SelectItem value="weekly">Esta semana (lun–vie de esa semana)</SelectItem>
                    <SelectItem value="weekday">Día recurrente (ese día de la semana, con fecha fin)</SelectItem>
                    <SelectItem value="daily">Permanente (todos los días hábiles)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Fecha fin — solo para weekday */}
          {recurring === 'weekday' && (
            <div className="space-y-1.5">
              <Label>Fecha de fin *</Label>
              <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <DateInput value={field.value ?? ''} onChange={field.onChange} className="max-w-[180px]" />
                )}
              />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label>
              Motivo <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input placeholder="Ej: Congreso, feriado..." {...register('reason')} />
          </div>

          {createMutation.error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {createMutation.error.message}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear bloqueo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AvailabilityAdminPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: blocks = [], isLoading } = trpc.availability.getAll.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.availability.delete.useMutation({
    onSuccess: () => utils.availability.getAll.invalidate(),
  });

  function getDayName(dateVal: Date | string): string {
    const str = dateVal instanceof Date ? dateVal.toISOString().slice(0, 10) : String(dateVal).slice(0, 10);
    const [y, m, d] = str.split('-').map(Number);
    return DAY_NAMES[new Date(y, m - 1, d).getDay()];
  }

  function getDateStr(dateVal: Date | string): string {
    return dateVal instanceof Date
      ? dateVal.toISOString().slice(0, 10)
      : String(dateVal).slice(0, 10);
  }

  function formatBlockTime(t: Date | string | null): string {
    if (!t) return '';
    return String(t).slice(0, 5);
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <CalendarOff className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-serif text-2xl text-foreground">Disponibilidad</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de bloqueos de horario
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo bloqueo
        </Button>
      </div>

      <div className="academic-line" />

      {/* Info base */}
      <div className="mt-6 p-4 bg-muted/40 border border-border text-sm text-muted-foreground space-y-1">
        <p>Horario base: <strong className="text-foreground">Lunes a viernes · 9:00 a. m. – 4:30 p. m. · Slots de 30 min</strong></p>
        <p>Los bloqueos aquí definidos eliminan slots del formulario de solicitud de reuniones.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarOff className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay bloqueos configurados.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Fecha</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Tipo</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Franja</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Recurrencia</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Motivo</th>
                <th className="pb-3 font-medium text-muted-foreground uppercase text-xs tracking-wide text-right">Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blocks.map((block) => {
                const dateStr = getDateStr(block.date);
                return (
                  <tr key={block.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className="font-medium text-foreground">{formatDateShort(dateStr)}</span>
                      <span className="text-xs text-muted-foreground ml-1">({getDayName(block.date)})</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={block.blockType === 'full_day' ? 'default' : 'secondary'}>
                        {block.blockType === 'full_day' ? 'Día completo' : 'Franja'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {block.blockType === 'time_range'
                        ? `${formatBlockTime(block.startTime)} – ${formatBlockTime(block.endTime)}`
                        : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      {block.recurring === 'weekly' ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                          Esta semana
                        </span>
                      ) : block.recurring === 'weekday' ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                          {DAY_NAMES[new Date(getDateStr(block.date)).getDay()]} recurrente
                          {block.endDate && (
                            <span className="ml-1">hasta {formatDateShort(getDateStr(block.endDate))}</span>
                          )}
                        </span>
                      ) : block.recurring === 'daily' ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                          Permanente
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Una vez</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground max-w-[180px] truncate">
                      {block.reason ?? '—'}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate({ id: block.id })}
                        title="Eliminar bloqueo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <BlockForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
