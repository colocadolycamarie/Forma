import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { signupInputSchema } from '@forma/shared';
import { useSignup } from '@/hooks/use-auth';
import { AuthLayout, FieldLabel, PasswordField, authInputClass } from '@/components/auth-layout';
import { ApiError } from '@/lib/api-client';

export default function SignupPage() {
  const [, navigate] = useLocation();
  const signup = useSignup();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = signupInputSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check your details and try again.');
      return;
    }

    signup.mutate(parsed.data, {
      onSuccess: () => navigate('/'),
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
      },
    });
  };

  return (
    <AuthLayout
      title="Start training"
      subtitle="Create your account — your training log, streaks, and history live here."
      footer={
        <>
          Already training with us?{' '}
          <Link href="/login" className="font-semibold text-[hsl(var(--foreground))] underline underline-offset-4" data-testid="link-go-login">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <FieldLabel htmlFor="displayName">Name</FieldLabel>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className={authInputClass}
            data-testid="input-display-name"
            required
          />
        </div>
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
        <div>
          <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} />
          <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">At least 8 characters.</p>
        </div>

        {formError && (
          <p role="alert" className="rounded-xl bg-[hsl(var(--destructive)/.1)] px-3 py-2.5 text-sm text-[hsl(var(--destructive-text))]">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={signup.isPending}
          data-testid="button-submit-signup"
          className="mt-2 min-h-11 w-full rounded-xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {signup.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
