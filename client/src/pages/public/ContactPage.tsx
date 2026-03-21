import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Calendar, Clock, CheckCircle, Video } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DateInput } from '@/components/ui/date-input';
import { ToastProvider, ToastViewport, Toast, useToast } from '@/components/ui/toast';
import { formatDateShort } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const messageSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  email: z.string().email('Correo electrónico inválido').max(255),
  subject: z.string().min(1, 'El asunto es requerido').max(500),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(5000),
});

const meetingSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  email: z.string().email('Correo electrónico inválido').max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha válida'),
  time: z.string().min(1, 'Selecciona un horario'),
  notes: z.string().max(2000).optional(),
});

type MessageValues = z.infer<typeof messageSchema>;
type MeetingValues = z.infer<typeof meetingSchema>;

// ─── Formulario de mensaje ────────────────────────────────────────────────────

function ContactForm() {
  const [sent, setSent] = useState(false);
  const { toast, toasts, dismiss } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageValues>({ resolver: zodResolver(messageSchema) });

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      reset();
      setSent(true);
    },
    onError: (err) => {
      toast('error', 'Error al enviar', err.message);
    },
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h3 className="font-serif text-xl text-foreground">Mensaje enviado</h3>
        <p className="text-muted-foreground max-w-sm">
          Gracias por su mensaje. Me pondré en contacto a la brevedad.
        </p>
        <Button variant="outline" onClick={() => setSent(false)}>
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <>
      <ToastProvider>
        <form onSubmit={handleSubmit((v) => sendMutation.mutate(v))} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="msg-name">Nombre *</Label>
              <Input id="msg-name" placeholder="Su nombre completo" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg-email">Correo electrónico *</Label>
              <Input id="msg-email" type="email" placeholder="correo@ejemplo.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-subject">Asunto *</Label>
            <Input id="msg-subject" placeholder="¿Sobre qué desea consultarme?" {...register('subject')} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-message">Mensaje *</Label>
            <Textarea
              id="msg-message"
              placeholder="Escriba su mensaje aquí..."
              className="min-h-[140px]"
              {...register('message')}
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </form>

        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            title={t.title}
            description={t.description}
            open
            onOpenChange={(open) => !open && dismiss(t.id)}
          />
        ))}
        <ToastViewport />
      </ToastProvider>
    </>
  );
}

// ─── Selector de slots ────────────────────────────────────────────────────────

interface SlotPickerProps {
  date: string;
  selectedTime: string;
  onSelect: (time: string) => void;
}

function SlotPicker({ date, selectedTime, onSelect }: SlotPickerProps) {
  const { data, isLoading, error } = trpc.meetings.getAvailableSlots.useQuery(
    { date },
    { enabled: !!date, staleTime: 30_000 },
  );

  if (!date) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin" />
        Consultando disponibilidad...
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive py-2">
        Error al cargar los horarios disponibles.
      </p>
    );
  }

  const slots = data?.slots ?? [];

  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-3">
        No hay horarios disponibles para el {formatDateShort(date)}. Por favor elige otra fecha.
      </p>
    );
  }

  /** Convierte 'HH:MM' → '9:00 a. m.' */
  function formatSlot(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const d = new Date(2000, 0, 1, h, m);
    return d.toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onSelect(slot)}
          className={[
            'px-3 py-1.5 text-sm border transition-colors',
            selectedTime === slot
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:border-primary hover:text-primary',
          ].join(' ')}
        >
          {formatSlot(slot)}
        </button>
      ))}
    </div>
  );
}

// ─── Formulario de reunión ────────────────────────────────────────────────────

function MeetingForm() {
  const [confirmed, setConfirmed] = useState<{ date: string; time: string; meetLink: string } | null>(null);
  const { toast, toasts, dismiss } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeetingValues>({ resolver: zodResolver(meetingSchema) });

  const selectedDate = watch('date');
  const selectedTime = watch('time');

  const requestMutation = trpc.meetings.requestMeeting.useMutation({
    onSuccess: (data) => {
      setConfirmed({
        date: selectedDate,
        time: selectedTime,
        meetLink: data.meetLink,
      });
      reset();
    },
    onError: (err) => {
      toast('error', 'No se pudo agendar la reunión', err.message);
    },
  });

  if (confirmed) {
    function formatSlotDisplay(t: string): string {
      const [h, m] = t.split(':').map(Number);
      const d = new Date(2000, 0, 1, h, m);
      return d.toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-5 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h3 className="font-serif text-xl text-foreground">Reunión confirmada</h3>
        <div className="space-y-1 text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDateShort(confirmed.date)}
          </p>
          <p className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            {formatSlotDisplay(confirmed.time)} (hora de Costa Rica)
          </p>
          {confirmed.meetLink && (
            <p className="flex items-center justify-center gap-2 mt-2">
              <Video className="h-4 w-4" />
              <a
                href={confirmed.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Enlace de Google Meet
              </a>
            </p>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">
          Recibirá un correo de confirmación con todos los detalles.
        </p>
        <Button variant="outline" onClick={() => setConfirmed(null)}>
          Agendar otra reunión
        </Button>
      </div>
    );
  }

  return (
    <>
      <ToastProvider>
        <form
          onSubmit={handleSubmit((v) =>
            requestMutation.mutate({
              date: v.date,
              time: v.time,
              attendeeName: v.name,
              attendeeEmail: v.email,
              notes: v.notes,
            }),
          )}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="meet-name">Nombre *</Label>
              <Input id="meet-name" placeholder="Su nombre completo" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meet-email">Correo electrónico *</Label>
              <Input id="meet-email" type="email" placeholder="correo@ejemplo.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          {/* Selector de fecha */}
          <div className="space-y-1.5">
            <Label>Fecha *</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateInput
                  value={field.value ?? ''}
                  onChange={(iso) => {
                    field.onChange(iso);
                    setValue('time', ''); // resetear slot al cambiar fecha
                  }}
                  placeholder="DD-MM-YYYY"
                  className="max-w-[180px]"
                />
              )}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          {/* Selector de slot */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Horario disponible *
              </Label>
              <Controller
                control={control}
                name="time"
                render={({ field }) => (
                  <SlotPicker
                    date={selectedDate}
                    selectedTime={field.value ?? ''}
                    onSelect={(t) => field.onChange(t)}
                  />
                )}
              />
              {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
            </div>
          )}

          {/* Notas opcionales */}
          <div className="space-y-1.5">
            <Label htmlFor="meet-notes">
              Tema de la reunión{' '}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Textarea
              id="meet-notes"
              placeholder="Describa brevemente el motivo de la reunión..."
              className="min-h-[100px]"
              {...register('notes')}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDate || !selectedTime}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Agendando...' : 'Solicitar reunión'}
            </Button>
            {selectedDate && selectedTime && (
              <p className="text-xs text-muted-foreground">
                {formatDateShort(selectedDate)} a las{' '}
                {(() => {
                  const [h, m] = selectedTime.split(':').map(Number);
                  return new Date(2000, 0, 1, h, m).toLocaleTimeString('es-CR', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                })()}
              </p>
            )}
          </div>
        </form>

        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            title={t.title}
            description={t.description}
            open
            onOpenChange={(open) => !open && dismiss(t.id)}
          />
        ))}
        <ToastViewport />
      </ToastProvider>
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function ContactPage() {
  const defaultTab =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('tab') === 'meeting'
      ? 'meeting'
      : 'message';

  return (
    <div className="section-container py-16">
      <SEOHead
        title="Contacto"
        description="Envíe un mensaje o solicite una reunión virtual. Respondo en 1 a 2 días hábiles."
        path="/contact"
      />
      <div className="max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="mb-10">
          <h1 className="font-serif text-4xl text-foreground mb-3">Contacto</h1>
          <div className="academic-line mb-4" />
          <p className="text-muted-foreground leading-relaxed">
            Puede enviarme un mensaje o agendar una reunión virtual directamente en mi calendario.
            Respondo en un plazo de 1 a 2 días hábiles.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full sm:w-auto mb-2">
            <TabsTrigger value="message" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Enviar mensaje
            </TabsTrigger>
            <TabsTrigger value="meeting" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Solicitar reunión
            </TabsTrigger>
          </TabsList>

          <TabsContent value="message">
            <ContactForm />
          </TabsContent>

          <TabsContent value="meeting">
            {/* Info de disponibilidad */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6 p-3 bg-muted/40 border border-border">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Lunes a viernes
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                9:00 a. m. – 4:30 p. m.
              </span>
              <span className="flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Google Meet · 30 minutos
              </span>
            </div>
            <MeetingForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
