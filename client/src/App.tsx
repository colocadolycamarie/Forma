import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Switch, useLocation } from 'wouter';
import type { ReactNode } from 'react';
import type { PublicUser } from '@forma/shared';
import { useCurrentUser } from '@/hooks/use-auth';
import { ThemeProvider } from '@/hooks/use-theme';
import { AppShell } from '@/components/app-shell';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { SplashScreen } from '@/components/splash-screen';
import LandingPage from '@/pages/landing';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';
import HomePage from '@/pages/home';
import TrainPage from '@/pages/train';
import ProgressPage from '@/pages/progress';
import CoachPage from '@/pages/coach';
import RosterPage from '@/pages/roster';
import AthleteDetailPage from '@/pages/roster-athlete-detail';
import SettingsPage from '@/pages/settings';
import NotificationsPage from '@/pages/notifications';
import HelpPage from '@/pages/help';
import VerifyEmailPage from '@/pages/verify-email';
import NotFoundPage from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function AuthGate({ children }: { children: (user: PublicUser) => ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const [location] = useLocation();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    // The public marketing page lives at "/" for signed-out visitors. A
    // deep link to any other authenticated route (e.g. a bookmarked
    // /train) still goes straight to login instead — showing a marketing
    // page there would just be a confusing detour.
    if (location === '/') {
      return <LandingPage />;
    }
    return <Redirect to="/login" />;
  }

  return <>{children(user)}</>;
}

function AuthenticatedApp() {
  return (
    <AuthGate>
      {(user) => (
        <AppShell user={user}>
          {user.role === 'coach' ? (
            <Switch>
              <Route path="/coach" component={RosterPage} />
              <Route path="/coach/:athleteId" component={AthleteDetailPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route path="/help" component={HelpPage} />
              <Route path="/">
                <Redirect to="/coach" />
              </Route>
              <Route path="/train">
                <Redirect to="/coach" />
              </Route>
              <Route path="/progress">
                <Redirect to="/coach" />
              </Route>
              <Route component={NotFoundPage} />
            </Switch>
          ) : (
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/train" component={TrainPage} />
              <Route path="/progress" component={ProgressPage} />
              <Route path="/coach" component={CoachPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route path="/help" component={HelpPage} />
              <Route component={NotFoundPage} />
            </Switch>
          )}
        </AppShell>
      )}
    </AuthGate>
  );
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  if (isLoading) return <SplashScreen />;
  if (user) return <Redirect to="/" />;
  return <>{children}</>;
}

// Verify Email (spec §6/§7.1) is reachable only once a session exists —
// it's a post-signup nudge, not a public page — but it deliberately
// doesn't render inside AppShell's sidebar chrome, since it's a single,
// centered utility moment like Login/Signup, not a place someone browses.
function RequireAuthNoShell({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  if (isLoading) return <SplashScreen />;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ErrorBoundary>
          <Switch>
            <Route path="/login">
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            </Route>
            <Route path="/signup">
              <GuestOnly>
                <SignupPage />
              </GuestOnly>
            </Route>
            <Route path="/forgot-password">
              <GuestOnly>
                <ForgotPasswordPage />
              </GuestOnly>
            </Route>
            <Route path="/reset-password">
              <GuestOnly>
                <ResetPasswordPage />
              </GuestOnly>
            </Route>
            <Route path="/verify-email">
              <RequireAuthNoShell>
                <VerifyEmailPage />
              </RequireAuthNoShell>
            </Route>
            <Route>
              <AuthenticatedApp />
            </Route>
          </Switch>
          <Toaster />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
