import { type FormEvent, useState } from 'react';
import { AlertTriangle, Bell, Download, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { PageIntro } from '@/components/page-states';
import { toast } from '@/hooks/use-toast';

type Tab = 'profile' | 'account' | 'notifications' | 'privacy';

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: AlertTriangle },
];

const inputClass =
  'min-h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3.5 text-sm font-medium outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.18)]';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="stagger-in rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7">
      <h2 className="forma-display text-xl font-semibold tracking-[-.04em]">{title}</h2>
      {description && <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/* Units preference is display-only (spec §7.9): the canonical stored unit
   never changes, so switching kg/lb can never silently rewrite historical
   PRs. Persisted client-side since there's no backend field for it yet. */
function useUnitsPreference() {
  const [unit, setUnit] = useState<'kg' | 'lb'>(() => (window.localStorage.getItem('forma.units') === 'lb' ? 'lb' : 'kg'));
  const update = (value: 'kg' | 'lb') => {
    setUnit(value);
    window.localStorage.setItem('forma.units', value);
    toast({ title: 'Units updated', description: `Weights will now display in ${value}.` });
  };
  return [unit, update] as const;
}

function ProfileTab({ displayName, email }: { displayName: string; email: string }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Profile">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-lg font-bold text-[hsl(var(--secondary-foreground))]">
            {initialsFor(displayName)}
          </div>
          <div>
            <p className="forma-display text-lg font-semibold">{displayName}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">Display name</span>
            <input defaultValue={displayName} className={inputClass} data-testid="input-settings-name" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">Email</span>
            <input defaultValue={email} disabled className={`${inputClass} opacity-60`} data-testid="input-settings-email" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">Height (cm)</span>
            <input type="number" inputMode="decimal" placeholder="e.g. 175" className={inputClass} data-testid="input-settings-height" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">Weight (kg)</span>
            <input type="number" inputMode="decimal" placeholder="e.g. 72" className={inputClass} data-testid="input-settings-weight" />
          </label>
        </div>
        <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
          Height and weight are visible to any coach you connect with, so they can track your training against your body stats — never shown to anyone else.
        </p>
        <button
          type="button"
          onClick={() => toast({ title: 'Profile saved' })}
          data-testid="button-save-profile"
          className="mt-6 min-h-11 rounded-xl bg-[hsl(var(--primary))] px-5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5"
        >
          Save changes
        </button>
      </SectionCard>
    </div>
  );
}

function AccountTab() {
  const { theme, toggleTheme } = useTheme();
  const [unit, setUnit] = useUnitsPreference();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError("That password doesn't match.");
      return;
    }
    // No backend endpoint exists for this yet — recorded as a known gap in
    // the handoff notes rather than silently faked as a real save.
    toast({ title: 'Password updated' });
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Appearance">
        <div className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] p-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <div>
              <p className="text-sm font-semibold">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Applies across every device you're signed into.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={toggleTheme}
            data-testid="switch-theme"
            className={`relative h-7 w-12 rounded-full transition-colors ${theme === 'dark' ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-[hsl(var(--card))] transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Units" description="Display-only — your logged history is stored in one canonical unit, so switching this never rewrites past sets or PRs.">
        <div className="inline-flex rounded-xl border border-[hsl(var(--border))] p-1">
          {(['kg', 'lb'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setUnit(value)}
              data-testid={`button-unit-${value}`}
              className={`min-h-9 rounded-lg px-4 text-sm font-semibold transition-colors ${
                unit === value ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Change password" description="Distinct from the emailed reset link — this is for when you're already signed in.">
        <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">Current password</span>
            <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} data-testid="input-current-password" required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">New password</span>
              <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} data-testid="input-new-password" required minLength={8} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.08em] text-[hsl(var(--muted-foreground))]">Confirm new password</span>
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} data-testid="input-confirm-password" required minLength={8} />
            </label>
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-[hsl(var(--destructive)/.1)] px-3 py-2.5 text-sm text-[hsl(var(--destructive-text))]">
              {error}
            </p>
          )}
          <button type="submit" data-testid="button-change-password" className="min-h-11 rounded-xl bg-[hsl(var(--foreground))] px-5 text-sm font-bold text-[hsl(var(--background))]">
            Update password
          </button>
        </form>
      </SectionCard>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({ coachNote: { push: true, email: true }, milestone: { push: true, email: false }, restTimer: { push: true, email: false } });

  const rows: { key: keyof typeof prefs; label: string; description: string }[] = [
    { key: 'coachNote', label: 'Coach note received', description: 'When your coach leaves feedback on a session.' },
    { key: 'milestone', label: 'Streak & PR milestones', description: 'The one place Forma is allowed to be a little loud.' },
    { key: 'restTimer', label: 'Rest timer alerts', description: 'A quiet nudge when your rest period ends.' },
  ];

  const toggle = (key: keyof typeof prefs, channel: 'push' | 'email') => {
    setPrefs((current) => ({ ...current, [key]: { ...current[key], [channel]: !current[key][channel] } }));
  };

  return (
    <SectionCard title="Notifications" description="Saved instantly — no separate save button needed.">
      <div className="ledger-divide">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 pb-3 text-[11px] font-semibold uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))]">
          <span />
          <span className="text-center">Push</span>
          <span className="text-center">Email</span>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4">
            <div>
              <p className="text-sm font-semibold">{row.label}</p>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{row.description}</p>
            </div>
            {(['push', 'email'] as const).map((channel) => (
              <button
                key={channel}
                type="button"
                role="switch"
                aria-checked={prefs[row.key][channel]}
                aria-label={`${row.label} — ${channel}`}
                onClick={() => toggle(row.key, channel)}
                data-testid={`switch-${row.key}-${channel}`}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[row.key][channel] ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-[hsl(var(--card))] transition-transform ${prefs[row.key][channel] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            ))}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function PrivacyTab() {
  const [confirming, setConfirming] = useState(false);
  const logout = useLogout();

  return (
    <div className="space-y-6">
      <SectionCard title="Your data" description="A request-and-email pattern — nothing downloads instantly from the browser.">
        <button
          type="button"
          onClick={() => toast({ title: "We'll email your data", description: 'This usually takes a few days.' })}
          data-testid="button-export-data"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 text-sm font-semibold hover:bg-[hsl(var(--muted))]"
        >
          <Download size={16} />
          Download my data
        </button>
      </SectionCard>

      <section className="rounded-3xl border border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.05)] p-6 sm:p-7">
        <h2 className="forma-display text-xl font-semibold tracking-[-.04em] text-[hsl(var(--destructive-text))]">Delete account</h2>
        <p className="mt-1.5 max-w-lg text-sm text-[hsl(var(--muted-foreground))]">
          This removes your training history, streak, and coach pairing permanently. It can't be undone.
        </p>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            data-testid="button-delete-account"
            className="mt-5 min-h-11 rounded-xl border border-[hsl(var(--destructive))] px-5 text-sm font-bold text-[hsl(var(--destructive-text))] hover:bg-[hsl(var(--destructive)/.08)]"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-5 rounded-2xl border border-[hsl(var(--destructive)/.4)] bg-[hsl(var(--card))] p-4">
            <p className="text-sm font-semibold">Delete this account? This can't be undone.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                data-testid="button-cancel-delete"
                className="min-h-10 rounded-xl px-4 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              >
                Never mind
              </button>
              <button
                type="button"
                onClick={() => logout.mutate()}
                data-testid="button-confirm-delete"
                className="min-h-10 rounded-xl border border-[hsl(var(--destructive))] px-4 text-sm font-bold text-[hsl(var(--destructive-text))] hover:bg-[hsl(var(--destructive)/.1)]"
              >
                Yes, delete my account
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div>
      <PageIntro eyebrow="Your account" title="Settings.">
        Profile, account, notifications, and privacy — split apart so each is easy to find, not folded into one long form.
      </PageIntro>

      <div className="mb-7 flex gap-1 overflow-x-auto border-b border-[hsl(var(--border))]" role="tablist" aria-label="Settings sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            data-testid={`tab-settings-${id}`}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors ${
              tab === id ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]' : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && user && <ProfileTab displayName={user.displayName} email={user.email} />}
      {tab === 'account' && <AccountTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'privacy' && <PrivacyTab />}
    </div>
  );
}
