import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { useCurrentUser } from '@/hooks/use-auth';
import { AuthLayout } from '@/components/auth-layout';
import { toast } from '@/hooks/use-toast';

/**
 * Verify email (spec §6/§7.1). Shown once right after Signup. There's no
 * real email-delivery or token-verification backend behind this yet —
 * that's a documented, known gap (it needs a DB column + a route, not
 * just UI, same category as the other UI-only flows already in this
 * codebase such as Change Password's toast). What this screen does do
 * honestly: it's non-blocking. The athlete can leave at any time and use
 * the app — this is a nudge, not a wall.
 */
const RESEND_COOLDOWN = 30;

export default function VerifyEmailPage() {
  const { data: user } = useCurrentUser();
  const [cooldown, setCooldown] = useState(0);

  const handleResend = () => {
    if (cooldown > 0) return;
    toast({ title: 'Verification email sent', description: user?.email ? `Sent to ${user.email}.` : undefined });
    setCooldown(RESEND_COOLDOWN);
    const interval = window.setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  return (
    <AuthLayout
      title="Check your inbox."
      subtitle="One quick step before you're fully set up."
      footer={
        <Link href="/" data-testid="link-continue-to-app" className="font-semibold text-[hsl(var(--primary-text))] hover:underline">
          Continue to your training →
        </Link>
      }
    >
      <div className="flex flex-col items-center py-2 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary-text))]">
          <MailCheck size={24} />
        </div>
        <p className="forma-mono mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--primary-text))]">Pending verification</p>
        <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          We've sent a confirmation link to <span className="font-semibold text-[hsl(var(--foreground))]">{user?.email ?? 'your email'}</span>. Nothing about your
          account is locked while you wait — log a session whenever you're ready.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          data-testid="button-resend-verification"
          className="mt-6 min-h-11 rounded-xl border border-[hsl(var(--border))] px-5 text-sm font-semibold hover:bg-[hsl(var(--muted))] disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </button>
      </div>
    </AuthLayout>
  );
}
