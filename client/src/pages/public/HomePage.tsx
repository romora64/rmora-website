import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Download, ExternalLink, ArrowRight, BookOpen } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateShort } from '@/lib/utils';
import { hero } from '@/data/hero';
import { services } from '@/data/services';
import { SEOHead } from '@/components/SEOHead';

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'accent' | 'muted'> = {
  Artículo: 'default',
  Ponencia: 'accent',
  Investigación: 'secondary',
  Blog: 'muted',
};

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="border-b border-border">
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Texto */}
          <div>
            <img
              src="/logo-rmora.png"
              alt="R.Mora"
              className="h-32 w-32 rounded-full object-cover mb-6"
            />
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
              Ronald Mora-Barboza
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-6">
              {hero.headline}
            </h1>
            <div className="w-12 h-px bg-accent mb-6" />
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              {hero.subtitle}
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-10">
              {hero.paragraph}{' '}
              <strong className="text-foreground">{hero.paragraphEmphasis}</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              {hero.ctas.map((cta) => (
                <Link key={cta.href} href={cta.href}>
                  {cta.href === '/services' ? (
                    <Button size="lg">{cta.label}</Button>
                  ) : (
                    <Button variant="outline" size="lg">{cta.label}</Button>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Foto */}
          <div className="hidden md:flex justify-end">
            <div className="relative">
              <img
                src="/rmora.jpg"
                alt="Ronald Mora-Barboza"
                className="w-72 h-[22rem] object-cover object-top border border-border shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Cómo puedo ayudar ────────────────────────────────────────────────────────

function HowICanHelp() {
  return (
    <section className="border-b border-border">
      <div className="container py-16">
        <div className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Servicios</p>
          <h2 className="font-serif text-3xl text-foreground">{services.intro}</h2>
        </div>
        <div className="academic-line mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {services.areas.map((area) => (
            <div key={area.title} className="academic-card">
              <h3 className="font-serif text-lg text-foreground mb-3">{area.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{area.description}</p>
            </div>
          ))}
        </div>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="gap-1">
            Ver proyectos y portafolio
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

// ─── Publicaciones recientes ──────────────────────────────────────────────────

function RecentPublications() {
  const { data: publications = [], isLoading } = trpc.publications.getRecent.useQuery({ limit: 3 });

  if (isLoading) {
    return (
      <section className="border-b border-border">
        <div className="container py-16 flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </section>
    );
  }

  if (publications.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Producción académica
            </p>
            <h2 className="font-serif text-3xl text-foreground">Publicaciones recientes</h2>
          </div>
          <Link href="/publications">
            <Button variant="ghost" size="sm" className="gap-1 hidden sm:flex">
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="academic-line mb-8" />

        <div className="space-y-0 divide-y divide-border border-t border-b border-border">
          {publications.map((pub) => (
            <article key={pub.id} className="py-5 flex flex-col sm:flex-row sm:items-center gap-3 group">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge variant={typeBadgeVariant[pub.type] ?? 'muted'}>{pub.type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDateShort(pub.publishedAt)}</span>
                </div>
                <h3 className="font-serif text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                  {pub.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={pub.storageLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <ExternalLink className="h-3 w-3" />
                    Ver PDF
                  </Button>
                </a>
                <a href={pub.storageLink} download>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link href="/publications">
            <Button variant="outline" className="w-full gap-2">
              <BookOpen className="h-4 w-4" />
              Ver todas las publicaciones
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Contacto ─────────────────────────────────────────────────────────────

function ContactCTA() {
  return (
    <section>
      <div className="container py-16 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">¿Hablamos?</p>
        <h2 className="font-serif text-3xl text-foreground mb-6">Establezcamos contacto</h2>
        <div className="w-12 h-px bg-accent mx-auto mb-8" />
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/contact?tab=meeting">
            <Button size="lg">Solicitar reunión</Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Enviar mensaje</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonios ──────────────────────────────────────────────────────────────

function Testimonials() {
  const { data: items = [] } = trpc.testimonials.getActive.useQuery();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % items.length), 10000);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[current];

  return (
    <section className="border-b border-border bg-muted/30">
      <div className="container py-16">
        <div className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Opiniones</p>
          <h2 className="font-serif text-3xl text-foreground">Lo que dicen colegas y estudiantes</h2>
        </div>
        <div className="academic-line mb-10" />

        <div className="max-w-2xl mx-auto text-center">
          {/* Comilla decorativa */}
          <span className="font-serif text-6xl leading-none text-accent select-none">"</span>

          {/* Texto con transición suave */}
          <p
            key={item.id}
            className="font-serif text-lg text-foreground leading-relaxed mt-2 mb-8 transition-opacity duration-500"
          >
            {item.opinion}
          </p>

          {/* Atribución */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.relation}
              {item.institution && ` · ${item.institution}`}
            </p>
          </div>

          {/* Indicadores */}
          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground'
                  }`}
                  aria-label={`Testimonio ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function HomePage() {
  return (
    <>
      <SEOHead path="/" />
      <HeroSection />
      <HowICanHelp />
      <RecentPublications />
      <Testimonials />
      <ContactCTA />
    </>
  );
}
