import { Bell, BarChart3, ChevronUp, CircleHelp, Dumbbell, Home, LogOut, Menu, Moon, PersonStanding, Settings, Sun, UsersRound, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import type { PublicUser } from '@forma/shared';
import { useAthleteHome } from '@/hooks/use-training';
import { useLogout } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { FormaMark } from '@/components/forma-mark';
import { toast } from '@/hooks/use-toast';

const athleteNavItems = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/train', label: 'Train', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/coach', label: 'Your coach', icon: PersonStanding },
];

const coachNavItems = [{ href: '/coach', label: 'Roster', icon: UsersRound }];

// Account-level nav lives at the bottom of every role's nav, visually
// separated by its own label rather than mixed into "Your space" — none
// of these are training-level actions (spec §6, Settings/Notifications/
// Help sections).
const accountNavItems = [
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: CircleHelp },
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function NavLink({ href, label, icon: Icon, onNavigate }: { href: string; label: string; icon: typeof Home; onNavigate?: () => void }) {
  const [location] = useLocation();
  const active = location === href;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      data-testid={`link-nav-${label.toLowerCase().replace(/\s/g, '-')}`}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
        active
          ? 'shadow-stamp-md bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]'
          : 'text-[hsl(var(--sidebar-foreground)/.64)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'
      }`}
    >
      <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
      <span>{label}</span>
    </Link>
  );
}

function NavLinks({ role, onNavigate }: { role: PublicUser['role']; onNavigate?: () => void }) {
  const navItems = role === 'coach' ? coachNavItems : athleteNavItems;
  return (
    <nav className="space-y-2" aria-label="Primary navigation">
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

// Rendered as its own group, separated by a thin rule and its own label —
// account-level settings shouldn't visually compete with the training nav
// above it (spec §6).
function AccountNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="mt-6 space-y-2 border-t border-[hsl(var(--sidebar-border))] pt-5" aria-label="Account navigation">
      {accountNavItems.map((item) => (
        <NavLink key={item.href} {...item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function AppShell({ user, children }: { user: PublicUser; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [location] = useLocation();
  const isAthlete = user.role === 'athlete';
  const homeQuery = useAthleteHome({ enabled: isAthlete });
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Move focus to the new page's content on client-side navigation, the way
    // a full page load resets focus to <body> — otherwise keyboard/screen-reader
    // users get no signal the route changed and focus stays wherever it was.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [location]);

  const closeMenu = () => {
    setOpen(false);
    menuTriggerRef.current?.focus();
  };

  const closeAccountMenu = () => {
    setAccountMenuOpen(false);
    accountTriggerRef.current?.focus();
  };

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountMenuRef.current?.contains(target) || accountTriggerRef.current?.contains(target)) return;
      setAccountMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAccountMenu();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!open) return;

    const panel = menuPanelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleLogout = () => {
    setAccountMenuOpen(false);
    logout.mutate(undefined, {
      onError: () => toast({ variant: 'destructive', title: "Couldn't sign out", description: 'Please try again.' }),
    });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
        <FormaMark size="lg" />
        <div className="mt-14 flex flex-1 flex-col">
          <p className="forma-mono mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sidebar-foreground)/.56)]">Your space</p>
          <NavLinks role={user.role} />
          <AccountNavLinks />
          {isAthlete && (
            <div className="shadow-stamp-sm mt-auto rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.58)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="forma-mono text-[10px] uppercase tracking-[.17em] text-[hsl(var(--sidebar-foreground)/.55)]">Current streak</span>
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--sidebar-primary))]" />
              </div>
              <p className="forma-display tabular-figures text-2xl font-semibold">
                {homeQuery.data ? homeQuery.data.streakDays : '–'}
                <span className="text-sm font-normal text-[hsl(var(--sidebar-foreground)/.56)]"> days</span>
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--sidebar-foreground)/.56)]">consistent training days</p>
            </div>
          )}
        </div>
        <div className="relative mt-5 border-t border-[hsl(var(--sidebar-border))] pt-5">
          {accountMenuOpen && (
            <div
              ref={accountMenuRef}
              role="menu"
              aria-label="Account menu"
              className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  toggleTheme();
                  closeAccountMenu();
                }}
                data-testid="button-toggle-theme"
                className="flex min-h-11 w-full items-center gap-3 px-4 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.85)] hover:bg-[hsl(var(--sidebar-accent))]"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={logout.isPending}
                data-testid="button-logout"
                className="flex min-h-11 w-full items-center gap-3 border-t border-[hsl(var(--sidebar-border))] px-4 text-sm font-semibold text-[hsl(var(--sidebar-foreground)/.85)] hover:bg-[hsl(var(--sidebar-accent))] disabled:opacity-50"
              >
                <LogOut size={16} />
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
          <button
            type="button"
            ref={accountTriggerRef}
            onClick={() => setAccountMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            data-testid="button-account-menu"
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-[hsl(var(--sidebar-accent))]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--secondary-foreground))]">
              {initialsFor(user.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.displayName}</p>
              <p className="truncate text-xs text-[hsl(var(--sidebar-foreground)/.56)]">{user.email}</p>
            </div>
            <ChevronUp size={15} className={`shrink-0 text-[hsl(var(--sidebar-foreground)/.5)] transition-transform ${accountMenuOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      <div className="md:pl-[232px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[hsl(var(--border)/.72)] bg-[hsl(var(--background)/.88)] px-5 backdrop-blur-xl md:hidden">
          <button aria-label="Open navigation" data-testid="button-open-navigation" onClick={() => setOpen(true)} ref={menuTriggerRef} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-[hsl(var(--muted))]">
            <Menu size={21} />
          </button>
          <FormaMark />
          <Link
            href={isAthlete ? '/train' : '/coach'}
            aria-label={isAthlete ? 'Start training' : 'View roster'}
            data-testid="link-mobile-train"
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
          >
            {isAthlete ? <Dumbbell size={18} /> : <UsersRound size={18} />}
          </Link>
        </header>

        {open && (
          <div ref={menuPanelRef} role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed inset-0 z-50 bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))] md:hidden">
            <div className="flex items-center justify-between">
              <FormaMark />
              <button aria-label="Close navigation" data-testid="button-close-navigation" onClick={closeMenu} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-[hsl(var(--sidebar-accent))]">
                <X size={21} />
              </button>
            </div>
            <div className="mt-14">
              <NavLinks role={user.role} onNavigate={closeMenu} />
              <AccountNavLinks onNavigate={closeMenu} />
            </div>
            <div className="mt-8 space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                data-testid="button-mobile-toggle-theme"
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent))]"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? 'Light theme' : 'Dark theme'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                data-testid="button-mobile-logout"
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent))] disabled:opacity-50"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        )}

        <main ref={mainRef} tabIndex={-1} className="mx-auto max-w-[1280px] px-5 py-7 outline-none sm:px-8 lg:px-12 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
