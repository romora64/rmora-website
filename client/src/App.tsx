import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { ThemeProvider } from 'next-themes';
import { Switch, Route } from 'wouter';
import { trpc } from '@/lib/trpc';

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminGuard } from '@/components/layout/AdminGuard';

// Páginas públicas
import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ServicesPage } from '@/pages/public/ServicesPage';
import { ProjectsPage } from '@/pages/public/ProjectsPage';

// Páginas admin
import { LoginPage } from '@/pages/admin/LoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { PublicationsAdminPage } from '@/pages/admin/PublicationsAdminPage';
import { MeetingsAdminPage } from '@/pages/admin/MeetingsAdminPage';
import { MessagesAdminPage } from '@/pages/admin/MessagesAdminPage';
import { AvailabilityAdminPage } from '@/pages/admin/AvailabilityAdminPage';
import { ResourcesAdminPage } from '@/pages/admin/ResourcesAdminPage';
import { TestimonialsAdminPage } from '@/pages/admin/TestimonialsAdminPage';

import { PublicationsPage } from '@/pages/public/PublicationsPage';
import { ContactPage } from '@/pages/public/ContactPage';


function AppRoutes() {
  return (
    <Switch>
      {/* ─── Login (ruta pública del panel) ─── */}
      <Route path="/admin/login" component={LoginPage} />

      {/* ─── Panel admin (protegido) ─── */}
      <Route path="/admin" nest>
        <AdminGuard>
          <AdminLayout>
            <Switch>
              <Route path="/admin" component={DashboardPage} />
              <Route path="/admin/meetings" component={MeetingsAdminPage} />
              <Route path="/admin/messages" component={MessagesAdminPage} />
              <Route path="/admin/availability" component={AvailabilityAdminPage} />
              <Route path="/admin/publications" component={PublicationsAdminPage} />
              <Route path="/admin/resources" component={ResourcesAdminPage} />
              <Route path="/admin/testimonials" component={TestimonialsAdminPage} />
            </Switch>
          </AdminLayout>
        </AdminGuard>
      </Route>

      {/* ─── Sitio público ─── */}
      <Route>
        <PublicLayout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/services" component={ServicesPage} />
            <Route path="/publications" component={PublicationsPage} />
            <Route path="/projects" component={ProjectsPage} />
            <Route path="/contact" component={ContactPage} />
          </Switch>
        </PublicLayout>
      </Route>
    </Switch>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60, retry: 1 },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/trpc' })],
    }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AppRoutes />
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  );
}
