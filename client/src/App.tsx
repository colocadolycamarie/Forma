import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Switch } from 'wouter';
import type { ReactNode } from 'react';
import type { PublicUser } from '@forma/shared';
import { useCurrentUser } from '@/hooks/use-auth';
import { ThemeProvider } from '@/hooks/use-theme';
import { AppShell } from '@/components/app-shell';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { LoadingBlock } from '@/components/page-states';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup';
import HomePage from '@/pages/home';
import TrainPage from '@/pages/train';
import ProgressPage from '@/pages/progress';
import CoachPage from '@/pages/coach';
import RosterPage from '@/pages/roster';
import NotFoundPage from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function AuthGate({ children }: { children: (user: PublicUser) => ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] p-6">
        <LoadingBlock label="Loading Forma" />
      </div>
    );
  }

  if (!user) {
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
  if (isLoading) return null;
  if (user) return <Redirect to="/" />;
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
