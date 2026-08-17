import { ArrowUpRight, CalendarDays, Flame, Play } from 'lucide-react';
import { Link } from 'wouter';
import { useAthleteHome } from '@/hooks/use-training';
import { EmptyBlock, ErrorBlock, LoadingBlock, Metric, PageIntro } from '@/components/page-states';

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

  return (
    <div>
      <PageIntro eyebrow={todayLabel} title={`${home.greeting}.`}>
        The work compounds quietly. Here's your view of the week so far.
      </PageIntro>

      <section className="stagger-in stagger-1 relative mb-6 overflow-hidden rounded-[28px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[32px] border-[hsl(var(--sidebar-primary)/.18)]" />
        <div className="pointer-events-none absolute bottom-[-110px] right-20 h-64 w-64 rounded-full border-[22px] border-[hsl(var(--accent)/.3)]" />
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
              className="group inline-flex min-h-12 items-center gap-3 rounded-xl bg-[hsl(var(--sidebar-primary))] px-5 text-sm font-bold text-[hsl(var(--sidebar-primary-foreground))] transition-transform hover:-translate-y-0.5"
            >
              <Play size={16} fill="currentColor" />
              {isCompleted ? 'Review session' : 'Start session'}
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <div className="flex items-center gap-4 text-xs text-[hsl(var(--sidebar-foreground)/.58)]">
              <span>{home.today.exerciseCount} movements</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="stagger-in stagger-2">
          <Metric label="Current streak" value={`${home.streakDays} days`} detail="consistent training days" tone="orange" />
        </div>
        <div className="stagger-in stagger-3">
          <Metric label="Weekly volume" value={`${home.weeklyVolume.toLocaleString()} ${home.volumeUnit}`} detail="Last 7 days" tone="mint" />
        </div>
        <div className="stagger-in stagger-4">
          <Metric label="Adherence" value={`${home.adherencePercent}%`} detail="Your planned rhythm" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
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
          <div className="grid grid-cols-7 gap-2 sm:gap-3" data-testid="grid-training-heatmap">
            {home.heatmap.slice(-28).map((day, index) => (
              <div key={day.date} className="group flex flex-col items-center gap-2" data-testid={`heatmap-day-${index}`}>
                <div
                  className="relative flex h-10 w-full min-w-0 items-center justify-center rounded-lg transition-transform group-hover:-translate-y-1"
                  style={{ backgroundColor: `hsl(var(--primary) / ${day.level === 0 ? 0.08 : 0.18 + day.level * 0.18})` }}
                >
                  <span className="forma-mono text-[10px] font-bold text-[hsl(var(--foreground)/.72)]">{day.setsLogged || '·'}</span>
                </div>
                <span className="forma-mono text-[9px] text-[hsl(var(--muted-foreground))]">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-3 border-t border-[hsl(var(--border))] pt-5 text-xs text-[hsl(var(--muted-foreground))]">
            <CalendarDays size={15} />
            <span>Sets logged over the last 4 weeks</span>
          </div>
        </section>
        <section className="stagger-in stagger-2 relative overflow-hidden rounded-3xl bg-[hsl(var(--secondary))] p-6 sm:p-7">
          <div className="absolute -right-5 -top-5 text-[hsl(var(--secondary-foreground)/.1)]">
            <Flame size={130} strokeWidth={1} />
          </div>
          <div className="relative">
            <p className="forma-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--secondary-foreground)/.75)]">Today's insight</p>
            <p className="forma-display mt-7 text-2xl font-semibold leading-tight tracking-[-.05em]" data-testid="text-daily-insight">
              "{home.insight}"
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
