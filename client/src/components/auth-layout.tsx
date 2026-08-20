import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormaMark } from '@/components/forma-mark';

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[hsl(var(--background))]">
      <header className="px-6 py-6 sm:px-10 sm:py-8">
        <FormaMark size="lg" />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-2 sm:pb-16">
        <div className="w-full max-w-[420px]">
          <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-sm">
            <div className="stagger-in mb-7">
              <h1 className="forma-display text-2xl font-semibold tracking-[-.04em]">{title}</h1>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
            </div>
            {children}
            <p className="mt-6 border-t border-[hsl(var(--border))] pt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">{footer}</p>
          </div>
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
