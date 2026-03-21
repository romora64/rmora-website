import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Plus, Pencil, Trash2, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatDateShort } from '@/lib/utils';
import { DateInput } from '@/components/ui/date-input';

// ─── Tipos ────────────────────────────────────────────────────────────────────

const TYPES = ['Artículo', 'Ponencia', 'Investigación', 'Blog'] as const;
type PublicationType = (typeof TYPES)[number];

const formSchema = z.object({
  type: z.enum(TYPES, { required_error: 'Selecciona un tipo' }),
  title: z.string().min(1, 'El título es requerido').max(500),
  description: z.string().max(5000).optional(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha'),
  storageLink: z.string().url('Ingresa una URL válida (https://...)').max(500),
});

type FormValues = z.infer<typeof formSchema>;

const typeBadgeVariant: Record<PublicationType, 'default' | 'secondary' | 'accent' | 'muted'> = {
  Artículo: 'default',
  Ponencia: 'accent',
  Investigación: 'secondary',
  Blog: 'muted',
};

// ─── Formulario modal ─────────────────────────────────────────────────────────

interface PublicationFormProps {
  open: boolean;
  onClose: () => void;
  editingId?: number | null;
  defaultValues?: Partial<FormValues>;
  onSuccess: () => void;
}

function PublicationForm({ open, onClose, editingId, defaultValues, onSuccess }: PublicationFormProps) {
  const utils = trpc.useUtils();
  const isEditing = !!editingId;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: defaultValues?.type,
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      publishedAt: defaultValues?.publishedAt ?? '',
      storageLink: defaultValues?.storageLink ?? '',
    },
  });

  // Sincronizar form con defaultValues cada vez que se abre el diálogo
  useEffect(() => {
    if (open) {
      reset({
        type: defaultValues?.type,
        title: defaultValues?.title ?? '',
        description: defaultValues?.description ?? '',
        publishedAt: defaultValues?.publishedAt ?? '',
        storageLink: defaultValues?.storageLink ?? '',
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMutation = trpc.publications.create.useMutation({
    onSuccess: () => {
      utils.publications.getAll.invalidate();
      utils.publications.getRecent.invalidate();
      reset();
      onSuccess();
      onClose();
    },
  });

  const updateMutation = trpc.publications.update.useMutation({
    onSuccess: () => {
      utils.publications.getAll.invalidate();
      utils.publications.getRecent.invalidate();
      onSuccess();
      onClose();
    },
  });

  const onSubmit = (values: FormValues) => {
    if (isEditing && editingId) {
      updateMutation.mutate({ id: editingId, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

  const error = createMutation.error?.message ?? updateMutation.error?.message;
  const selectedType = watch('type');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar publicación' : 'Nueva publicación'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los campos y guarda los cambios.' : 'Completa los campos para agregar una nueva publicación.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Select
              value={selectedType}
              onValueChange={(val) => setValue('type', val as PublicationType, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo..." />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input placeholder="Título de la publicación" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Textarea
              placeholder="Resumen o descripción breve..."
              className="min-h-[80px]"
              {...register('description')}
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label>Fecha de publicación *</Label>
            <Controller
              control={control}
              name="publishedAt"
              render={({ field }) => (
                <DateInput value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.publishedAt && <p className="text-xs text-destructive">{errors.publishedAt.message}</p>}
          </div>

          {/* Enlace */}
          <div className="space-y-1.5">
            <Label>URL del documento (PDF) *</Label>
            <Input
              type="url"
              placeholder="https://drive.google.com/..."
              {...register('storageLink')}
            />
            {errors.storageLink && <p className="text-xs text-destructive">{errors.storageLink.message}</p>}
          </div>

          {/* Error del servidor */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear publicación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diálogo de confirmación ──────────────────────────────────────────────────

function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar publicación</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar <strong>"{title}"</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function PublicationsAdminPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<{
    id: number;
    values: FormValues;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: publications = [], isLoading } = trpc.publications.getAll.useQuery();

  const deleteMutation = trpc.publications.delete.useMutation({
    onSuccess: () => {
      utils.publications.getAll.invalidate();
      utils.publications.getRecent.invalidate();
      setDeleteTarget(null);
      showSuccess('Publicación eliminada.');
    },
  });

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function openEdit(pub: (typeof publications)[0]) {
    // publishedAt puede llegar como "2026-03-18T12:00:00.000Z" — extraer solo YYYY-MM-DD
    const publishedAt = String(pub.publishedAt).slice(0, 10);
    setEditingPublication({
      id: pub.id,
      values: {
        type: pub.type,
        title: pub.title,
        description: pub.description ?? '',
        publishedAt,
        storageLink: pub.storageLink,
      },
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPublication(null);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-serif text-2xl text-foreground">Publicaciones</h1>
            <p className="text-sm text-muted-foreground">
              {publications.length} publicación{publications.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingPublication(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nueva publicación
        </Button>
      </div>

      <div className="academic-line" />

      {/* Notificación de éxito */}
      {successMsg && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 p-3 bg-green-500/10 border border-green-500/20 mb-4 animate-fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : publications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay publicaciones aún.</p>
          <p className="text-sm mt-1">Crea la primera con el botón de arriba.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Tipo</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Título</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Fecha</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Enlace</th>
                <th className="pb-3 font-medium text-muted-foreground uppercase text-xs tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {publications.map((pub) => (
                <tr key={pub.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4">
                    <Badge variant={typeBadgeVariant[pub.type as PublicationType] ?? 'muted'}>
                      {pub.type}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <span className="line-clamp-2 font-medium text-foreground">{pub.title}</span>
                    {pub.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5 block">
                        {pub.description}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                    {formatDateShort(pub.publishedAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <a
                      href={pub.storageLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver PDF
                    </a>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(pub)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget({ id: pub.id, title: pub.title })}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <PublicationForm
        open={formOpen}
        onClose={closeForm}
        editingId={editingPublication?.id}
        defaultValues={editingPublication?.values}
        onSuccess={() => showSuccess(editingPublication ? 'Publicación actualizada.' : 'Publicación creada.')}
      />

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate({ id: deleteTarget.id })}
          title={deleteTarget.title}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
