import { Download, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { about } from '@/data/about';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';

export function AboutPage() {
  return (
    <div className="section-container py-16">
      <SEOHead
        title="Sobre mí"
        description="Soy Ronald Mora-Barboza, profesor universitario y director de la Escuela de Ingeniería en Sistemas de la UACA. Especialista en IA, ética profesional y seguridad de los datos."
        path="/about"
      />
      <div className="max-w-3xl mx-auto">

        {/* Encabezado */}
        <div className="mb-10">
          <div className="flex items-start gap-6 mb-4">
            <img
              src="/logo-rmora.png"
              alt="R.Mora"
              className="h-36 w-36 rounded-full object-cover shrink-0 mt-1"
            />
            <div className="flex-1">
              <h1 className="font-serif text-4xl text-foreground mb-2">Sobre mí</h1>
              <p className="text-muted-foreground text-sm uppercase tracking-widest">{about.role}</p>
            </div>
            <img
              src="/IA.png"
              alt="Inteligencia Artificial"
              className="h-28 w-auto object-contain shrink-0 opacity-90 rounded"
            />
          </div>
          <div className="academic-line mb-4" />
        </div>

        {/* 1. Presentación */}
        <section className="mb-10">
          <p className="text-foreground leading-relaxed text-lg">{about.presentation}</p>
        </section>

        {/* 2. Origen y motivación */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-foreground mb-4">Origen y motivación</h2>
          <div className="academic-line mb-5" />
          <p className="text-muted-foreground leading-relaxed">{about.motivation}</p>
        </section>

        {/* 3. Filosofía de trabajo */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-foreground mb-4">Filosofía de trabajo</h2>
          <div className="academic-line mb-5" />
          <p className="font-serif text-xl text-primary mb-4 italic">{about.philosophy.headline}</p>
          <ul className="space-y-2">
            {about.philosophy.principles.map((p) => (
              <li key={p} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary mt-1 shrink-0">–</span>
                {p}
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Enfoque actual */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-foreground mb-4">Enfoque actual</h2>
          <div className="academic-line mb-5" />
          <p className="text-muted-foreground leading-relaxed">{about.currentFocus}</p>
        </section>

        {/* 5. Resumen profesional */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-foreground mb-4">Resumen profesional</h2>
          <div className="academic-line mb-5" />
          <ul className="space-y-2">
            {about.summary.map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary mt-1 shrink-0">–</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* CTAs */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <a href={about.cv.path} target="_blank" rel="noopener noreferrer" download={about.cv.filename}>
            <Button className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Descargar CV en PDF
            </Button>
          </a>
          <a href={about.cv.path} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <FileText className="h-4 w-4" />
              Ver CV
            </Button>
          </a>
          <Link href="/contact">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              Contactar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
