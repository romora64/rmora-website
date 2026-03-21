import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { services } from '@/data/services';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';

export function ServicesPage() {
  return (
    <div className="section-container py-16">
      <SEOHead
        title="Conferencias y asesoría"
        description="Conferencias especializadas en IA y asesoría en educación superior para universidades, organizaciones y equipos directivos."
        path="/services"
      />
      <div className="max-w-3xl mx-auto">

        {/* Encabezado */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-6 mb-2">
            <h1 className="font-serif text-4xl text-foreground">Conferencias y asesoría</h1>
            <img
              src="/Conferencias.png"
              alt="Conferencias"
              className="h-28 w-auto object-contain shrink-0 opacity-90 rounded"
            />
          </div>
          <div className="academic-line mb-4" />
          <p className="text-xl text-muted-foreground">{services.intro}</p>
        </div>

        {/* Áreas de servicio */}
        <section className="mb-14 space-y-8">
          {services.areas.map((area) => (
            <div key={area.title} className="academic-card">
              <h2 className="font-serif text-xl text-foreground mb-3">{area.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{area.description}</p>
            </div>
          ))}
        </section>

        {/* Conferencias */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-foreground mb-4">{services.conferences.title}</h2>
          <div className="academic-line mb-6" />
          <ul className="space-y-3 mb-6">
            {services.conferences.topics.map((topic) => (
              <li key={topic} className="flex items-start gap-3">
                <span className="text-primary font-serif text-lg mt-0.5 shrink-0">–</span>
                <span className="text-foreground font-medium">{topic}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {services.conferences.audience}
          </p>
        </section>

        {/* Asesoría */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-foreground mb-4">{services.advisory.title}</h2>
          <div className="academic-line mb-5" />
          <p className="text-muted-foreground leading-relaxed">{services.advisory.description}</p>
        </section>

        {/* CTAs */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/contact?tab=meeting">
            <Button className="gap-2 w-full sm:w-auto">
              Solicitar una conferencia
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              Consultar sobre asesoría institucional
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Recursos para estudiantes — oculto hasta tener contenido */}
        {/* TODO: descomentar cuando haya contenido real
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-foreground mb-4">Recursos para estudiantes</h2>
          <div className="academic-line mb-5" />
          <ul className="space-y-2 text-muted-foreground">
            <li>– Guías breves para proyectos.</li>
            <li>– Recomendaciones de lectura.</li>
            <li>– Consejos sobre cómo seguir directrices en proyectos reales.</li>
            <li>– Preguntas frecuentes sobre uso responsable de IA en el estudio.</li>
          </ul>
        </section>
        */}

      </div>
    </div>
  );
}
