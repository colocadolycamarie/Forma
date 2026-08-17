import { ArrowUpRight, ClipboardList, Plus, Radar, UsersRound } from 'lucide-react';
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
        A preview of the coaching tools we're building next — pick a section below to see what's planned.
      </PageIntro>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {lanes.map(({ icon: Icon, title, body, tone }) => (
          <button
            key={title}
            onClick={() => setActiveLane(title)}
            data-testid={`button-coach-lane-${title.toLowerCase()}`}
            aria-pressed={activeLane === title}
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
      <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="forma-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Next up</p>
            <h3 className="forma-display mt-2 text-2xl font-semibold tracking-[-.05em]">{activeLane} workspace</h3>
          </div>
          <span className="rounded-lg bg-[hsl(var(--secondary))] px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Not built yet</span>
        </div>
        <EmptyBlock
          title={`${activeLane} isn't available yet`}
          action={
            activeLane !== 'Programs' ? (
              <button
                onClick={() => setActiveLane('Programs')}
                data-testid="button-add-program"
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--foreground))] px-4 text-sm font-bold text-[hsl(var(--background))]"
              >
                <Plus size={16} />
                Preview Programs instead
              </button>
            ) : undefined
          }
        >
          This section is planned but not built — once it ships, this is where you'll {activeLane === 'Roster' ? 'see your athletes' : activeLane === 'Programs' ? 'build training programs' : 'review progress signals'}.
        </EmptyBlock>
      </section>
    </div>
  );
}
