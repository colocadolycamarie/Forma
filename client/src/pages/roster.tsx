import { Check, Copy, Unlink, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useCoachCode, useRemoveLink, useRoster } from '@/hooks/use-coaching';
import { EmptyBlock, ErrorBlock, LoadingBlock, Metric, PageIntro } from '@/components/page-states';
import { toast } from '@/hooks/use-toast';

export default function RosterPage() {
  const codeQuery = useCoachCode();
  const rosterQuery = useRoster();
  const removeLink = useRemoveLink();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!codeQuery.data) return;
    try {
      await navigator.clipboard.writeText(codeQuery.data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: "Couldn't copy", description: 'Copy the code manually instead.' });
    }
  };

  const handleRemove = (linkId: string, displayName: string) => {
    removeLink.mutate(linkId, {
      onSuccess: () => toast({ title: 'Removed', description: `${displayName} is no longer on your roster.` }),
      onError: () => toast({ variant: 'destructive', title: "Couldn't remove", description: 'Please try again.' }),
    });
  };

  return (
    <div>
      <PageIntro eyebrow="Coach view" title="Your roster.">
        Athletes who connect using your code show up here, with their real training numbers.
      </PageIntro>

      <section className="mb-6 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7">
        <h2 className="forma-display text-xl font-semibold tracking-[-.03em]">Your coach code</h2>
        <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">Share this with an athlete — they enter it under "Your coach" to connect.</p>
        <div className="mt-4 flex items-center gap-3">
          {codeQuery.isLoading && <span className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</span>}
          {codeQuery.isError && <ErrorBlock onRetry={() => codeQuery.refetch()} label="Couldn't load your code." />}
          {codeQuery.data && (
            <>
              <span data-testid="text-coach-code" className="forma-mono rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-lg font-bold tracking-[.2em]">
                {codeQuery.data.code}
              </span>
              <button
                onClick={handleCopy}
                data-testid="button-copy-coach-code"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 text-sm font-semibold hover:border-[hsl(var(--primary))]"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="forma-display mb-4 text-xl font-semibold tracking-[-.03em]">Athletes</h2>
        {rosterQuery.isLoading && <LoadingBlock label="Loading your roster" />}
        {rosterQuery.isError && <ErrorBlock onRetry={() => rosterQuery.refetch()} />}
        {rosterQuery.data && rosterQuery.data.length === 0 && (
          <EmptyBlock title="No athletes yet">Share your coach code above — once someone connects, their training shows up here.</EmptyBlock>
        )}
        {rosterQuery.data && rosterQuery.data.length > 0 && (
          <div className="space-y-3">
            {rosterQuery.data.map((athlete) => (
              <div
                key={athlete.linkId}
                data-testid={`row-athlete-${athlete.linkId}`}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
                    <UsersRound size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{athlete.displayName}</p>
                    <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{athlete.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(athlete.linkId, athlete.displayName)}
                    disabled={removeLink.isPending}
                    aria-label={`Remove ${athlete.displayName} from roster`}
                    data-testid={`button-remove-athlete-${athlete.linkId}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--destructive-text))] disabled:opacity-50"
                  >
                    <Unlink size={16} />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Metric label="Streak" value={`${athlete.streakDays}d`} />
                  <Metric label="Weekly volume" value={`${athlete.weeklyVolume.toLocaleString()} kg`} />
                  <Metric label="Adherence" value={`${athlete.adherencePercent}%`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
