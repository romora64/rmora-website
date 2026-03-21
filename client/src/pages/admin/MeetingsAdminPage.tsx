import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarClock, ExternalLink, ChevronDown, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { formatDateShort } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MeetingStatus = 'pending' | 'completed' | 'cancelled';

const statusLabel: Record<MeetingStatus, string> = {
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const statusVariant: Record<MeetingStatus, 'default' | 'secondary' | 'muted' | 'accent'> = {
  pending: 'accent',
  completed: 'default',
  cancelled: 'muted',
};

const statusIcon: Record<MeetingStatus, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

// ─── Formato de hora ──────────────────────────────────────────────────────────

function formatTime(t: string | Date): string {
  const str = String(t).slice(0, 5);
  const [h, m] = str.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Modal de detalle / notas internas ────────────────────────────────────────

interface MeetingDetailModalProps {
  meeting: NonNullable<ReturnType<typeof useMeetingsList>['data']>[0] | null;
  open: boolean;
  onClose: () => void;
}

function useMeetingsList(statusFilter?: MeetingStatus) {
  return trpc.meetings.getAll.useQuery(statusFilter ? { status: statusFilter } : undefined);
}

function MeetingDetailModal({ meeting, open, onClose }: MeetingDetailModalProps) {
  const utils = trpc.useUtils();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ internalNotes: string }>({
    values: { internalNotes: meeting?.internalNotes ?? '' },
  });

  const notesMutation = trpc.meetings.updateInternalNotes.useMutation({
    onSuccess: () => {
      utils.meetings.getAll.invalidate();
      utils.meetings.getUpcoming.invalidate();
      onClose();
    },
  });

  if (!meeting) return null;

  const dateStr =
    String(meeting.date).slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle de reunión</DialogTitle>
          <DialogDescription>
            {meeting.attendeeName} · {formatDateShort(dateStr)} · {formatTime(meeting.time)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Asistente</p>
              <p className="font-medium">{meeting.attendeeName}</p>
              <p className="text-muted-foreground">{meeting.attendeeEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Estado</p>
              <Badge variant={statusVariant[meeting.status as MeetingStatus]}>
                {statusLabel[meeting.status as MeetingStatus]}
              </Badge>
            </div>
          </div>

          {meeting.meetLink && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Google Meet</p>
              <a
                href={meeting.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir enlace
              </a>
            </div>
          )}

          {meeting.notes && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Notas del solicitante</p>
              <p className="bg-muted/40 p-2 text-foreground">{meeting.notes}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit((v) =>
              notesMutation.mutate({ id: meeting.id, internalNotes: v.internalNotes }),
            )}
            className="space-y-2"
          >
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Notas internas
            </Label>
            <Textarea
              className="min-h-[80px]"
              placeholder="Notas visibles solo para el administrador..."
              {...register('internalNotes')}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>
                Cerrar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar notas'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function MeetingsAdminPage() {
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');
  const [detailMeeting, setDetailMeeting] = useState<NonNullable<ReturnType<typeof useMeetingsList>['data']>[0] | null>(null);

  const { data: meetings = [], isLoading } = trpc.meetings.getAll.useQuery(
    statusFilter !== 'all' ? { status: statusFilter } : undefined,
  );
  const utils = trpc.useUtils();

  const updateStatus = trpc.meetings.updateStatus.useMutation({
    onSuccess: () => {
      utils.meetings.getAll.invalidate();
      utils.meetings.getUpcoming.invalidate();
      utils.meetings.getDashboardStats.invalidate();
    },
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-serif text-2xl text-foreground">Reuniones</h1>
            <p className="text-sm text-muted-foreground">{meetings.length} reunión{meetings.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>

        {/* Filtro */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as MeetingStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="academic-line" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay reuniones{statusFilter !== 'all' ? ` con estado "${statusLabel[statusFilter as MeetingStatus]}"` : ''}.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Fecha</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Hora</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Asistente</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Estado</th>
                <th className="pb-3 font-medium text-muted-foreground uppercase text-xs tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {meetings.map((meeting) => {
                const dateStr = String(meeting.date).slice(0, 10);

                return (
                  <tr key={meeting.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 whitespace-nowrap text-foreground">
                      {formatDateShort(dateStr)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                      {formatTime(meeting.time)}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{meeting.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">{meeting.attendeeEmail}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusVariant[meeting.status as MeetingStatus]} className="gap-1">
                        {statusIcon[meeting.status as MeetingStatus]}
                        {statusLabel[meeting.status as MeetingStatus]}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Detalle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => setDetailMeeting(meeting)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Ver
                        </Button>

                        {/* Cambio rápido de estado */}
                        {meeting.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-xs text-green-700 hover:text-green-700 hover:bg-green-500/10"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: meeting.id, status: 'completed' })}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Completar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: meeting.id, status: 'cancelled' })}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancelar
                            </Button>
                          </>
                        )}

                        {/* Meet link */}
                        {meeting.meetLink && (
                          <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center h-8 px-2 text-xs text-primary hover:underline gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Meet
                          </a>
                        )}

                        {/* Reactivar si fue cancelada */}
                        {meeting.status === 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: meeting.id, status: 'pending' })}
                          >
                            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MeetingDetailModal
        meeting={detailMeeting}
        open={!!detailMeeting}
        onClose={() => setDetailMeeting(null)}
      />
    </div>
  );
}
