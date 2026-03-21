import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Calendar,
  Mail,
  Clock,
  BookOpen,
  FolderOpen,
  MessageSquareQuote,
  Menu,
  X,
  ExternalLink,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/meetings', label: 'Reuniones', icon: Calendar },
  { href: '/admin/messages', label: 'Mensajes', icon: Mail },
  { href: '/admin/availability', label: 'Disponibilidad', icon: Clock },
  { href: '/admin/publications', label: 'Publicaciones', icon: BookOpen },
  { href: '/admin/resources', label: 'Proyectos', icon: FolderOpen },
  { href: '/admin/testimonials', label: 'Testimonios', icon: MessageSquareQuote },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  onClick?: () => void;
}) {
  const [location] = useLocation();
  const isActive = exact ? location === href : location.startsWith(href);

  return (
    <Link href={href} onClick={onClick}>
      <span
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
          isActive
            ? 'text-primary font-medium border-b-2 border-primary'
            : 'text-secondary hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
    </Link>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      window.location.href = '/admin/login';
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Barra de navegación superior ─── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-8">
          {/* Logo */}
          <Link href="/">
            <span className="font-serif text-lg font-semibold text-primary tracking-tight">
              rmora.org
            </span>
          </Link>

          <Separator orientation="vertical" className="h-5" />

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Acciones — desktop */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <span className="text-sm max-w-[140px] truncate">{user?.email}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                    <ExternalLink className="h-4 w-4" />
                    Ver sitio
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Botón hamburguesa — mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* ─── Menú mobile ─── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            <Separator className="my-2" />
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                {user?.email}
              </span>
              <ThemeToggle />
            </div>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              Ver sitio
            </a>
          </div>
        )}
      </header>

      {/* ─── Contenido principal ─── */}
      <main className="px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
