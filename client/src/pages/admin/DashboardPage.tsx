import { Link } from 'wouter';
import {
  LayoutDashboard,
  CalendarClock,
  MessageSquare,
  BookOpen,
  Clock,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { formatDateShort } from '@/lib/utils';

// ─── Tarjeta de stat ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="academic-card flex items-start gap-4 group">
      <div className="text-primary opacity-70 group-hover:opacity-100 transition-opacity mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-serif text-3xl text-primary mt-1">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }
  return content;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string | Date): string {
  const str = String(t).slice(0, 5);
  const [h, m] = str.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('es-CR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: stats } = trpc.meetings.getDashboardStats.useQuery();
  const { data: unread } = trpc.messages.getUnreadCount.useQuery();
  const { data: publications = [] } = trpc.publications.getAll.useQuery();
  const { data: upcoming = [] } = trpc.meetings.getUpcoming.useQuery();
  const { data: recentMessages = [] } = trpc.messages.getAll.useQuery({ status: 'unread' });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-serif text-2xl text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vista general del sitio</p>
        </div>
      </div>

      <div className="academic-line" />

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Reuniones pendientes"
          value={stats?.pending ?? '—'}
          icon={<CalendarClock className="h-5 w-5" />}
          href="/admin/meetings"
        />
        <StatCard
          label="Mensajes sin leer"
          value={unread?.count ?? '—'}
          icon={<MessageSquare className="h-5 w-5" />}
          href="/admin/messages"
        />
        <StatCard
          label="Publicaciones"
          value={publications.length}
          icon={<BookOpen className="h-5 w-5" />}
          href="/admin/publications"
        />
        <StatCard
          label="Reuniones este mes"
          value={stats?.thisMonth ?? '—'}
          icon={<CalendarClock className="h-5 w-5" />}
        />
      </div>

      {/* Próximas reuniones + Mensajes sin leer */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas reuniones */}
        <div className="academic-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-foreground">Próximas reuniones</h2>
            <Link
              href="/admin/meetings"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Ver todas
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay reuniones próximas pendientes.</p>
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map((m) => {
                const dateStr = String(m.date).slice(0, 10);
                return (
                  <div key={m.id} className="py-3 flex items-start gap-3">
                    <div className="text-primary shrink-0 mt-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(dateStr)} · {formatTime(m.time)}
                      </p>
                    </div>
                    {m.meetLink && (
                      <a
                        href={m.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        Meet
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mensajes sin leer */}
        <div className="academic-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-foreground">Mensajes sin leer</h2>
            <Link
              href="/admin/messages"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Ver todos
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay mensajes sin leer.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentMessages.slice(0, 5).map((msg) => (
                <div key={msg.id} className="py-3 flex items-start gap-3">
                  <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{msg.name}</p>
                      <Badge variant="accent" className="text-xs shrink-0">Sin leer</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
