import { useEffect, useState } from 'react';
import { useLocation, Redirect } from 'wouter';
import { Chrome, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

const errorMessages: Record<string, string> = {
  google_denied: 'Acceso denegado por Google. Intenta de nuevo.',
  state_mismatch: 'Error de seguridad en la autenticación. Intenta de nuevo.',
  unauthorized: 'Esta cuenta de Google no tiene permisos de administración.',
  auth_failed: 'Error al autenticar. Intenta de nuevo.',
};

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error && errorMessages[error]) {
      setErrorMsg(errorMessages[error]);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/admin" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="academic-card">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl text-primary mb-1">rmora.org</h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">
              Panel de Administración
            </p>
          </div>

          <Separator className="mb-6" />

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botón Google */}
          <Button
            className="w-full gap-3"
            size="lg"
            onClick={() => {
              window.location.href = '/api/auth/google';
            }}
          >
            <Chrome className="h-5 w-5" />
            Iniciar sesión con Google
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Acceso restringido al administrador del sitio.
          </p>
        </div>
      </div>
    </div>
  );
}
