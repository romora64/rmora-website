import { useState } from 'react';
import { MessageSquare, Eye, Archive, CornerUpLeft, Mail } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MessageStatus = 'unread' | 'read' | 'replied' | 'archived';

const statusLabel: Record<MessageStatus, string> = {
  unread: 'Sin leer',
  read: 'Leído',
  replied: 'Respondido',
  archived: 'Archivado',
};

const statusVariant: Record<MessageStatus, 'default' | 'secondary' | 'muted' | 'accent'> = {
  unread: 'accent',
  read: 'secondary',
  replied: 'default',
  archived: 'muted',
};

// ─── Modal de detalle ─────────────────────────────────────────────────────────

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface MessageDetailModalProps {
  message: Message | null;
  open: boolean;
  onClose: () => void;
}

function MessageDetailModal({ message, open, onClose }: MessageDetailModalProps) {
  const utils = trpc.useUtils();
  const updateStatus = trpc.messages.updateStatus.useMutation({
    onSuccess: () => {
      utils.messages.getAll.invalidate();
      utils.messages.getUnreadCount.invalidate();
    },
  });

  if (!message) return null;

  function handleStatus(status: MessageStatus) {
    if (!message) return;
    updateStatus.mutate({ id: message.id, status });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-8">{message.subject}</DialogTitle>
          <DialogDescription>
            {message.name} &lt;{message.email}&gt;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/40 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {message.message}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[message.status as MessageStatus]}>
              {statusLabel[message.status as MessageStatus]}
            </Badge>

            <div className="flex gap-2 ml-auto">
              {message.status !== 'replied' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={updateStatus.isPending}
                  onClick={() => handleStatus('replied')}
                >
                  <CornerUpLeft className="h-3.5 w-3.5" />
                  Marcar respondido
                </Button>
              )}
              {message.status !== 'archived' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={updateStatus.isPending}
                  onClick={() => handleStatus('archived')}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archivar
                </Button>
              )}
              <a
                href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
                className="inline-flex items-center gap-1 h-8 px-3 text-sm border border-border hover:bg-muted transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Responder por email
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function MessagesAdminPage() {
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all');
  const [detailMessage, setDetailMessage] = useState<Message | null>(null);

  const { data: messages = [], isLoading } = trpc.messages.getAll.useQuery(
    statusFilter !== 'all' ? { status: statusFilter } : undefined,
  );
  const utils = trpc.useUtils();

  const updateStatus = trpc.messages.updateStatus.useMutation({
    onSuccess: () => {
      utils.messages.getAll.invalidate();
      utils.messages.getUnreadCount.invalidate();
    },
  });

  function openDetail(msg: Message) {
    // Marcar como leído automáticamente al abrir
    if (msg.status === 'unread') {
      updateStatus.mutate({ id: msg.id, status: 'read' });
    }
    setDetailMessage(msg);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-serif text-2xl text-foreground">Mensajes</h1>
            <p className="text-sm text-muted-foreground">
              {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as MessageStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="unread">Sin leer</SelectItem>
            <SelectItem value="read">Leídos</SelectItem>
            <SelectItem value="replied">Respondidos</SelectItem>
            <SelectItem value="archived">Archivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="academic-line" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay mensajes{statusFilter !== 'all' ? ` con estado "${statusLabel[statusFilter as MessageStatus]}"` : ''}.</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={[
                'py-4 flex items-start gap-4 cursor-pointer hover:bg-muted/30 transition-colors px-2 -mx-2',
                msg.status === 'unread' ? 'font-medium' : '',
              ].join(' ')}
              onClick={() => openDetail(msg)}
            >
              {/* Indicador no leído */}
              <div className="pt-1 shrink-0">
                {msg.status === 'unread' ? (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                ) : (
                  <div className="w-2 h-2" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground">{msg.name}</span>
                  <span className="text-muted-foreground text-xs">{msg.email}</span>
                  <Badge
                    variant={statusVariant[msg.status as MessageStatus]}
                    className="ml-auto text-xs"
                  >
                    {statusLabel[msg.status as MessageStatus]}
                  </Badge>
                </div>
                <p className="text-sm text-foreground mt-0.5 truncate">{msg.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{msg.message}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1 text-xs"
                onClick={(e) => { e.stopPropagation(); openDetail(msg); }}
              >
                <Eye className="h-3.5 w-3.5" />
                Ver
              </Button>
            </div>
          ))}
        </div>
      )}

      <MessageDetailModal
        message={detailMessage}
        open={!!detailMessage}
        onClose={() => setDetailMessage(null)}
      />
    </div>
  );
}
