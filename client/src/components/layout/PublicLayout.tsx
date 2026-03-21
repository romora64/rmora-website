import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Inicio', exact: true },
  { href: '/about', label: 'Sobre Mí' },
  { href: '/services', label: 'Conferencias' },
  { href: '/publications', label: 'Publicaciones' },
  { href: '/projects', label: 'Proyectos' },
  { href: '/contact', label: 'Contacto' },
];

function NavLink({
  href,
  label,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  exact?: boolean;
  onClick?: () => void;
}) {
  const [location] = useLocation();
  const isActive = exact ? location === href : location.startsWith(href);

  return (
    <Link href={href} onClick={onClick}>
      <span
        className={cn(
          'text-sm transition-colors px-1 py-1',
          isActive
            ? 'text-primary font-medium border-b border-primary'
            : 'text-secondary hover:text-foreground',
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="container flex h-14 items-center gap-6">
          <Link href="/">
            <span className="flex items-center gap-2.5">
              <img src="/logo-rmora.png" alt="R.Mora" className="h-10 w-10 rounded-full object-cover" />
              <span className="font-serif text-lg font-semibold text-primary tracking-tight hidden sm:inline">
                Ronald Mora
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 ml-2">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="flex-1" />
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-8">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ronald Mora-Barboza. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
