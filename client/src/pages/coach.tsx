import { type FormEvent, useState } from 'react';
import { CircleUserRound, Unlink } from 'lucide-react';
import { linkCoachInputSchema } from '@forma/shared';
import { useLinkCoach, useMyCoaches, useRemoveLink } from '@/hooks/use-coaching';
import { EmptyBlock, ErrorBlock, LoadingBlock, PageIntro } from '@/components/page-states';
import { toast } from '@/hooks/use-toast';

export default function CoachPage() {
  const coachesQuery = useMyCoaches();
  const linkCoach = useLinkCoach();
  const removeLink = useRemoveLink();
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = linkCoachInputSchema.safeParse({ code });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Enter a valid code.');
      return;
    }
    linkCoach.mutate(parsed.data, {
      onSuccess: () => {
        setCode('');
        toast({ title: 'Connected', description: "You're now sharing your training with that coach." });
      },
      onError: (error) => setFormError(error instanceof Error ? error.message : 'Could not connect. Check the code and try again.'),
    });
  };

  const handleRemove = (linkId: string, displayName: string) => {
    removeLink.mutate(linkId, {
      onSuccess: () => toast({ title: 'Disconnected', description: `${displayName} can no longer see your training.` }),
      onError: () => toast({ variant: 'destructive', title: "Couldn't disconnect", description: 'Please try again.' }),
    });
  };

  return (
    <div>
      <PageIntro eyebrow="Your coach" title="Train with a coach in your corner.">
        Enter the code your coach shares with you to let them see your streak, volume, and adherence — never your login or password.
      </PageIntro>

      <section className="mb-6 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7">
        <h2 className="forma-display text-xl font-semibold tracking-[-.03em]">Connect to a coach</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="e.g. 7K2QXP"
            maxLength={12}
            data-testid="input-coach-code"
            className="min-h-11 flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 font-mono text-sm uppercase tracking-[.08em] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.25)]"
          />
          <button
            type="submit"
            disabled={linkCoach.isPending || !code}
            data-testid="button-connect-coach"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-50"
          >
            {linkCoach.isPending ? 'Connecting…' : 'Connect'}
          </button>
        </form>
        {formError && (
          <p role="alert" className="mt-3 rounded-xl bg-[hsl(var(--destructive)/.1)] px-3 py-2.5 text-sm text-[hsl(var(--destructive-text))]">
            {formError}
          </p>
        )}
      </section>

      <section>
        <h2 className="forma-display mb-4 text-xl font-semibold tracking-[-.03em]">Your coaches</h2>
        {coachesQuery.isLoading && <LoadingBlock label="Loading your coaches" />}
        {coachesQuery.isError && <ErrorBlock onRetry={() => coachesQuery.refetch()} />}
        {coachesQuery.data && coachesQuery.data.length === 0 && (
          <EmptyBlock title="No coach connected yet">Enter a code above once your coach shares one with you.</EmptyBlock>
        )}
        {coachesQuery.data && coachesQuery.data.length > 0 && (
          <div className="space-y-3">
            {coachesQuery.data.map((coach) => (
              <div
                key={coach.linkId}
                data-testid={`row-coach-${coach.linkId}`}
                className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
                  <CircleUserRound size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{coach.displayName}</p>
                  <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{coach.email}</p>
                </div>
                <button
                  onClick={() => handleRemove(coach.linkId, coach.displayName)}
                  disabled={removeLink.isPending}
                  aria-label={`Disconnect from ${coach.displayName}`}
                  data-testid={`button-remove-coach-${coach.linkId}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--destructive-text))] disabled:opacity-50"
                >
                  <Unlink size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
