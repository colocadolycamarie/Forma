import { CompassIcon } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] px-6">
      <div className="w-full max-w-md rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]">
          <CompassIcon size={22} />
        </div>
        <p className="forma-mono text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--primary-text))]">404</p>
        <h1 className="forma-display mt-3 text-2xl font-semibold tracking-[-.04em]">This page stepped out.</h1>
        <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          The page you're looking for doesn't exist, or may have moved.
        </p>
        <Link
          href="/"
          data-testid="link-not-found-home"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[hsl(var(--foreground))] px-5 text-sm font-semibold text-[hsl(var(--background))]"
        >
          Back to today
        </Link>
      </div>
    </div>
  );
}
