import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  opinion: z.string().min(1, 'La opinión es requerida'),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  relation: z.string().min(1, 'La relación es requerida').max(100),
  institution: z.string().max(255).optional(),
  displayOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Formulario ───────────────────────────────────────────────────────────────

function TestimonialForm({
  open,
  onClose,
  editingId,
  defaultValues,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  editingId?: number;
  defaultValues?: Partial<FormValues>;
  onSuccess: () => void;
}) {
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      opinion: '',
      name: '',
      relation: '',
      institution: '',
      displayOrder: 0,
      active: true,
    },
  });

  const createMutation = trpc.testimonials.create.useMutation({
    onSuccess: () => { utils.testimonials.getAll.invalidate(); onSuccess(); onClose(); },
  });
  const updateMutation = trpc.testimonials.update.useMutation({
    onSuccess: () => { utils.testimonials.getAll.invalidate(); onSuccess(); onClose(); },
  });

  const isEdit = !!editingId;

  // Reset form when opening
  useState(() => {
    if (open) {
      reset({
        opinion: defaultValues?.opinion ?? '',
        name: defaultValues?.name ?? '',
        relation: defaultValues?.relation ?? '',
        institution: defaultValues?.institution ?? '',
        displayOrder: defaultValues?.displayOrder ?? 0,
        active: defaultValues?.active ?? true,
      });
    }
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      institution: values.institution || undefined,
    };
    if (isEdit) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const error = createMutation.error?.message ?? updateMutation.error?.message;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEdit ? 'Editar testimonio' : 'Nuevo testimonio'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Opinión *</Label>
            <Textarea rows={4} {...register('opinion')} />
            {errors.opinion && <p className="text-xs text-destructive">{errors.opinion.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Relación *</Label>
              <Input placeholder="Docente, Estudiante..." {...register('relation')} />
              {errors.relation && <p className="text-xs text-destructive">{errors.relation.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Institución <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input {...register('institution')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Orden de visualización</Label>
              <Input type="number" min={0} {...register('displayOrder')} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('active')} className="h-4 w-4 rounded" />
                <span className="text-sm">Visible en el sitio</span>
              </label>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function TestimonialsAdminPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ id: number; values: Partial<FormValues> } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const { data: items = [], isLoading } = trpc.testimonials.getAll.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.testimonials.delete.useMutation({
    onSuccess: () => { utils.testimonials.getAll.invalidate(); setDeleteId(null); },
  });
  const toggleMutation = trpc.testimonials.update.useMutation({
    onSuccess: () => utils.testimonials.getAll.invalidate(),
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (item: (typeof items)[0]) => {
    setEditing({
      id: item.id,
      values: {
        opinion: item.opinion,
        name: item.name,
        relation: item.relation,
        institution: item.institution ?? '',
        displayOrder: item.displayOrder,
        active: item.active,
      },
    });
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Testimonios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Opiniones de colegas y estudiantes que aparecen en la página de inicio.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo testimonio
        </Button>
      </div>

      {successMsg && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No hay testimonios registrados.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'rounded border p-4 bg-card',
                !item.active && 'opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed line-clamp-3 mb-2">
                    "{item.opinion}"
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <Badge variant="secondary">{item.relation}</Badge>
                    {item.institution && (
                      <span className="text-xs text-muted-foreground">{item.institution}</span>
                    )}
                    <span className="text-xs text-muted-foreground">Orden: {item.displayOrder}</span>
                    {!item.active && <Badge variant="muted">Oculto</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={item.active ? 'Ocultar' : 'Mostrar'}
                    onClick={() => toggleMutation.mutate({ id: item.id, active: !item.active })}
                  >
                    {item.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TestimonialForm
        open={formOpen}
        onClose={closeForm}
        editingId={editing?.id}
        defaultValues={editing?.values}
        onSuccess={() => showSuccess(editing ? 'Testimonio actualizado.' : 'Testimonio creado.')}
      />

      <Dialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar testimonio?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
