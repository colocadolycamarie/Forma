import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AuthLayout, PasswordField } from '@/components/auth-layout';

/** Reads the reset token from the query string. In production this also
 * determines the expired/invalid-token state below via a real API check;
 * here it's treated as always-valid since there's no backend endpoint yet
 * for issuing/validating these tokens (see handoff notes). */
function useResetToken() {
  const [location] = useLocation();
  const query = location.includes('?') ? location.slice(location.indexOf('?')) : window.location.search;
  return new URLSearchParams(query).get('token');
}

export default function ResetPasswordPage() {
  const token = useResetToken();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const invalid = token === null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setDone(true);
  };

  if (invalid) {
    return (
      <AuthLayout
        title="This link has expired."
        subtitle="Reset links are only good for a little while, for your security."
        footer={
          <Link href="/forgot-password" className="font-semibold text-[hsl(var(--foreground))] underline underline-offset-4" data-testid="link-request-new-link">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Nothing to do here — head back and we'll send you a fresh one.</p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        title="Password updated."
        subtitle="Please sign in with your new password."
        footer={
          <Link href="/login" className="font-semibold text-[hsl(var(--foreground))] underline underline-offset-4" data-testid="link-continue-to-login">
            Continue to sign in
          </Link>
        }
      >
        <div className="rounded-xl bg-[hsl(var(--success)/.1)] px-3 py-2.5 text-sm text-[hsl(var(--success-text))]">You're all set.</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password." subtitle="Make it something you haven't used here before." footer={<>&nbsp;</>}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} />
        <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={8} />
        {error && (
          <p role="alert" className="rounded-xl bg-[hsl(var(--destructive)/.1)] px-3 py-2.5 text-sm text-[hsl(var(--destructive-text))]">
            {error}
          </p>
        )}
        <button
          type="submit"
          data-testid="button-submit-reset-password"
          className="shadow-stamp-sm hover:shadow-stamp-md mt-2 min-h-11 w-full rounded-xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-all duration-200 hover:-translate-y-0.5"
        >
          Update password
        </button>
      </form>
    </AuthLayout>
  );
}
