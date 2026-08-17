import { ArrowUpRight, ClipboardList, Layers3, Plus, Radar, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { EmptyBlock, PageIntro } from '@/components/page-states';

const lanes = [
  { icon: UsersRound, title: 'Roster', body: 'See who is training, who needs a nudge, and where attention matters.', tone: 'mint' },
  { icon: ClipboardList, title: 'Programs', body: 'Build repeatable blocks around the work your athletes are ready for.', tone: 'sand' },
  { icon: Radar, title: 'Signals', body: 'Turn logged sessions into a simple, coachable read on progress.', tone: 'orange' },
] as const;

export default function CoachPage() {
  const [activeLane, setActiveLane] = useState<string>('Roster');
  return (
    <div>
      <PageIntro
        eyebrow="Coach view"
        title="See the work. Coach the next move."
        action={
          <Link href="/" data-testid="link-coach-athlete-view" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm font-bold hover:border-[hsl(var(--primary))]">
            Athlete view <ArrowUpRight size={16} />
          </Link>
        }
      >
        A clear foundation for the people and programs you'll grow with Forma.
      </PageIntro>
      <section className="relative mb-7 overflow-hidden rounded-[28px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))] sm:p-9">
        <div className="pointer-events-none absolute right-[-30px] top-[-70px] h-72 w-72 rounded-full border-[26px] border-[hsl(var(--sidebar-primary)/.15)]" />
        <div className="pointer-events-none absolute bottom-[-100px] right-40 h-52 w-52 rounded-full border-[18px] border-[hsl(var(--accent)/.25)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p className="forma-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--sidebar-primary))]">A coach-ready foundation</p>
            <h2 className="forma-display mt-5 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.07em] sm:text-6xl">
              Less dashboard.
              <br />
              <span className="text-[hsl(var(--sidebar-primary))]">More signal.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-[hsl(var(--sidebar-foreground)/.62)]">
              Forma keeps the athlete's training space personal — and gives you just enough context to make the next conversation better.
            </p>
          </div>
          <div className="rounded-2xl border border-[hsl(var(--sidebar-foreground)/.12)] bg-[hsl(var(--sidebar-foreground)/.06)] p-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="forma-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.56)]">Workspace status</span>
              <span className="flex items-center gap-2 text-xs text-[hsl(var(--sidebar-primary))]">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Ready to grow
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className="forma-display text-5xl font-semibold tracking-[-.08em]">01</span>
              <span className="mb-2 text-xs text-[hsl(var(--sidebar-foreground)/.56)]">athlete space connected</span>
            </div>
          </div>
        </div>
      </section>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {lanes.map(({ icon: Icon, title, body, tone }) => (
          <button
            key={title}
            onClick={() => setActiveLane(title)}
            data-testid={`button-coach-lane-${title.toLowerCase()}`}
            className={`group rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 ${
              activeLane === title ? 'border-[hsl(var(--primary)/.5)] bg-[hsl(var(--primary)/.1)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
            }`}
          >
            <div
              className={`mb-8 flex h-10 w-10 items-center justify-center rounded-xl ${
                tone === 'mint' ? 'bg-[hsl(var(--primary)/.16)] text-[hsl(var(--primary))]' : tone === 'orange' ? 'bg-[hsl(var(--accent)/.16)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]'
              }`}
            >
              <Icon size={19} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="forma-display text-xl font-semibold tracking-[-.04em]">{title}</h3>
              <ArrowUpRight size={17} className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{body}</p>
          </button>
        ))}
      </div>
      <section className="grid gap-5 lg:grid-cols-[1fr_.7fr]">
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="forma-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Next up</p>
              <h3 className="forma-display mt-2 text-2xl font-semibold tracking-[-.05em]">{activeLane} workspace</h3>
            </div>
            <span className="rounded-lg bg-[hsl(var(--secondary))] px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Foundation</span>
          </div>
          <EmptyBlock title={`Your ${activeLane.toLowerCase()} starts here`}>
            Connect more athletes and Forma will turn their consistent work into a focused view for you.
          </EmptyBlock>
        </div>
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.54)] p-6 sm:p-7">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <p className="forma-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Build the room</p>
              <Layers3 size={18} className="text-[hsl(var(--primary))]" />
            </div>
            <p className="forma-display mt-7 text-3xl font-semibold leading-tight tracking-[-.06em]">One clean place for the coaching conversation.</p>
            <button
              onClick={() => setActiveLane('Programs')}
              data-testid="button-add-program"
              className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--foreground))] px-4 text-sm font-bold text-[hsl(var(--background))]"
            >
              <Plus size={16} />
              Start a program
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
