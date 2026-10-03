import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useAuthAction() {
  const [label, setLabel] = useState<string | null>(null);
  const flight = useRef<AbortController | null>(null);
  const focused = useRef(true);
  const cancel = useCallback(() => {
    flight.current?.abort();
    flight.current = null;
    setLabel(null);
  }, []);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        cancel();
      };
    }, [cancel]),
  );
  async function run<T>(
    actionLabel: string,
    action: (signal: AbortSignal) => Promise<T>,
    success: (result: T) => void,
    failure: (error: unknown) => void,
  ) {
    if (flight.current || !focused.current) return;
    const controller = new AbortController();
    flight.current = controller;
    setLabel(actionLabel);
    const timeout = setTimeout(() => controller.abort(), 20000);
    const cancelled = new Promise<never>((_, reject) => {
      controller.signal.addEventListener(
        'abort',
        () => reject(new Error('Action cancelled or timed out')),
        { once: true },
      );
    });
    try {
      const result = await Promise.race([action(controller.signal), cancelled]);
      if (focused.current && flight.current === controller) success(result);
    } catch (error) {
      if (focused.current && flight.current === controller) failure(error);
    } finally {
      clearTimeout(timeout);
      if (focused.current && flight.current === controller) {
        flight.current = null;
        setLabel(null);
      }
    }
  }
  return { pending: label !== null, label, run, cancel };
}
