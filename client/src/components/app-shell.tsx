import { BarChart3, Dumbbell, Home, LogOut, Menu, Moon, PersonStanding, Sun, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import type { PublicUser } from '@forma/shared';
import { useAthleteHome } from '@/hooks/use-training';
import { useLogout } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { FormaMark } from '@/components/forma-mark';
import { toast } from '@/hooks/use-toast';

const navItems = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/train', label: 'Train', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/coach', label: 'Coach view', icon: PersonStanding },
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="space-y-2" aria-label="Primary navigation">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = location === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            data-testid={`link-nav-${label.toLowerCase().replace(/\s/g, '-')}`}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
              active
                ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-[4px_4px_0_hsl(var(--accent))]'
                : 'text-[hsl(var(--sidebar-foreground)/.64)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'
            }`}
          >
            <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ user, children }: { user: PublicUser; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const homeQuery = useAthleteHome();
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

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
    logout.mutate(undefined, {
      onError: () => toast({ variant: 'destructive', title: "Couldn't sign out", description: 'Please try again.' }),
    });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
        <FormaMark />
        <div className="mt-14 flex flex-1 flex-col">
          <p className="forma-mono mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sidebar-foreground)/.56)]">Your space</p>
          <NavLinks />
          <div className="mt-auto rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.58)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="forma-mono text-[10px] uppercase tracking-[.17em] text-[hsl(var(--sidebar-foreground)/.55)]">Current streak</span>
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--sidebar-primary))]" />
            </div>
            <p className="forma-display text-2xl font-semibold">
              {homeQuery.data ? homeQuery.data.streakDays : '–'}
              <span className="text-sm font-normal text-[hsl(var(--sidebar-foreground)/.56)]"> days</span>
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--sidebar-foreground)/.56)]">consistent training days</p>
          </div>
        </div>
        <div className="mt-5 border-t border-[hsl(var(--sidebar-border))] pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--secondary-foreground))]">
              {initialsFor(user.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.displayName}</p>
              <p className="truncate text-xs text-[hsl(var(--sidebar-foreground)/.56)]">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              data-testid="button-toggle-theme"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--sidebar-foreground)/.6)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              aria-label="Sign out"
              data-testid="button-logout"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--sidebar-foreground)/.6)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))] disabled:opacity-50"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-[232px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[hsl(var(--border)/.72)] bg-[hsl(var(--background)/.88)] px-5 backdrop-blur-xl md:hidden">
          <button aria-label="Open navigation" data-testid="button-open-navigation" onClick={() => setOpen(true)} ref={menuTriggerRef} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-[hsl(var(--muted))]">
            <Menu size={21} />
          </button>
          <FormaMark />
          <Link href="/train" aria-label="Start training" data-testid="link-mobile-train" className="flex h-11 w-11 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
            <Dumbbell size={18} />
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
              <NavLinks onNavigate={closeMenu} />
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
