import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { FormaMark } from '@/components/forma-mark';
import { DuotonePhoto } from '@/components/duotone-photo';
import { Reveal } from '@/components/reveal';

export default function LandingPage() {
  const [navSolid, setNavSolid] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavSolid(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header
        className={`fixed inset-x-0 top-0 z-40 flex h-[76px] w-full items-center justify-between px-5 transition-colors duration-300 sm:px-8 lg:px-12 ${
          navSolid ? 'border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.9)] text-[hsl(var(--foreground))] backdrop-blur-xl' : 'text-[hsl(var(--sidebar-foreground))]'
        }`}
      >
        <FormaMark size="lg" />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            data-testid="link-landing-login"
            className={`hidden min-h-11 items-center rounded-xl px-4 text-sm font-semibold sm:inline-flex ${navSolid ? 'hover:bg-[hsl(var(--muted))]' : 'hover:bg-white/10'}`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            data-testid="link-landing-signup"
            className="inline-flex min-h-11 items-center rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero: a real, full-bleed photo IS the section's background — one
          continuous surface, not an image block sitting above a solid
          text panel. A single soft gradient (not two competing overlays)
          keeps the photo's grain visible even behind the copy, and
          text-shadow (not opacity) does the rest of the legibility work,
          so the frame reads as one photograph with type set into it. The
          text itself is built as two unequal blocks in one bottom-aligned
          row rather than a stacked column: an oversized headline on the
          left, and a narrow "text well" — eyebrow, supporting line, CTAs
          — on the right, divided by a single hairline rule like a ruled
          margin, the one recurring device from Forma's own ledger system
          reappearing at hero scale. Sized to the frame itself rather than
          a full viewport height, so nothing sits below the fold. */}
      <section className="relative isolate flex min-h-[560px] flex-col overflow-hidden sm:min-h-[640px] lg:min-h-[760px] xl:min-h-[820px]">
        <div className="absolute inset-0 h-full w-full">
          <DuotonePhoto
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1800&q=80&auto=format&fit=crop"
            alt="Weight plates and a barbell resting on a gym floor"
            tint="sidebar"
            focal="60% 35%"
            className="h-full w-full"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--sidebar)/.78)] via-[hsl(var(--sidebar)/.4)] to-transparent" />

        {/* Marginalia: a running vertical label along the right edge,
            intentionally cropped by the frame — a small nod to the
            page-margin notation of an actual logbook, not decoration. */}
        <div
          className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block"
          style={{ writingMode: 'vertical-rl' }}
          aria-hidden="true"
        >
          <span className="forma-mono whitespace-nowrap text-[10px] font-bold uppercase tracking-[.32em] text-[hsl(var(--sidebar-foreground)/.5)]">
            Forma — a training log
          </span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-end px-5 pb-12 pt-28 sm:px-8 sm:pb-14 sm:pt-32 lg:px-12 lg:pb-16 lg:pt-36">
          <div className="lg:flex lg:items-end lg:gap-12">
            <h1 className="forma-display stagger-in stagger-1 text-[12vw] font-semibold leading-[.9] tracking-[-.05em] text-[hsl(var(--sidebar-foreground))] sm:text-6xl lg:max-w-[58%] lg:text-[5rem] xl:text-[5.75rem]">
              Not everything
              <br />
              needs to be shared.
              <br />
              <span className="text-[hsl(var(--sidebar-primary))]">Just logged.</span>
            </h1>

            {/* The text well — set apart by a rule rather than stacked
                beneath the headline, so headline and supporting copy read
                as two distinct blocks in the same horizontal band. */}
            <div className="stagger-in stagger-2 mt-8 max-w-xs border-t border-[hsl(var(--sidebar-foreground)/.3)] pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="forma-mono mb-3 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--sidebar-primary))]">
                A training log, not a feed
              </p>
              <p className="text-sm leading-6 text-[hsl(var(--sidebar-foreground)/.9)] sm:text-base sm:leading-7">
                Every set, every streak, read plainly — without asking you to perform your training for anyone.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  data-testid="link-hero-signup"
                  className="inline-flex min-h-12 items-center rounded-xl bg-[hsl(var(--sidebar-primary))] px-5 text-sm font-bold text-[hsl(var(--sidebar-primary-foreground))] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Start logging
                </Link>
                <Link
                  href="/login"
                  data-testid="link-hero-login"
                  className="inline-flex min-h-12 items-center rounded-xl border border-[hsl(var(--sidebar-foreground)/.5)] px-5 text-sm font-semibold text-[hsl(var(--sidebar-foreground))] transition-colors duration-200 hover:border-[hsl(var(--sidebar-foreground))] hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Static ledger strip — the plain-facts line now sits still, read
          left to right like an entry in a logbook rather than looping
          past the eye. One deliberate rule above and below, no motion. */}
      <div className="border-y border-[hsl(var(--border))] bg-[hsl(var(--accent))] px-5 py-3 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-x-8 gap-y-1.5 sm:justify-between">
          {['Log every set', 'Track your streak', 'Train solo or with a coach', 'No feed. No badges. No noise.'].map((line) => (
            <span key={line} className="forma-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent-foreground))]">
              {line}
            </span>
          ))}
        </div>
      </div>

      {/* The problem, built on the same frame as the hero: an oversized
          headline on the left, a narrow eyebrow + text well on the right
          divided by a single rule — the exact device the hero uses, so
          the two sections read as the same hand. A compact horizontal
          strip of three facts follows, divided by rule instead of
          stacked as tall rows. */}
      <Reveal className="px-5 pb-14 pt-14 sm:px-8 sm:pb-16 sm:pt-16 lg:px-12 lg:pt-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <h2 className="forma-display -ml-1 max-w-[15ch] text-[10vw] font-semibold leading-[.98] tracking-[-.05em] sm:text-5xl lg:col-span-8 lg:max-w-none lg:text-6xl xl:text-[4.5rem]">
              Training data has a shelf life of one scroll.
            </h2>
            <div className="mt-8 max-w-xs border-t border-[hsl(var(--border))] pt-6 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:max-w-none lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="forma-mono mb-3 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--muted-foreground)/.7)]">The problem</p>
              <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base sm:leading-7">
                Most fitness apps are built to keep you scrolling, not to keep you training. Forma throws out the feed and keeps the one thing that actually matters — an exact, ordered record of what you did, week over week.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-8 border-t border-[hsl(var(--border))] pt-10 lg:mt-14 lg:grid-cols-12 lg:gap-x-8 lg:pt-12">
            {[
              { n: '01', t: 'Every set has a number', d: 'Weight, reps, RPE — logged the moment you rack the bar, not reconstructed from memory afterward.', span: 'lg:col-span-3' },
              { n: '02', t: 'Streaks are earned, not staged', d: "A calendar that tells you the truth about which weeks you actually showed up, and which you didn't.", span: 'lg:col-span-3 lg:col-start-5' },
              { n: '03', t: 'Nothing to perform', d: 'No likes, no leaderboard, no algorithm deciding which session deserves attention.', span: 'lg:col-span-4 lg:col-start-9' },
            ].map((row) => (
              <div key={row.n} className={row.span}>
                <span className="forma-mono block text-xs font-bold text-[hsl(var(--muted-foreground)/.6)]">{row.n}</span>
                <h3 className="forma-display mt-2 text-xl font-semibold tracking-[-.03em] sm:text-2xl">{row.t}</h3>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{row.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Athlete / coach, mirrored: two equal columns inside one
          contained frame, divided by a single vertical rule. */}
      <Reveal className="px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-10 border-y border-[hsl(var(--border))] py-10 sm:grid-cols-2 sm:gap-0 sm:py-14">
            <div className="sm:border-r sm:border-[hsl(var(--border))] sm:pr-14 lg:pr-20">
              <p className="forma-mono mb-4 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--primary-text))]">For the athlete</p>
              <h3 className="forma-display max-w-sm text-3xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-4xl">Log it yourself. Read it later.</h3>
              <p className="mt-5 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base sm:leading-7">
                Open Forma before you touch the bar, close it after your last set. The streak, the volume, the trend line — all of it builds itself from there.
              </p>
              <Link
                href="/signup?role=athlete"
                data-testid="link-landing-signup-athlete"
                className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[hsl(var(--foreground))] px-5 text-sm font-bold text-[hsl(var(--background))]"
              >
                Start as an athlete
              </Link>
            </div>
            <div className="sm:pl-14 lg:pl-20">
              <p className="forma-mono mb-4 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--accent-text))]">For the coach</p>
              <h3 className="forma-display max-w-sm text-3xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-4xl">One code. A roster you can actually read.</h3>
              <p className="mt-5 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base sm:leading-7">
                Share a single code and see every athlete's real numbers — sets logged, streaks intact, adherence at a glance. No spreadsheet, no weekly check-in message.
              </p>
              <Link
                href="/signup?role=coach"
                data-testid="link-landing-signup-coach"
                className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[hsl(var(--foreground))] px-5 text-sm font-bold text-[hsl(var(--background))]"
              >
                Start as a coach
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Closing movement, off-grid: the photo no longer spans the full
          width — it occupies an asymmetric block in the upper-left, so
          the headline that follows can bleed across both the grain of
          the photo and the solid dark beneath it, one mass of type
          overlapping two different surfaces. The pace statement shrinks
          to a marginal note in the opposite corner instead of competing
          with the headline for the same scale. */}
      <Reveal className="relative isolate flex min-h-[340px] flex-col justify-center overflow-hidden bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] sm:min-h-[400px] lg:min-h-[460px]">
        <div className="absolute inset-y-0 left-0 h-full w-[78%] sm:w-[62%] lg:w-[52%]">
          <DuotonePhoto
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80&auto=format&fit=crop"
            alt="Weight plates racked on the floor of a gym"
            tint="accent"
            focal="15% 85%"
            className="h-full w-full"
          />
          {/* Two fades, both contained inside the photo's own box: one
              darkens the bottom so the headline stays legible over the
              grain, the other dissolves the right edge into the solid
              background it sits against — no separate mismatched box,
              so no seam. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--sidebar)/.75)] via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-[hsl(var(--sidebar))]" />
        </div>

        {/* Marginal note — a small, quiet annotation in the far corner,
            never competing in scale with the headline below it. */}
        <div className="relative z-10 flex justify-end px-5 sm:px-8 lg:px-12">
          <p className="forma-mono max-w-[15rem] text-right text-[11px] font-semibold uppercase leading-5 tracking-[.1em] text-[hsl(var(--sidebar-foreground)/.6)] sm:max-w-[17rem] sm:text-xs">
            You don't need to chase every session — keep the quality high and let the line move at its own pace.
          </p>
        </div>

        {/* Headline sits alone now — no CTA row beneath it, so the
            section closes on the statement itself rather than a pitch. */}
        <div className="relative z-10 mt-10 px-5 sm:mt-12 sm:px-8 lg:mt-14 lg:px-12">
          <h2 className="forma-display -ml-1 max-w-[92%] text-[16vw] font-semibold leading-[.86] tracking-[-.06em] sm:max-w-[80%] sm:text-7xl lg:-ml-3 lg:max-w-[46%] lg:text-8xl">
            Your bar.
            <br />
            Your bell.
            <br />
            Your log.
          </h2>
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
