import { Download, FileText, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';
import { formatDateShort } from '@/lib/utils';

const projectsIntro =
  'Mis proyectos combinan IA clásica, seguridad conceptual, automatización y administración de sistemas. Están diseñados para enseñar, documentar y resolver problemas contemporáneos con rigor y claridad.';

export function ProjectsPage() {
  const { data: resources = [], isLoading } = trpc.resources.getAll.useQuery();

  return (
    <div className="section-container py-16">
      <SEOHead
        title="Proyectos y portafolio"
        description="Proyectos de IA clásica, seguridad conceptual, automatización y administración de sistemas. Frameworks descargables para algoritmos genéticos y colonia de hormigas."
        path="/projects"
      />
      <div className="max-w-3xl mx-auto">

        {/* Encabezado */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-6 mb-2">
            <h1 className="font-serif text-4xl text-foreground">Proyectos y portafolio</h1>
            <img
              src="/Proyectos.png"
              alt="Proyectos"
              className="h-28 w-auto object-contain shrink-0 opacity-90 rounded"
            />
          </div>
          <div className="academic-line mb-4" />
          <p className="text-muted-foreground leading-relaxed">{projectsIntro}</p>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No hay recursos disponibles aún.</p>
        ) : (
          <div className="space-y-10">
            {resources.map((resource, idx) => {
              const Icon = resource.resourceType === 'Documento' ? FileText : Download;
              return (
                <article key={resource.id} className="border-b border-border pb-10 last:border-0 last:pb-0">
                  {/* Número + título */}
                  <div className="flex items-start gap-4 mb-4">
                    <span className="font-serif text-3xl text-primary/30 leading-none shrink-0 select-none">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h2 className="font-serif text-xl text-foreground leading-snug">{resource.title}</h2>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge
                          variant={resource.resourceType === 'Software' ? 'default' : resource.resourceType === 'Concepto' ? 'muted' : 'secondary'}
                          className="text-xs"
                        >
                          {resource.resourceType}
                        </Badge>
                        {resource.license && (
                          <Badge variant="muted" className="text-xs">{resource.license}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDateShort(String(resource.publicationDate))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contexto y objetivo */}
                  {(resource.context || resource.objective) && (
                    <div className="ml-14 mb-3 space-y-1 text-sm text-muted-foreground">
                      {resource.context && (
                        <p><span className="font-medium text-foreground">Contexto:</span> {resource.context}</p>
                      )}
                      {resource.objective && (
                        <p><span className="font-medium text-foreground">Objetivo:</span> {resource.objective}</p>
                      )}
                    </div>
                  )}

                  {/* Descripción */}
                  <p className="ml-14 text-muted-foreground leading-relaxed mb-4">
                    {resource.description}
                  </p>

                  {/* Enlace de descarga */}
                  {resource.link && (
                    <div className="ml-14">
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                          <Icon className="h-3.5 w-3.5" />
                          {resource.resourceType === 'Documento' ? 'Ver documento' : 'Descargar'}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Button>
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
