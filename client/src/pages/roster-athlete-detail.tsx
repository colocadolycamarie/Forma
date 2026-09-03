import { ArrowLeft, UsersRound, Unlink } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { useRemoveLink, useRoster } from '@/hooks/use-coaching';
import { EmptyBlock, ErrorBlock, LoadingBlock, Metric, PageIntro } from '@/components/page-states';
import { toast } from '@/hooks/use-toast';

/**
 * Athlete detail (coach view) — spec §2.8/§6. Roster stayed a summary list
 * in the original build; this is the drill-in destination it always
 * needed. There's no per-exercise history endpoint scoped to a specific
 * athlete for a coach yet (RosterAthlete only carries streak/volume/
 * adherence), so this page is honest about that rather than faking a
 * chart — it presents the real numbers roster already has, just at
 * detail-page scale, and states plainly what's still to come.
 */
export default function AthleteDetailPage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [, navigate] = useLocation();
  const rosterQuery = useRoster();
  const removeLink = useRemoveLink();

  const athlete = rosterQuery.data?.find((entry) => entry.athleteId === athleteId);

  const handleRemove = () => {
    if (!athlete) return;
    removeLink.mutate(athlete.linkId, {
      onSuccess: () => {
        toast({ title: 'Removed', description: `${athlete.displayName} is no longer on your roster.` });
        navigate('/coach');
      },
      onError: () => toast({ variant: 'destructive', title: "Couldn't remove", description: 'Please try again.' }),
    });
  };

  return (
    <div>
      <Link href="/coach" data-testid="link-back-to-roster" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
        <ArrowLeft size={15} />
        Back to roster
      </Link>

      {rosterQuery.isLoading && (
        <>
          <PageIntro eyebrow="Coach view" title="Loading." />
          <LoadingBlock label="Finding this athlete" />
        </>
      )}

      {rosterQuery.isError && (
        <>
          <PageIntro eyebrow="Coach view" title="A small reset." />
          <ErrorBlock onRetry={() => rosterQuery.refetch()} />
        </>
      )}

      {rosterQuery.data && !athlete && (
        <EmptyBlock title="Not on your roster">This athlete isn't connected to you (anymore) — they may have unlinked, or the link has changed.</EmptyBlock>
      )}

      {athlete && (
        <>
          <PageIntro
            eyebrow="Coach view"
            title={athlete.displayName}
            action={
              <button
                onClick={handleRemove}
                disabled={removeLink.isPending}
                data-testid="button-remove-athlete-detail"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[hsl(var(--destructive)/.4)] px-4 text-sm font-semibold text-[hsl(var(--destructive-text))] hover:bg-[hsl(var(--destructive)/.08)] disabled:opacity-50"
              >
                <Unlink size={15} />
                {removeLink.isPending ? 'Removing…' : 'Remove from roster'}
              </button>
            }
          >
            {athlete.email} · connected since {new Date(athlete.linkedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </PageIntro>

          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="Current streak" value={`${athlete.streakDays}d`} tone="mint" detail="Consistent training days" />
            <Metric label="Weekly volume" value={`${athlete.weeklyVolume.toLocaleString()} kg`} detail="Across all logged sets" />
            <Metric
              label="Adherence"
              value={`${athlete.adherencePercent}%`}
              tone={athlete.adherencePercent < 60 ? 'orange' : 'default'}
              detail="Of planned sessions logged"
            />
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-dashed border-[hsl(var(--border))] p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
              <UsersRound size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Session-by-session detail is coming soon</p>
              <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Right now this page shows the same real numbers as Roster, just at a larger scale — a full per-exercise history for {athlete.displayName.split(' ')[0]}
                {' '}needs a coach-scoped history endpoint that doesn't exist yet. Noted here rather than mocked up.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
