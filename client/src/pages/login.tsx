import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { loginInputSchema } from '@forma/shared';
import { useLogin } from '@/hooks/use-auth';
import { AuthLayout, FieldLabel, PasswordField, authInputClass } from '@/components/auth-layout';
import { ApiError } from '@/lib/api-client';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = loginInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check your details and try again.');
      return;
    }

    login.mutate(parsed.data, {
      onSuccess: () => navigate('/'),
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
      },
    });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up your training where you left off."
      footer={
        <>
          New to Forma?{' '}
          <Link href="/signup" className="font-semibold text-[hsl(var(--foreground))] underline underline-offset-4" data-testid="link-go-signup">
            Create an account
          </Link>
        </>
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
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />

        {formError && (
          <p role="alert" className="rounded-xl bg-[hsl(var(--destructive)/.1)] px-3 py-2.5 text-sm text-[hsl(var(--destructive-text))]">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          data-testid="button-submit-login"
          className="mt-2 min-h-11 w-full rounded-xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
