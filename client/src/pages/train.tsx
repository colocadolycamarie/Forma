import { ArrowLeftRight, CheckCircle2, ChevronDown, ChevronUp, CircleStop, Cloud, CloudOff, Dumbbell, History, Pause, Play, Plus, RefreshCw, TimerReset, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCompleteSession, useLogSet, useStartSession, useTodaySession } from '@/hooks/use-training';
import { EmptyBlock, ErrorBlock, LoadingBlock, PageIntro, SavingLabel } from '@/components/page-states';
import { dequeueSet, enqueueSet, getQueuedSets, type QueuedSet } from '@/lib/offline-queue';

type Entry = { weight: string; reps: string; rpe: string };
type SyncState = 'synced' | 'offline' | 'syncing';

/** Sync indicator (spec §5/§7.4): quiet when synced, plain and calm when
 * offline — a spotty gym connection is an expected scenario, not an error,
 * so this never reads as alarming. */
function SyncIndicator({ state, queued }: { state: SyncState; queued: number }) {
  if (state === 'synced' && queued === 0) return null;
  const config: Record<SyncState, { icon: typeof Cloud; label: string; tone: string }> = {
    synced: { icon: Cloud, label: 'Synced', tone: 'text-[hsl(var(--muted-foreground))]' },
    syncing: { icon: RefreshCw, label: 'Syncing…', tone: 'text-[hsl(var(--primary-text))]' },
    offline: { icon: CloudOff, label: `Offline — ${queued} queued`, tone: 'text-[hsl(var(--warning-text))]' },
  };
  const { icon: Icon, label, tone } = config[state];
  return (
    <span role="status" aria-live="polite" data-testid="sync-indicator" className={`ml-2 inline-flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
      <Icon size={13} className={state === 'syncing' ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}

const SUBSTITUTION_KEY = (sessionId: string, exerciseId: string) => `forma.substitution.${sessionId}.${exerciseId}`;

/** Exercise substitution (spec §6 Train / §7.6): equipment's taken, or an
 * exercise needs to change for the day. The swap is recorded as a plain
 * note next to the exercise, not a silent replacement — the prescribed
 * exercise stays visible so a coach reviewing the session later sees
 * exactly what changed and why. There's no backend field for this note
 * yet (LoggedSet/SessionExercise carry no note column), so it's kept
 * client-side and scoped to this device for now — a known, documented gap
 * rather than something silently faked as synced to the coach's view. */
function SwapControl({ sessionId, exercise, others }: { sessionId: string; exercise: { exerciseId: string; name: string }; others: { exerciseId: string; name: string }[] }) {
  const storageKey = SUBSTITUTION_KEY(sessionId, exercise.exerciseId);
  const [note, setNote] = useState<string | null>(() => window.localStorage.getItem(storageKey));
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const applySwap = (label: string) => {
    window.localStorage.setItem(storageKey, label);
    setNote(label);
    setOpen(false);
    setCustom('');
  };

  const clearSwap = () => {
    window.localStorage.removeItem(storageKey);
    setNote(null);
  };

  if (note) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--warning)/.12)] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--warning-text))]">
        <ArrowLeftRight size={12} />
        Swapped → {note}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            clearSwap();
          }}
          aria-label="Undo substitution"
          data-testid={`button-undo-swap-${exercise.exerciseId}`}
          className="ml-1 text-[hsl(var(--warning-text))] hover:opacity-70"
        >
          <X size={11} />
        </button>
      </span>
    );
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label={`Swap ${exercise.name} for another movement`}
        aria-expanded={open}
        data-testid={`button-swap-${exercise.exerciseId}`}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
      >
        <ArrowLeftRight size={12} />
        Swap
      </button>
      {open && (
        <div
          onClick={(event) => event.stopPropagation()}
          data-testid={`popover-swap-${exercise.exerciseId}`}
          className="shadow-stamp-sm absolute right-0 top-9 z-10 w-64 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Swap for</p>
          {others.length > 0 && (
            <div className="mb-2 space-y-1">
              {others.map((option) => (
                <button
                  key={option.exerciseId}
                  type="button"
                  onClick={() => applySwap(option.name)}
                  data-testid={`option-swap-${exercise.exerciseId}-${option.exerciseId}`}
                  className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-[hsl(var(--muted))]"
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 border-t border-[hsl(var(--border))] pt-2">
            <input
              type="text"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="Or type a substitute…"
              data-testid={`input-swap-custom-${exercise.exerciseId}`}
              className="min-h-9 flex-1 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2.5 text-xs outline-none focus:border-[hsl(var(--primary))]"
            />
            <button
              type="button"
              disabled={!custom.trim()}
              onClick={() => applySwap(custom.trim())}
              data-testid={`button-swap-custom-confirm-${exercise.exerciseId}`}
              className="min-h-9 rounded-lg bg-[hsl(var(--primary))] px-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-40"
            >
              Set
            </button>
          </div>
        </div>
      )}
    </span>
  );
}

const DEFAULT_REST_SECONDS = 90;

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Rest timer (spec §5/§6/§7.7): auto-starts after a set is logged, quiet
 * countdown in mono numerals, dismissible without penalty. Duration reads
 * from the same "forma.restDuration" key Settings would eventually write
 * to; defaults to 90s until that control exists. */
function RestTimer({ onDismiss }: { onDismiss: () => void }) {
  const duration = Number(window.localStorage.getItem('forma.restDuration')) || DEFAULT_REST_SECONDS;
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) return;
    const id = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [running, remaining]);

  const complete = remaining <= 0;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="rest-timer"
      className={`stagger-in mb-6 flex items-center justify-between rounded-2xl border px-5 py-4 transition-colors ${
        complete ? 'border-[hsl(var(--primary)/.4)] bg-[hsl(var(--primary)/.08)] shadow-stamp-sm' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--muted))]">
          <TimerReset size={18} className={complete ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'} />
        </div>
        <div>
          <p className="forma-mono text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{complete ? 'Rest complete' : 'Resting'}</p>
          <p className="forma-display text-2xl font-semibold tabular-nums tracking-[-.03em]">{complete ? "Let's go" : formatClock(remaining)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {!complete && (
          <button
            type="button"
            onClick={() => setRunning((value) => !value)}
            aria-label={running ? 'Pause rest timer' : 'Resume rest timer'}
            data-testid="button-rest-timer-toggle"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
          >
            {running ? <Pause size={15} /> : <Play size={15} />}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss rest timer"
          data-testid="button-rest-timer-dismiss"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

function formatStartedAt(value: string | null) {
  if (!value) return 'Ready when you are';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Ready when you are' : `Started ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export default function TrainPage() {
  const todayQuery = useTodaySession();
  const startSession = useStartSession();
  const logSet = useLogSet();
  const completeSession = useCompleteSession();
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [restTimerKey, setRestTimerKey] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState<QueuedSet[]>([]);

  const session = todayQuery.data;

  // Offline queue (spec §7.4): flush whatever's queued for this session
  // whenever the browser comes back online, and pick up anything already
  // queued from a previous offline stretch on mount.
  useEffect(() => {
    if (!session) return;
    setPending(getQueuedSets(session.id));

    const flush = async () => {
      const queued = getQueuedSets(session.id);
      if (queued.length === 0) return;
      setSyncing(true);
      for (const item of queued) {
        try {
          await logSet.mutateAsync({ sessionId: item.sessionId, input: item.input });
          dequeueSet(item.localId);
        } catch {
          // Stays queued — will retry on the next reconnect or manual retry.
          break;
        }
      }
      setPending(getQueuedSets(session.id));
      setSyncing(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      flush();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) flush();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

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
    const input = { exerciseId, setNumber: setsCompleted + 1, weight, reps, rpe: entry.rpe ? Number(entry.rpe) : null };

    // Offline logging (spec §7.4): a set logged with no connection queues
    // locally instead of failing — logging never blocks on signal.
    if (!navigator.onLine) {
      const queued = enqueueSet(session.id, input);
      setPending((previous) => [...previous, queued]);
      setEntries((previous) => ({ ...previous, [exerciseId]: { ...entry, rpe: '' } }));
      return;
    }

    logSet.mutate(
      { sessionId: session.id, input },
      {
        onSuccess: () => {
          setEntries((previous) => ({ ...previous, [exerciseId]: { ...entry, rpe: '' } }));
          setRestTimerKey(Date.now());
        },
      },
    );
  };

  const syncState: SyncState = !isOnline ? 'offline' : syncing ? 'syncing' : 'synced';

  const handleComplete = () => completeSession.mutate(session.id);

  return (
    <div>
      <PageIntro eyebrow="Training floor" title={isComplete ? 'Session complete.' : 'Stay with the set.'}>
        {formatStartedAt(session.startedAt)}
        <span className="ml-2 inline-flex items-center gap-1.5 text-[hsl(var(--primary))]">
          <span className={`h-1.5 w-1.5 rounded-full ${isComplete ? 'bg-[hsl(var(--muted-foreground))]' : 'animate-pulse bg-[hsl(var(--primary))]'}`} />
          {isComplete ? 'Logged' : 'Live session'}
        </span>
        <SyncIndicator state={syncState} queued={pending.length} />
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

      {restTimerKey !== null && <RestTimer key={restTimerKey} onDismiss={() => setRestTimerKey(null)} />}

      <div className="space-y-3">
        {session.exercises.map((exercise, index) => {
          const exerciseSets = session.recentSets.filter((set) => set.exerciseId === exercise.exerciseId);
          const queuedForExercise = pending.filter((item) => item.input.exerciseId === exercise.exerciseId);
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
                <span className="mr-1 hidden text-xs text-[hsl(var(--muted-foreground))] sm:inline">
                  {exerciseSets.length} logged{queuedForExercise.length > 0 ? ` · ${queuedForExercise.length} queued` : ''}
                </span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {isOpen && (
                <div className="border-t border-[hsl(var(--border))] px-5 pb-6 pt-5 sm:px-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Last time <span className="font-semibold text-[hsl(var(--foreground))]">{exercise.lastPerformanceLabel ?? 'No previous performance'}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      {exercise.suggestedWeight !== null && exercise.suggestedReps !== null && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                          <History size={14} />
                          Target {exercise.suggestedWeight} × {exercise.suggestedReps}
                        </span>
                      )}
                      {!isComplete && (
                        <SwapControl
                          sessionId={session.id}
                          exercise={{ exerciseId: exercise.exerciseId, name: exercise.name }}
                          others={session.exercises.filter((other) => other.exerciseId !== exercise.exerciseId).map((other) => ({ exerciseId: other.exerciseId, name: other.name }))}
                        />
                      )}
                    </div>
                  </div>
                  {queuedForExercise.length > 0 && (
                    <div className="ledger-divide mb-4 overflow-hidden rounded-xl border border-dashed border-[hsl(var(--warning)/.4)]">
                      {queuedForExercise.map((item) => (
                        <div key={item.localId} data-testid={`row-queued-set-${item.localId}`} className="flex items-center justify-between bg-[hsl(var(--warning)/.06)] px-3.5 py-3 text-sm">
                          <span className="forma-mono text-xs text-[hsl(var(--warning-text))]">SET {item.input.setNumber}</span>
                          <span className="font-semibold">
                            {item.input.weight} kg <span className="mx-1 text-[hsl(var(--muted-foreground))]">×</span> {item.input.reps}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--warning-text))]">
                            <CloudOff size={12} /> Queued
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {exerciseSets.length > 0 && (
                    <div className="ledger-divide mb-4 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
                      {exerciseSets.map((set) => (
                        <div
                          key={set.id}
                          data-testid={`row-logged-set-${set.id}`}
                          className={`flex items-center justify-between px-3.5 py-3 text-sm transition-colors ${set.isPr ? 'shadow-stamp-lg bg-[hsl(var(--primary)/.06)]' : 'bg-[hsl(var(--card))]'}`}
                        >
                          <span className="forma-mono text-xs text-[hsl(var(--muted-foreground))]">SET {set.setNumber}</span>
                          <span className="font-semibold">
                            {set.weight} kg <span className="mx-1 text-[hsl(var(--muted-foreground))]">×</span> {set.reps}
                          </span>
                          {set.isPr ? (
                            <span className="animate-stamp inline-flex items-center gap-1 rounded-md bg-[hsl(var(--primary))] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--primary-foreground))]">
                              <CheckCircle2 size={11} /> PR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[hsl(var(--primary-text))]">
                              <CheckCircle2 size={14} />
                            </span>
                          )}
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
    </div>
  );
}
