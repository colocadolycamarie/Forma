import { ChevronDown, ChevronUp, CircleStop, Dumbbell, History, Plus, TimerReset } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useCompleteSession, useLogSet, useStartSession, useTodaySession } from '@/hooks/use-training';
import { EmptyBlock, ErrorBlock, LoadingBlock, PageIntro, SavingLabel } from '@/components/page-states';

type Entry = { weight: string; reps: string; rpe: string };

function formatStartedAt(value: string | null) {
  if (!value) return 'Ready when you are';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Ready when you are' : `Started ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export default function TrainPage() {
  const [, setLocation] = useLocation();
  const todayQuery = useTodaySession();
  const startSession = useStartSession();
  const logSet = useLogSet();
  const completeSession = useCompleteSession();
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const session = todayQuery.data;

  if (todayQuery.isLoading) {
    return (
      <>
        <PageIntro eyebrow="Training floor" title="Make some room." />
        <LoadingBlock label="Loading your session" />
      </>
    );
  }
  if (todayQuery.isError) {
    return (
      <>
        <PageIntro eyebrow="Training floor" title="The session is catching its breath." />
        <ErrorBlock onRetry={() => todayQuery.refetch()} />
      </>
    );
  }
  if (!session) {
    return (
      <>
        <PageIntro eyebrow="Training floor" title="Your floor is clear." />
        <EmptyBlock title="No session on deck">When a session lands here, this is where you'll log every working set.</EmptyBlock>
      </>
    );
  }

  const getEntry = (exerciseId: string, weight: number | null, reps: number | null): Entry =>
    entries[exerciseId] ?? { weight: weight ? String(weight) : '', reps: reps ? String(reps) : '', rpe: '' };
  const setEntry = (exerciseId: string, value: Partial<Entry>) =>
    setEntries((previous) => ({ ...previous, [exerciseId]: { ...getEntry(exerciseId, null, null), ...value } }));

  const isComplete = session.status === 'completed';

  const handleStart = () => startSession.mutate(session.id);

  const handleLog = (exerciseId: string, suggestedWeight: number | null, suggestedReps: number | null, setsCompleted: number) => {
    const entry = getEntry(exerciseId, suggestedWeight, suggestedReps);
    const weight = Number(entry.weight);
    const reps = Number(entry.reps);
    if (!weight || !reps) return;
    logSet.mutate(
      { sessionId: session.id, input: { exerciseId, setNumber: setsCompleted + 1, weight, reps, rpe: entry.rpe ? Number(entry.rpe) : null } },
      { onSuccess: () => setEntries((previous) => ({ ...previous, [exerciseId]: { ...entry, rpe: '' } })) },
    );
  };

  const handleComplete = () => completeSession.mutate(session.id);

  return (
    <div>
      <PageIntro eyebrow="Training floor" title={isComplete ? 'Session complete.' : 'Stay with the set.'}>
        {formatStartedAt(session.startedAt)}
        <span className="ml-2 inline-flex items-center gap-1.5 text-[hsl(var(--primary))]">
          <span className={`h-1.5 w-1.5 rounded-full ${isComplete ? 'bg-[hsl(var(--muted-foreground))]' : 'animate-pulse bg-[hsl(var(--primary))]'}`} />
          {isComplete ? 'Logged' : 'Live session'}
        </span>
      </PageIntro>

      {startSession.isError && (
        <div className="mb-5 rounded-2xl border border-[hsl(var(--accent)/.4)] bg-[hsl(var(--accent)/.08)] px-4 py-3 text-sm">
          Couldn't start this session. Give it another try.
        </div>
      )}
      {completeSession.isError && (
        <div className="mb-5 rounded-2xl border border-[hsl(var(--accent)/.4)] bg-[hsl(var(--accent)/.08)] px-4 py-3 text-sm">
          The sets are safe, but completion didn't land. Try again.
        </div>
      )}

      <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]">
            <Dumbbell size={22} />
          </div>
          <div>
            <p className="forma-display text-xl font-semibold tracking-[-.04em]">{session.title}</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {session.recentSets.length} sets logged · {session.exercises.length} movements
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isComplete && session.status !== 'in_progress' && (
            <button
              onClick={handleStart}
              disabled={startSession.isPending}
              data-testid="button-start-session"
              className="min-h-11 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-50"
            >
              {startSession.isPending ? 'Starting…' : 'Start session'}
            </button>
          )}
          {!isComplete && session.status === 'in_progress' && (
            <button
              onClick={handleComplete}
              disabled={completeSession.isPending}
              data-testid="button-complete-session"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[hsl(var(--foreground))] px-4 text-sm font-bold text-[hsl(var(--background))] disabled:opacity-50"
            >
              <CircleStop size={16} />
              {completeSession.isPending ? 'Closing…' : 'Complete workout'}
            </button>
          )}
        </div>
      </section>

      <div className="space-y-3">
        {session.exercises.map((exercise, index) => {
          const exerciseSets = session.recentSets.filter((set) => set.exerciseId === exercise.exerciseId);
          const entry = getEntry(exercise.exerciseId, exercise.suggestedWeight, exercise.suggestedReps);
          const isOpen = expanded === exercise.exerciseId || (expanded === null && index === 0);
          return (
            <section
              key={exercise.exerciseId}
              className={`overflow-hidden rounded-2xl border transition-colors ${isOpen ? 'border-[hsl(var(--primary)/.45)] bg-[hsl(var(--card))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)]'}`}
              data-testid={`card-exercise-${exercise.exerciseId}`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : exercise.exerciseId)}
                data-testid={`button-expand-${exercise.exerciseId}`}
                aria-expanded={isOpen}
                className="flex min-h-[76px] w-full items-center gap-4 px-5 text-left sm:px-6"
              >
                <span className="forma-mono text-xs text-[hsl(var(--muted-foreground))]">0{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="forma-display truncate text-lg font-semibold tracking-[-.03em]">{exercise.name}</p>
                  <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                    {exercise.muscleGroup} <span className="mx-1 opacity-50">·</span> {exercise.repRangeLabel} reps
                  </p>
                </div>
                <span className="mr-1 hidden text-xs text-[hsl(var(--muted-foreground))] sm:inline">{exerciseSets.length} logged</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {isOpen && (
                <div className="border-t border-[hsl(var(--border))] px-5 pb-6 pt-5 sm:px-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Last time <span className="font-semibold text-[hsl(var(--foreground))]">{exercise.lastPerformanceLabel ?? 'No previous performance'}</span>
                    </p>
                    {exercise.suggestedWeight !== null && exercise.suggestedReps !== null && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                        <History size={14} />
                        Target {exercise.suggestedWeight} × {exercise.suggestedReps}
                      </span>
                    )}
                  </div>
                  {exerciseSets.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {exerciseSets.map((set) => (
                        <div key={set.id} className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted)/.65)] px-3 py-2.5 text-sm" data-testid={`row-logged-set-${set.id}`}>
                          <span className="forma-mono text-xs text-[hsl(var(--muted-foreground))]">SET {set.setNumber}</span>
                          <span className="font-semibold">
                            {set.weight} kg <span className="mx-1 text-[hsl(var(--muted-foreground))]">×</span> {set.reps}
                          </span>
                          {set.isPr && <span className="rounded-md bg-[hsl(var(--accent)/.18)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--accent-foreground))]">PR</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {!isComplete && (
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_.8fr_auto] sm:items-end">
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          Weight <span className="normal-case tracking-normal">(kg)</span>
                        </span>
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={entry.weight}
                          onChange={(event) => setEntry(exercise.exerciseId, { weight: event.target.value })}
                          data-testid={`input-weight-${exercise.exerciseId}`}
                          className="min-h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm font-semibold outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.18)]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Reps</span>
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={entry.reps}
                          onChange={(event) => setEntry(exercise.exerciseId, { reps: event.target.value })}
                          data-testid={`input-reps-${exercise.exerciseId}`}
                          className="min-h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm font-semibold outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.18)]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          RPE <span className="normal-case tracking-normal">(opt.)</span>
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={entry.rpe}
                          onChange={(event) => setEntry(exercise.exerciseId, { rpe: event.target.value })}
                          data-testid={`input-rpe-${exercise.exerciseId}`}
                          className="min-h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm font-semibold outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.18)]"
                        />
                      </label>
                      <button
                        onClick={() => handleLog(exercise.exerciseId, exercise.suggestedWeight, exercise.suggestedReps, exerciseSets.length)}
                        disabled={logSet.isPending}
                        data-testid={`button-log-set-${exercise.exerciseId}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <Plus size={16} />
                        {logSet.isPending ? 'Logging…' : 'Log set'}
                      </button>
                    </div>
                  )}
                  {logSet.isError && <p className="mt-3 text-xs text-[hsl(var(--destructive-text))]">Couldn't save that set. Check the numbers and retry.</p>}
                  <div className="mt-4 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="inline-flex items-center gap-1.5">
                      <TimerReset size={14} />
                      {exerciseSets.length} of {exercise.targetSets} sets
                    </span>
                    <SavingLabel active={logSet.isPending} label="Saving set" />
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <div className="mt-7 flex items-center justify-between">
        <Link href="/" data-testid="link-back-home" className="text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
          ← Back to today
        </Link>
        {isComplete && (
          <button onClick={() => setLocation('/progress')} data-testid="button-see-session-progress" className="text-sm font-bold text-[hsl(var(--primary))]">
            See progress →
          </button>
        )}
      </div>
    </div>
  );
}
