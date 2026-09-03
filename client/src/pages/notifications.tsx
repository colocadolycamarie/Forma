import { Bell, Flame, Link2, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useCurrentUser } from '@/hooks/use-auth';
import { useMyCoaches, useRoster } from '@/hooks/use-coaching';
import { useAthleteHome, useTodaySession } from '@/hooks/use-training';
import { EmptyBlock, ErrorBlock, LoadingBlock, PageIntro } from '@/components/page-states';

/**
 * Notifications (spec §2.13 / §6): a plain, reverse-chronological feed.
 * There's no notifications backend in this product yet — no coach-note
 * feature, no push/email delivery — so this page deliberately does not
 * invent placeholder events to fill the space (house rule: empty states
 * describe what's true right now, never fabricate). What it does show is
 * assembled from data that's genuinely real: today's PRs, a fresh coach
 * pairing, a streak crossing a 7-day mark. Everything else is an honest
 * empty state.
 */

type Item = {
  id: string;
  icon: typeof Bell;
  title: string;
  description: string;
  date: Date;
  tone: 'milestone' | 'info';
};

const SEEN_KEY = 'forma.notifications.seen';

function readSeen(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function dayLabel(date: Date): string {
  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const { data: user } = useCurrentUser();
  const isAthlete = user?.role === 'athlete';

  const homeQuery = useAthleteHome({ enabled: isAthlete });
  const sessionQuery = useTodaySession({ enabled: isAthlete });
  const coachesQuery = useMyCoaches({ enabled: isAthlete });
  const rosterQuery = useRoster({ enabled: !isAthlete });

  const isLoading = isAthlete ? homeQuery.isLoading || sessionQuery.isLoading || coachesQuery.isLoading : rosterQuery.isLoading;
  const isError = isAthlete ? homeQuery.isError || sessionQuery.isError || coachesQuery.isError : rosterQuery.isError;

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];

    if (isAthlete) {
      for (const set of sessionQuery.data?.recentSets ?? []) {
        if (!set.isPr) continue;
        list.push({
          id: `pr-${set.id}`,
          icon: Trophy,
          title: `New PR — ${set.exerciseName}`,
          description: `${set.weight} kg × ${set.reps}, logged just now.`,
          date: new Date(set.createdAt),
          tone: 'milestone',
        });
      }
      const streak = homeQuery.data?.streakDays ?? 0;
      if (streak > 0 && streak % 7 === 0) {
        list.push({
          id: `streak-${streak}`,
          icon: Flame,
          title: `${streak}-day streak`,
          description: 'A full week of showing up, back to back.',
          date: new Date(),
          tone: 'milestone',
        });
      }
      for (const coach of coachesQuery.data ?? []) {
        list.push({
          id: `coach-${coach.linkId}`,
          icon: Link2,
          title: `Connected with ${coach.displayName}`,
          description: 'They can now see your streak, volume, and adherence.',
          date: new Date(coach.linkedAt),
          tone: 'info',
        });
      }
    } else {
      for (const athlete of rosterQuery.data ?? []) {
        list.push({
          id: `athlete-${athlete.linkId}`,
          icon: Link2,
          title: `${athlete.displayName} joined your roster`,
          description: `${athlete.email} is now sharing their training with you.`,
          date: new Date(athlete.linkedAt),
          tone: 'info',
        });
      }
    }

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [isAthlete, sessionQuery.data, homeQuery.data, coachesQuery.data, rosterQuery.data]);

  const seenBeforeThisVisit = useRef<string[] | null>(null);
  if (seenBeforeThisVisit.current === null) seenBeforeThisVisit.current = readSeen();

  useEffect(() => {
    if (items.length === 0) return;
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(items.map((item) => item.id)));
  }, [items]);

  if (isLoading) {
    return (
      <>
        <PageIntro eyebrow="What's new" title="Reading the ledger." />
        <LoadingBlock label="Loading notifications" />
      </>
    );
  }
  if (isError) {
    return (
      <>
        <PageIntro eyebrow="What's new" title="A small reset." />
        <ErrorBlock onRetry={() => { homeQuery.refetch(); sessionQuery.refetch(); coachesQuery.refetch(); rosterQuery.refetch(); }} />
      </>
    );
  }
  if (items.length === 0) {
    return (
      <>
        <PageIntro eyebrow="What's new" title="Nothing yet.">
          Coach notes and milestones will show up here as they happen — nothing invented, nothing to scroll through until then.
        </PageIntro>
        <EmptyBlock title="Quiet for now">
          {isAthlete ? 'Log a session or hit a PR and it will land here first.' : 'Once an athlete joins your roster, it will show up here.'}
        </EmptyBlock>
      </>
    );
  }

  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const label = dayLabel(item.date);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }

  return (
    <div>
      <PageIntro eyebrow="What's new" title="Notifications.">
        Grouped by day, most recent first — the same ledger logic as everything else here.
      </PageIntro>

      <div className="space-y-8">
        {[...groups.entries()].map(([label, groupItems]) => (
          <section key={label}>
            <p className="forma-mono mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">{label}</p>
            <div className="ledger-divide overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              {groupItems.map((item) => {
                const unread = !seenBeforeThisVisit.current?.includes(item.id);
                const Icon = item.icon;
                return (
                  <div key={item.id} data-testid={`row-notification-${item.id}`} className="flex items-start gap-4 px-5 py-4">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        item.tone === 'milestone' ? 'bg-[hsl(var(--accent)/.16)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${unread ? 'bg-[hsl(var(--primary))]' : 'border border-[hsl(var(--muted-foreground)/.4)]'}`}
                        />
                        <span className="sr-only">{unread ? 'Unread' : 'Read'}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{item.description}</p>
                    </div>
                    <span className="forma-mono shrink-0 text-[10px] text-[hsl(var(--muted-foreground))]">
                      {item.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
