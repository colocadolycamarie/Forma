import { FormaMark } from '@/components/forma-mark';

export function SplashScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))]" role="status" aria-live="polite" aria-label="Loading Forma">
      <div className="animate-pulse">
        <FormaMark size="lg" asLink={false} />
      </div>
    </div>
  );
}
