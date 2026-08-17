import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronRight, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useExerciseHistory, useTodaySession } from '@/hooks/use-training';
import { EmptyBlock, ErrorBlock, LoadingBlock, Metric, PageIntro } from '@/components/page-states';

export default function ProgressPage() {
  const sessionQuery = useTodaySession();
  const exercises = sessionQuery.data?.exercises ?? [];
  const [selectedId, setSelectedId] = useState('');
  const activeId = selectedId || exercises[0]?.exerciseId || '';
  const historyQuery = useExerciseHistory(activeId);
  const history = historyQuery.data;
  const points = history?.points ?? [];

  const chart = useMemo(() => {
    if (!points.length) return '';
    const max = Math.max(...points.map((point) => point.estimatedOneRepMax));
    const min = Math.min(...points.map((point) => point.estimatedOneRepMax));
    const range = Math.max(max - min, 1);
    return points.map((point, index) => `${(index / Math.max(points.length - 1, 1)) * 100},${88 - ((point.estimatedOneRepMax - min) / range) * 66}`).join(' ');
  }, [points]);

  if (sessionQuery.isLoading) {
    return (
      <>
        <PageIntro eyebrow="The long view" title="Reading the work." />
        <LoadingBlock label="Loading your movements" />
      </>
    );
  }
  if (sessionQuery.isError) {
    return (
      <>
        <PageIntro eyebrow="The long view" title="Your progress is still yours." />
        <ErrorBlock onRetry={() => sessionQuery.refetch()} />
      </>
    );
  }
  if (!exercises.length) {
    return (
      <>
        <PageIntro eyebrow="The long view" title="The graph starts with a set." />
        <EmptyBlock title="No movements logged yet">Complete a session and your strongest work will start to draw itself here.</EmptyBlock>
      </>
    );
  }
  if (historyQuery.isLoading) {
    return (
      <>
        <PageIntro eyebrow="The long view" title="Loading the signal." />
        <LoadingBlock label="Looking through your history" />
      </>
    );
  }
  if (historyQuery.isError) {
    return (
      <>
        <PageIntro eyebrow="The long view" title="The graph blinked." />
        <ErrorBlock onRetry={() => historyQuery.refetch()} />
      </>
    );
  }
  if (!history || points.length === 0 || history.bestEstimatedOneRepMax === null) {
    return (
      <>
        <PageIntro eyebrow="The long view" title="Nothing to compare yet." />
        <EmptyBlock title="First rep, then reflection" action={<Link href="/train" className="mt-2 text-sm font-semibold text-[hsl(var(--primary))]" data-testid="link-progress-empty-train">Log your first set →</Link>}>
          Log a working set for {history?.exerciseName ?? 'this movement'} to make this view yours.
        </EmptyBlock>
      </>
    );
  }

  const first = points[0]?.estimatedOneRepMax ?? history.bestEstimatedOneRepMax;
  const change = history.bestEstimatedOneRepMax - first;

  return (
    <div>
      <PageIntro
        eyebrow="The long view"
        title="Progress has a shape."
        action={
          <Link href="/train" data-testid="link-progress-train" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[hsl(var(--foreground))] px-4 text-sm font-bold text-[hsl(var(--background))]">
            Log a session <ArrowUpRight size={16} />
          </Link>
        }
      >
        Not just bigger numbers. A clearer read on what your body can do now.
      </PageIntro>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Movements">
        {exercises.map((exercise) => (
          <button
            key={exercise.exerciseId}
            onClick={() => setSelectedId(exercise.exerciseId)}
            role="tab"
            aria-selected={activeId === exercise.exerciseId}
            data-testid={`tab-exercise-${exercise.exerciseId}`}
            className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
              activeId === exercise.exerciseId
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.13)] text-[hsl(var(--foreground))]'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {exercise.name}
            <ChevronRight size={14} />
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
        <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-7">
          <div className="mb-7 flex items-start justify-between">
            <div>
              <p className="forma-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Estimated 1RM</p>
              <h2 className="forma-display mt-2 text-3xl font-semibold tracking-[-.06em]" data-testid="text-history-exercise">
                {history.exerciseName}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="relative h-[260px] overflow-hidden rounded-2xl bg-[hsl(var(--background))] p-3 sm:h-[330px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'linear-gradient(hsl(var(--border)/.45) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/.22) 1px, transparent 1px)',
                backgroundSize: '25% 25%',
              }}
            />
            <svg className="relative h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`${history.exerciseName} estimated one rep max chart`} role="img">
              <polyline points={chart} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((point, index) => {
                const values = points.map((item) => item.estimatedOneRepMax);
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = Math.max(max - min, 1);
                return (
                  <circle
                    key={`${point.date}-${index}`}
                    cx={(index / Math.max(points.length - 1, 1)) * 100}
                    cy={88 - ((point.estimatedOneRepMax - min) / range) * 66}
                    r="2.2"
                    fill="hsl(var(--card))"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
            <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
              <span>{points[0]?.date ?? 'Start'}</span>
              <span>{points.at(-1)?.date ?? 'Now'}</span>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--border))] pt-5">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{points.length} recorded efforts</span>
            <span className={`inline-flex items-center gap-1 text-sm font-bold ${change >= 0 ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--accent))]'}`}>
              {change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              {Math.abs(change).toFixed(1)} kg since first
            </span>
          </div>
        </section>
        <div className="space-y-4">
          <Metric label="Best working weight" value={`${history.bestWeight} kg`} detail="Your strongest logged load" tone="mint" />
          <Metric label="Best estimated 1RM" value={`${history.bestEstimatedOneRepMax} kg`} detail="A useful approximation, not a verdict" tone="orange" />
          <section className="rounded-3xl bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))]">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--sidebar))]">
                <Trophy size={18} />
              </div>
              <div>
                <p className="forma-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.55)]">Personal reflection</p>
                <p className="forma-display mt-1 text-lg font-semibold">The signal is clear.</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-[hsl(var(--sidebar-foreground)/.65)]">
              You don't need to chase every session. Keep the quality high and let the line move at its own pace.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
