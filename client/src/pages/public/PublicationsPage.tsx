import { useState } from 'react';
import { FileText, Download, ExternalLink, ArrowUpDown, Filter } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateShort } from '@/lib/utils';

const TYPES = ['Artículo', 'Ponencia', 'Investigación', 'Blog'] as const;
type PublicationType = (typeof TYPES)[number];

const typeBadgeVariant: Record<PublicationType, 'default' | 'secondary' | 'accent' | 'muted'> = {
  Artículo: 'default',
  Ponencia: 'accent',
  Investigación: 'secondary',
  Blog: 'muted',
};

type OrderBy = 'publishedAt' | 'title' | 'type';
type Order = 'asc' | 'desc';

export function PublicationsPage() {
  const [typeFilter, setTypeFilter] = useState<PublicationType | 'all'>('all');
  const [orderBy, setOrderBy] = useState<OrderBy>('publishedAt');
  const [order, setOrder] = useState<Order>('desc');

  const { data: publications = [], isLoading } = trpc.publications.getAll.useQuery({
    type: typeFilter === 'all' ? undefined : typeFilter,
    orderBy,
    order,
  });

  const toggleOrder = () => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));

  return (
    <div className="section-container max-w-4xl">
      <SEOHead
        title="Publicaciones"
        description="Artículos, ponencias e investigaciones sobre inteligencia artificial, educación superior, ética profesional y sistemas de información."
        path="/publications"
      />
      {/* Encabezado */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Producción académica</p>
            <h1 className="font-serif text-4xl text-foreground">Publicaciones</h1>
          </div>
          <img
            src="/Publicaciones.png"
            alt="Publicaciones"
            className="h-28 w-auto object-contain shrink-0 opacity-90 rounded"
          />
        </div>
        <div className="academic-line" />
      </div>

      {/* Controles de filtro y orden */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Filtro por tipo */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs border transition-colors ${
                typeFilter === 'all'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
              }`}
            >
              Todos
            </button>
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs border transition-colors ${
                  typeFilter === t
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Ordenamiento */}
        <div className="flex items-center gap-2">
          <Select value={orderBy} onValueChange={(v) => setOrderBy(v as OrderBy)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publishedAt">Por fecha</SelectItem>
              <SelectItem value="title">Por título</SelectItem>
              <SelectItem value="type">Por tipo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={toggleOrder} title={order === 'desc' ? 'Descendente' : 'Ascendente'}>
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : publications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No se encontraron publicaciones{typeFilter !== 'all' ? ` de tipo "${typeFilter}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border border-t border-b border-border">
          {publications.map((pub) => (
            <PublicationRow key={pub.id} publication={pub} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6 text-right">
        {publications.length} resultado{publications.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function PublicationRow({ publication: pub }: { publication: {
  id: number;
  type: string;
  title: string;
  description: string | null;
  publishedAt: string;
  storageLink: string;
}}) {
  return (
    <article className="py-6 flex flex-col sm:flex-row sm:items-start gap-4 group">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant={typeBadgeVariant[pub.type as PublicationType] ?? 'muted'}>
            {pub.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDateShort(pub.publishedAt)}</span>
        </div>
        <h2 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
          {pub.title}
        </h2>
        {pub.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {pub.description}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={pub.storageLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver PDF"
        >
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Ver PDF
          </Button>
        </a>
        <a
          href={pub.storageLink}
          download
          title="Descargar PDF"
        >
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Descargar
          </Button>
        </a>
      </div>
    </article>
  );
}
