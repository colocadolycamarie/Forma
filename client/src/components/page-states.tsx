import { CircleAlert, Dumbbell, LoaderCircle } from 'lucide-react';
import { type ReactNode } from 'react';

export function PageIntro({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="stagger-in">
        <p className="forma-mono mb-3 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--primary-text))]">{eyebrow}</p>
        <h1 className="forma-display text-4xl font-semibold tracking-[-.06em] text-[hsl(var(--foreground))] sm:text-5xl">{title}</h1>
        {children && <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingBlock({ label = 'Finding your rhythm' }: { label?: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" role="status" aria-live="polite">
      <div className="mb-4 h-1 w-16 origin-left rounded-full bg-[hsl(var(--primary))]" style={{ animation: 'pulse-line 1.2s ease-in-out infinite' }} />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
    </div>
  );
}

export function ErrorBlock({ onRetry, label = 'We missed a beat.' }: { onRetry?: () => void; label?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.08)] p-6 text-center" role="alert">
      <CircleAlert className="mb-3 text-[hsl(var(--accent))]" size={24} />
      <p className="forma-display text-lg font-semibold">{label}</p>
      <p className="mt-1 max-w-xs text-sm text-[hsl(var(--muted-foreground))]">Try again and we’ll get you back on track.</p>
      {onRetry && (
        <button onClick={onRetry} data-testid="button-retry" className="mt-5 min-h-10 rounded-xl bg-[hsl(var(--foreground))] px-4 text-sm font-semibold text-[hsl(var(--background))]">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]">
        <Dumbbell size={20} />
      </div>
      <p className="forma-display text-lg font-semibold">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">{children}</p>
      {action}
    </div>
  );
}

export function Metric({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'mint' | 'orange';
}) {
  const toneClass =
    tone === 'mint'
      ? 'border-[hsl(var(--primary)/.32)] bg-[hsl(var(--primary)/.1)]'
      : tone === 'orange'
        ? 'border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.08)]'
        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]';
  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <p className="forma-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="forma-display mt-3 text-3xl font-semibold tracking-[-.06em]">{value}</p>
      {detail && <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{detail}</p>}
    </div>
  );
}

export function SavingLabel({ active, label = 'Saving' }: { active: boolean; label?: string }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
      <LoaderCircle size={13} className="animate-spin" />
      {label}
    </span>
  );
}
