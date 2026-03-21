import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = ({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) => (
  <ToastPrimitive.Viewport
    className={cn(
      'fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm',
      className,
    )}
    {...props}
  />
);

export type ToastVariant = 'default' | 'success' | 'error';

interface ToastProps extends React.ComponentProps<typeof ToastPrimitive.Root> {
  variant?: ToastVariant;
  title: string;
  description?: string;
}

const icons: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="h-4 w-4 text-primary shrink-0" />,
  success: <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-destructive shrink-0" />,
};

export function Toast({ variant = 'default', title, description, className, ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        'flex items-start gap-3 p-4 bg-background border border-border shadow-md',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
        className,
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 min-w-0">
        <ToastPrimitive.Title className="text-sm font-medium text-foreground">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="text-xs text-muted-foreground mt-0.5">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

// ─── Hook simple para gestionar toasts ────────────────────────────────────────

import { useState, useCallback } from 'react';

interface ToastState {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, variant, title, description }]);
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
