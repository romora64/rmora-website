import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderOpen, Plus, Pencil, Trash2, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
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
import { DateInput } from '@/components/ui/date-input';
import { formatDateShort } from '@/lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255),
  resourceType: z.enum(['Documento', 'Software', 'Concepto'], { required_error: 'Selecciona un tipo' }),
  publicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha'),
  description: z.string().min(1, 'La descripción es requerida'),
  context: z.string().optional(),
  objective: z.string().optional(),
  license: z.string().optional(),
  link: z.string().url('Ingresa una URL válida').optional().or(z.literal('')),
}).refine(
  (d) => !d.link || !!d.license,
  { message: 'Se requiere licencia cuando hay enlace de descarga.', path: ['license'] },
);

type FormValues = z.infer<typeof formSchema>;

// ─── Formulario modal ─────────────────────────────────────────────────────────

interface ResourceFormProps {
  open: boolean;
  onClose: () => void;
  editingId?: number | null;
  defaultValues?: Partial<FormValues>;
  onSuccess: () => void;
}

function ResourceForm({ open, onClose, editingId, defaultValues, onSuccess }: ResourceFormProps) {
  const utils = trpc.useUtils();
  const { data: licenses = [] } = trpc.licenses.getAll.useQuery();
  const isEditing = !!editingId;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      publicationDate: '',
      context: '',
      objective: '',
      license: '',
      link: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: defaultValues?.title ?? '',
        resourceType: defaultValues?.resourceType,
        publicationDate: defaultValues?.publicationDate ?? '',
        description: defaultValues?.description ?? '',
        context: defaultValues?.context ?? '',
        objective: defaultValues?.objective ?? '',
        license: defaultValues?.license ?? '__none__',
        link: defaultValues?.link ?? '',
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const link = watch('link');

  const createMutation = trpc.resources.create.useMutation({
    onSuccess: () => { utils.resources.getAll.invalidate(); reset(); onSuccess(); onClose(); },
  });

  const updateMutation = trpc.resources.update.useMutation({
    onSuccess: () => { utils.resources.getAll.invalidate(); onSuccess(); onClose(); },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      link: values.link || undefined,
      license: values.license === '__none__' ? undefined : values.license || undefined,
      context: values.context || undefined,
      objective: values.objective || undefined,
    };
    if (isEditing && editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const error = createMutation.error?.message ?? updateMutation.error?.message;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar recurso' : 'Nuevo recurso'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los campos y guarda los cambios.' : 'Completa los campos para agregar un nuevo recurso.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input placeholder="Nombre corto del recurso" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Controller
              control={control}
              name="resourceType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Documento">Documento</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Concepto">Concepto</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.resourceType && <p className="text-xs text-destructive">{errors.resourceType.message}</p>}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label>Fecha de publicación *</Label>
            <Controller
              control={control}
              name="publicationDate"
              render={({ field }) => (
                <DateInput value={field.value} onChange={field.onChange} className="max-w-[180px]" />
              )}
            />
            {errors.publicationDate && <p className="text-xs text-destructive">{errors.publicationDate.message}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label>Descripción *</Label>
            <Textarea placeholder="Descripción del recurso..." className="min-h-[80px]" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {/* Contexto */}
          <div className="space-y-1.5">
            <Label>Contexto <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input placeholder="Contexto o motivación..." {...register('context')} />
          </div>

          {/* Objetivo */}
          <div className="space-y-1.5">
            <Label>Objetivo <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input placeholder="Objetivo del recurso..." {...register('objective')} />
          </div>

          {/* Enlace */}
          <div className="space-y-1.5">
            <Label>Enlace de descarga <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input type="url" placeholder="https://drive.google.com/..." {...register('link')} />
            {errors.link && <p className="text-xs text-destructive">{errors.link.message}</p>}
          </div>

          {/* Licencia */}
          <div className="space-y-1.5">
            <Label>
              Licencia
              {link ? <span className="text-destructive ml-1 text-xs">*</span> : <span className="text-muted-foreground text-xs"> (requerida si tiene enlace)</span>}
            </Label>
            <Controller
              control={control}
              name="license"
              render={({ field }) => (
                <Select value={field.value ?? '__none__'} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Sin licencia" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin licencia</SelectItem>
                    {licenses.map((lic) => (
                      <SelectItem key={lic.code} value={lic.code}>{lic.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.license && <p className="text-xs text-destructive">{errors.license.message}</p>}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear recurso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirmación de borrado ──────────────────────────────────────────────────

function ConfirmDeleteDialog({ open, onClose, onConfirm, title, isPending }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar recurso</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar <strong>"{title}"</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function ResourcesAdminPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{ id: number; values: Partial<FormValues> } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: resources = [], isLoading } = trpc.resources.getAll.useQuery();

  const deleteMutation = trpc.resources.delete.useMutation({
    onSuccess: () => {
      utils.resources.getAll.invalidate();
      setDeleteTarget(null);
      showSuccess('Recurso eliminado.');
    },
  });

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function openEdit(res: (typeof resources)[0]) {
    setEditingResource({
      id: res.id,
      values: {
        title: res.title,
        resourceType: res.resourceType,
        publicationDate: String(res.publicationDate).slice(0, 10),
        description: res.description,
        context: res.context ?? '',
        objective: res.objective ?? '',
        license: res.license ?? '__none__',
        link: res.link ?? '',
      },
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingResource(null);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-serif text-2xl text-foreground">Proyectos y portafolio</h1>
            <p className="text-sm text-muted-foreground">
              {resources.length} recurso{resources.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingResource(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nuevo recurso
        </Button>
      </div>

      <div className="academic-line" />

      {successMsg && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 p-3 bg-green-500/10 border border-green-500/20 mb-4 mt-6 animate-fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />{successMsg}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground mt-6">
          <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay recursos aún.</p>
          <p className="text-sm mt-1">Crea el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Tipo</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Título</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Fecha</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Licencia</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground uppercase text-xs tracking-wide">Enlace</th>
                <th className="pb-3 font-medium text-muted-foreground uppercase text-xs tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4">
                    <Badge variant={res.resourceType === 'Software' ? 'default' : res.resourceType === 'Concepto' ? 'muted' : 'secondary'}>
                      {res.resourceType}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <span className="font-medium text-foreground line-clamp-1">{res.title}</span>
                    {res.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5 block">{res.description}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                    {formatDateShort(String(res.publicationDate))}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground text-xs">
                    {res.license ?? '—'}
                  </td>
                  <td className="py-3 pr-4">
                    {res.link ? (
                      <a href={res.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                        <ExternalLink className="h-3 w-3" />
                        Ver
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(res)} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget({ id: res.id, title: res.title })} title="Eliminar">
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

      <ResourceForm
        open={formOpen}
        onClose={closeForm}
        editingId={editingResource?.id}
        defaultValues={editingResource?.values}
        onSuccess={() => showSuccess(editingResource ? 'Recurso actualizado.' : 'Recurso creado.')}
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
