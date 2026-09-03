import { type FormEvent, useState } from 'react';
import { Link } from 'wouter';
import { Stamp } from 'lucide-react';
import { AuthLayout, FieldLabel, authInputClass } from '@/components/auth-layout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Generic confirmation regardless of whether the account exists — never
    // confirm/deny account existence from this screen (spec §6/§7.1).
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your inbox."
        subtitle=""
        footer={
          <Link href="/login" className="font-semibold text-[hsl(var(--foreground))] underline underline-offset-4" data-testid="link-back-to-login">
            Back to sign in
          </Link>
        }
      >
        <div className="stagger-in flex flex-col items-center py-4 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary-text))] shadow-stamp-sm">
            <Stamp size={22} />
          </div>
          <p className="forma-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Sent</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            If <span className="font-semibold text-[hsl(var(--foreground))]">{email}</span> has a Forma account, a reset link is on its way.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send a link to reset it."
      footer={
        <Link href="/login" className="font-semibold text-[hsl(var(--foreground))] underline underline-offset-4" data-testid="link-back-to-login">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authInputClass}
            data-testid="input-email"
            required
          />
        </div>
        <button
          type="submit"
          data-testid="button-submit-forgot-password"
          className="shadow-stamp-sm hover:shadow-stamp-md mt-2 min-h-11 w-full rounded-xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-all duration-200 hover:-translate-y-0.5"
        >
          Send reset link
        </button>
      </form>
    </AuthLayout>
  );
}
