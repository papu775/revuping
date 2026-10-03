'use client';
import { useEffect, useRef, useState } from 'react';

// Only explicit blocking actions use this hook; background session reads stay local.
export function useAuthAction() {
  const [label, setLabel] = useState<string | null>(null);
  const flight = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      flight.current?.abort();
      flight.current = null;
    };
  }, []);
  async function run<T>(
    actionLabel: string,
    action: (signal: AbortSignal) => Promise<T>,
    success: (result: T) => void,
    failure: (error: unknown) => void,
  ) {
    if (flight.current || !alive.current) return;
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
      if (alive.current && flight.current === controller) success(result);
    } catch (error) {
      if (alive.current && flight.current === controller) failure(error);
    } finally {
      clearTimeout(timeout);
      if (alive.current && flight.current === controller) {
        flight.current = null;
        setLabel(null);
      }
    }
  }
  return { pending: label !== null, label, run };
}
