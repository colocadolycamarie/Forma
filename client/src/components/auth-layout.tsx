import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormaMark } from '@/components/forma-mark';
import { DuotonePhoto } from '@/components/duotone-photo';

/**
 * Fixed-viewport, two-column auth shell — photo panel on the left, entry
 * form on the right, never the page itself. Only the form column scrolls,
 * and only if a given screen's content genuinely can't fit; the page as a
 * whole doesn't. The tagline sits low on the photo as a CSS grid row (not
 * a flex row): the divider column then stretches to exactly match the
 * height of the taller of the heading/paragraph automatically, instead of
 * a guessed pixel height that can drift out of sync with the text.
 */
export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[hsl(var(--background))] lg:grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.05fr_1fr]">
      {/* Mark pinned to the viewport corner, above both columns, always
          clickable back to the marketing site. */}
      <div className="fixed left-5 top-5 z-50 text-[hsl(var(--sidebar-foreground))] lg:left-8 lg:top-8">
        <FormaMark size="lg" />
      </div>

      {/* Photo panel — plain rectangle, no clip-path. */}
      <div className="relative h-[32vh] w-full shrink-0 overflow-hidden sm:h-[38vh] lg:h-full">
        <DuotonePhoto
          src="https://images.unsplash.com/photo-1649068610862-ed43a08442cf?w=1400&q=80&auto=format&fit=crop"
          alt="Weight plates and a barbell rack in a quiet gym"
          tint="sidebar"
          scrim="full"
          className="h-full w-full"
        />

        {/* Tagline, resting low on the photo. Grid, not flex: the middle
            column (the rule) stretches to the row's natural height by
            default, so it always spans exactly as tall as the heading or
            paragraph beside it — never floats free of the text. */}
        <div className="stagger-in absolute inset-x-0 bottom-0 grid grid-cols-[7rem_1px_1fr] gap-x-4 p-6 text-[hsl(var(--sidebar-foreground))] sm:grid-cols-[8rem_1px_1fr] sm:gap-x-5 sm:p-8 lg:p-10">
          <h2 className="forma-display text-lg font-semibold leading-[1.15] tracking-[-.03em] sm:text-xl">
            Show up. We'll keep <span className="text-[hsl(var(--sidebar-primary))]">the record.</span>
          </h2>
          <div className="bg-[hsl(var(--sidebar-foreground)/.3)]" />
          <p className="text-xs leading-5 text-[hsl(var(--sidebar-foreground)/.75)] sm:text-sm sm:leading-6">
            Every session, set, and streak — logged plainly, kept honestly. No hype, no leaderboard. Just what you did.
          </p>
        </div>
      </div>

      {/* Entry form column — the only element allowed to scroll, and only
          if a screen's own content overflows it. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-8 sm:px-10 lg:px-16 xl:px-20">
        <div className="w-full max-w-[420px] py-2">
          <div className="stagger-in mb-6">
            <p className="forma-mono mb-2.5 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--primary-text))]">Entry form</p>
            <h1 className="forma-display text-3xl font-semibold leading-[.98] tracking-[-.06em] sm:text-4xl">{title}</h1>
            <p className="mt-2.5 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">{subtitle}</p>
          </div>
          {children}
          <p className="mt-6 border-t border-dashed border-[hsl(var(--border))] pt-4 text-sm text-[hsl(var(--muted-foreground))]">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">
      {children}
    </label>
  );
}

export const authInputClass =
  'w-full min-h-11 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 text-sm text-[hsl(var(--foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.25)]';

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${authInputClass} pr-11`}
          data-testid="input-password"
          required
          minLength={minLength}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          data-testid="button-toggle-password-visibility"
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
