import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

type ToasterToast = Toast & {
  createdAt: number;
};

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const listeners: Array<(toasts: ToasterToast[]) => void> = [];
let memoryState: ToasterToast[] = [];

function addToRemoveQueue(toastId: string) {
  setTimeout(() => {
    memoryState = memoryState.filter((t) => t.id !== toastId);
    listeners.forEach((listener) => {
      listener(memoryState);
    });
  }, TOAST_REMOVE_DELAY);
}

export function toast(props: Omit<Toast, 'id'>) {
  const id = genId();

  const newToast: ToasterToast = {
    ...props,
    id,
    createdAt: Date.now(),
  };

  memoryState = [newToast, ...memoryState].slice(0, TOAST_LIMIT);

  listeners.forEach((listener) => {
    listener(memoryState);
  });

  addToRemoveQueue(id);

  return {
    id,
    dismiss: () => {
      memoryState = memoryState.filter((t) => t.id !== id);
      listeners.forEach((listener) => {
        listener(memoryState);
      });
    },
  };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToasterToast[]>(memoryState);

  const subscribe = useCallback((listener: (toasts: ToasterToast[]) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      memoryState = memoryState.filter((t) => t.id !== toastId);
    } else {
      memoryState = [];
    }
    listeners.forEach((listener) => {
      listener(memoryState);
    });
  }, []);

  // Subscribe to changes
  useState(() => {
    const unsubscribe = subscribe(setToasts);
    return unsubscribe;
  });

  return {
    toasts,
    toast,
    dismiss,
  };
}
