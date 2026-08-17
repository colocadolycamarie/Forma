import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 3;
const TOAST_DISMISS_DELAY_MS = 5000;

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

type Listener = (toasts: ToasterToast[]) => void;

let toasts: ToasterToast[] = [];
const listeners: Listener[] = [];

function emit() {
  for (const listener of listeners) listener(toasts);
}

function dismiss(id: string) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

let counter = 0;

export function toast(input: Omit<ToasterToast, 'id'>) {
  const id = String((counter += 1));
  toasts = [{ ...input, id }, ...toasts].slice(0, TOAST_LIMIT);
  emit();
  setTimeout(() => dismiss(id), TOAST_DISMISS_DELAY_MS);
  return id;
}

export function useToast() {
  const [state, setState] = React.useState(toasts);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { toasts: state, dismiss };
}
