import { CalendarDays, Flame, Play } from 'lucide-react';
import { Link } from 'wouter';
import { useAthleteHome } from '@/hooks/use-training';
import { EmptyBlock, ErrorBlock, LoadingBlock, PageIntro } from '@/components/page-states';

export default function HomePage() {
  const homeQuery = useAthleteHome();
  const home = homeQuery.data;

  if (homeQuery.isLoading) {
    return (
      <PageIntro eyebrow="Your training space" title="Loading your rhythm…">
        <LoadingBlock />
      </PageIntro>
    );
  }

  if (homeQuery.isError) {
    return (
      <>
        <PageIntro eyebrow="Your training space" title="A small reset." />
        <ErrorBlock onRetry={() => homeQuery.refetch()} />
      </>
    );
  }

  if (!home) {
    return (
      <>
        <PageIntro eyebrow="Your training space" title="Ready when you are." />
        <EmptyBlock title="No sessions yet">Your training rhythm will start to take shape here.</EmptyBlock>
      </>
    );
  }

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const isCompleted = home.today.status === 'completed';
  const yesterdayISO = new Date(Date.now() - 86_400_000).toDateString();
  const yesterdayEntry = home.heatmap.find((day) => new Date(day.date).toDateString() === yesterdayISO);
  const yesterdayMissed = Boolean(yesterdayEntry && yesterdayEntry.setsLogged === 0);

  const ledgerStats = [
    { label: 'Streak', value: `${home.streakDays}`, unit: 'days' },
    { label: 'Weekly volume', value: home.weeklyVolume.toLocaleString(), unit: home.volumeUnit },
    { label: 'Adherence', value: `${home.adherencePercent}`, unit: '%' },
  ];

  return (
    <div>
      {/* Dateline header — a ledger page opens with a date and a name, not
          a card. Oversized greeting on the left, the day's three numbers
          run as an inline entry row on the right, not three boxes. */}
      <div className="stagger-in mb-7 flex flex-col gap-6 border-b border-dashed border-[hsl(var(--border))] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="forma-mono mb-3 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--primary-text))]">{todayLabel}</p>
          <h1 className="forma-display text-[2.75rem] font-semibold leading-[.95] tracking-[-.06em] text-[hsl(var(--foreground))] sm:text-6xl">
            {home.greeting}.
          </h1>
        </div>
        <dl className="ledger-divide-x flex shrink-0 items-stretch" data-testid="ledger-stat-row">
          {ledgerStats.map((stat) => (
            <div key={stat.label} className="px-5 first:pl-0 last:pr-0">
              <dt className="forma-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{stat.label}</dt>
              <dd className="tabular-figures forma-display mt-1.5 whitespace-nowrap text-2xl font-semibold tracking-[-.04em]">
                {stat.value}
                <span className="ml-1 text-xs font-normal text-[hsl(var(--muted-foreground))]">{stat.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="rule-field stagger-in stagger-1 relative mb-7 overflow-hidden rounded-[28px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] sm:p-8 lg:p-10">
        <div className="relative max-w-2xl">
          <div className="mb-8 flex items-center gap-2 text-[hsl(var(--sidebar-primary))]">
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="forma-mono text-[10px] font-bold uppercase tracking-[.2em]">Today's session</span>
          </div>
          <h2 className="forma-display max-w-xl text-4xl font-semibold leading-[.98] tracking-[-.07em] sm:text-6xl" data-testid="text-today-title">
            {home.today.title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[hsl(var(--sidebar-foreground)/.62)]" data-testid="text-today-subtitle">
            {home.today.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href="/train"
              data-testid="link-start-today"
              className="shadow-stamp-md inline-flex min-h-12 items-center gap-3 rounded-xl bg-[hsl(var(--sidebar-primary))] px-5 text-sm font-bold text-[hsl(var(--sidebar-primary-foreground))] transition-transform hover:-translate-y-0.5"
            >
              <Play size={16} fill="currentColor" />
              {isCompleted ? 'Review session' : 'Start session'}
            </Link>
            <div className="flex items-center gap-4 text-xs text-[hsl(var(--sidebar-foreground)/.58)]">
              <span>{home.today.exerciseCount} movements</span>
            </div>
          </div>
        </div>
        {/* Stamped corner tag — reads "logged" once a session is complete,
            an actual ledger mark rather than decorative shapes. */}
        {isCompleted && (
          <div className="shadow-stamp-sm absolute right-7 top-7 hidden items-center gap-2 rounded-lg border border-[hsl(var(--sidebar-primary)/.4)] bg-[hsl(var(--sidebar-accent))] px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />
            <span className="forma-mono text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--sidebar-primary))]">Logged</span>
          </div>
        )}
      </section>

      {yesterdayMissed && (
        <div className="stagger-in mb-7 flex items-center gap-2.5 rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]" data-testid="badge-yesterday-missed">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-[hsl(var(--muted-foreground)/.5)]" />
          Yesterday: not logged — it's still in your history below, not hidden.
        </div>
      )}

      <div className="grid gap-7 lg:grid-cols-[1.5fr_.75fr]">
        <section className="stagger-in rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="forma-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Consistency map</p>
              <h3 className="forma-display mt-2 text-2xl font-semibold tracking-[-.05em]">Show up, then stack.</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <span key={level} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: `hsl(var(--primary) / ${level === 0 ? 0.1 : 0.18 + level * 0.18})` }} />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="rule-field-light -mx-1 grid grid-cols-7 gap-2 rounded-2xl px-1 py-3 sm:gap-3" data-testid="grid-training-heatmap">
            {home.heatmap.slice(-28).map((day, index) => {
              const isPast = new Date(day.date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
              const missed = isPast && day.level === 0;
              return (
                <div key={day.date} className="group flex flex-col items-center gap-2" data-testid={`heatmap-day-${index}`}>
                  <div
                    title={missed ? 'Not logged' : undefined}
                    className={`relative flex h-10 w-full min-w-0 items-center justify-center rounded-lg transition-transform group-hover:-translate-y-1 ${
                      missed ? 'border border-dashed border-[hsl(var(--muted-foreground)/.35)]' : ''
                    }`}
                    style={{ backgroundColor: missed ? 'transparent' : `hsl(var(--primary) / ${day.level === 0 ? 0.08 : 0.18 + day.level * 0.18})` }}
                  >
                    <span className="forma-mono text-[10px] font-bold text-[hsl(var(--foreground)/.72)]">{day.setsLogged || (missed ? '–' : '·')}</span>
                  </div>
                  <span className="forma-mono text-[9px] text-[hsl(var(--muted-foreground))]">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-7 flex items-center gap-3 border-t border-[hsl(var(--border))] pt-5 text-xs text-[hsl(var(--muted-foreground))]">
            <CalendarDays size={15} />
            <span>Sets logged over the last 4 weeks</span>
          </div>
        </section>

        {/* Insight panel styled as an index card using the same
            stamp-shadow language as the auth ledger panel, kept level
            (no rotation) rather than an off-square block. */}
        <section className="stagger-in stagger-2 flex items-start justify-center">
          <div className="shadow-stamp-md relative w-full max-w-[280px] overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-6">
            <div className="absolute -right-4 -top-4 text-[hsl(var(--secondary-foreground)/.1)]">
              <Flame size={110} strokeWidth={1} />
            </div>
            <div className="relative">
              <p className="forma-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--secondary-foreground)/.75)]">Today's insight</p>
              <p className="forma-display mt-6 text-xl font-semibold leading-tight tracking-[-.04em]" data-testid="text-daily-insight">
                "{home.insight}"
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}