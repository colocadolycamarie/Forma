import { Link } from 'wouter';
import { FormaMark } from '@/components/forma-mark';
import { Reveal } from '@/components/reveal';

const STANCES = [
  {
    n: '01',
    title: 'On streaks',
    body: "A streak is information, not a leash. Miss a day and it resets — plainly, without a guilt notification chasing you back in. The ledger records what happened. It doesn't editorialize.",
    tone: 'primary' as const,
  },
  {
    n: '02',
    title: 'On data honesty',
    body: "A personal record means your best-ever result at that rep range, calculated the same way every time — never rounded up, never invented to fill an empty week. If you didn't log it, it didn't happen.",
    tone: 'accent' as const,
  },
  {
    n: '03',
    title: 'On coaching',
    body: "A coach sees your real numbers, not a summary written to look good. No editing history, no filtering out the missed weeks. If they're going to program your next block, they should see the actual one.",
    tone: 'sidebar' as const,
  },
];

const toneClasses: Record<(typeof STANCES)[number]['tone'], { border: string; numeral: string }> = {
  primary: { border: 'border-t-[hsl(var(--primary))]', numeral: 'text-[hsl(var(--primary)/.14)]' },
  accent: { border: 'border-t-[hsl(var(--accent))]', numeral: 'text-[hsl(var(--accent)/.14)]' },
  sidebar: { border: 'border-t-[hsl(var(--sidebar))]', numeral: 'text-[hsl(var(--sidebar)/.14)]' },
};

/**
 * The Method (spec §2.2). No photography, no fabricated data — the three
 * stances carry the page on typography alone: a single compact grid
 * instead of three stacked full-height sections, so the whole point gets
 * made without a long scroll. The oversized background numeral on each
 * card is the one purely typographic flourish standing in for imagery.
 */
export default function MethodPage() {
  return (
    <div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="flex h-[76px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <FormaMark size="lg" />
        <Link href="/" className="text-sm font-semibold text-[hsl(var(--foreground))] underline underline-offset-4" data-testid="link-method-back">
          Back home
        </Link>
      </header>

      <section className="px-5 pb-10 pt-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[720px]">
          <p className="forma-mono mb-4 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--primary-text))]">The method</p>
          <h1 className="forma-display text-4xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-5xl">Forma is built to keep you training.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[hsl(var(--muted-foreground))]">
            Most fitness apps are built to keep you scrolling — feeds, badges, leaderboards, all competing for a few more minutes of attention. None of that
            gets a bar off the floor. So we left it out, and built the rest around one idea: a training log you can actually trust.
          </p>
        </div>
      </section>

      <Reveal className="px-5 pb-14 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1180px] gap-4 sm:grid-cols-3">
          {STANCES.map((stance) => (
            <div
              key={stance.n}
              className={`relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] border-t-[3px] bg-[hsl(var(--card))] p-6 ${toneClasses[stance.tone].border}`}
            >
              <span aria-hidden="true" className={`forma-display pointer-events-none absolute -right-2 -top-6 select-none text-[110px] font-bold leading-none tracking-tight ${toneClasses[stance.tone].numeral}`}>
                {stance.n}
              </span>
              <div className="relative">
                <h2 className="forma-display text-xl font-semibold tracking-[-.03em] sm:text-2xl">{stance.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{stance.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="px-5 pb-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1180px] rounded-[28px] bg-[hsl(var(--sidebar))] p-8 text-center text-[hsl(var(--sidebar-foreground))] sm:p-14">
          <h2 className="forma-display mx-auto max-w-lg text-3xl font-semibold leading-tight tracking-[-.05em] sm:text-4xl">Start your log.</h2>
          <Link
            href="/signup"
            data-testid="link-method-signup"
            className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-[hsl(var(--sidebar-primary))] px-6 text-sm font-bold text-[hsl(var(--sidebar-primary-foreground))] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Create your account
          </Link>
        </div>
      </Reveal>

      <footer className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <FormaMark />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">A training log, not a hype machine.</p>
        </div>
      </footer>
    </div>
  );
}
