import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error — pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[hsl(var(--background))] p-6">
      <div className="w-full max-w-lg rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center">
        <h1 className="forma-display text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          This part of the app hit an error. The rest of Forma is still running.
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[hsl(var(--muted))] p-3 text-left text-xs text-[hsl(var(--foreground))]">
            {error.message || String(error)}
          </pre>
        )}
        <button
          type="button"
          onClick={resetError}
          className="mt-5 min-h-10 rounded-xl bg-[hsl(var(--foreground))] px-4 text-sm font-semibold text-[hsl(var(--background))]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', toError(error), info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
