import { act, renderHook } from '@testing-library/react';
import { useAuthAction } from './use-auth-action';

describe('blocking authentication lifecycle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it('blocks repeated submissions and clears the overlay on completion', async () => {
    const { result } = renderHook(useAuthAction);
    let finish!: (value: string) => void;
    const action = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );
    const success = jest.fn(),
      failure = jest.fn();
    let flight!: Promise<void>;
    act(() => {
      flight = result.current.run('Creating…', action, success, failure);
    });
    expect(result.current.pending).toBe(true);
    await act(async () => {
      await result.current.run('Creating…', action, success, failure);
    });
    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish('confirmed');
      await flight;
    });
    expect(result.current.pending).toBe(false);
    expect(success).toHaveBeenCalledWith('confirmed');
    expect(failure).not.toHaveBeenCalled();
  });
  it('times out a hung action and ignores its later success', async () => {
    const { result } = renderHook(useAuthAction);
    let finish!: (value: string) => void;
    const success = jest.fn(),
      failure = jest.fn();
    let flight!: Promise<void>;
    act(() => {
      flight = result.current.run(
        'Logging in…',
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
        success,
        failure,
      );
    });
    await act(async () => {
      jest.advanceTimersByTime(20000);
      await flight;
    });
    expect(result.current.pending).toBe(false);
    expect(failure).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish('too late');
    });
    expect(success).not.toHaveBeenCalled();
  });
  it('aborts navigation cleanup without announcing a stale failure', async () => {
    const { result, unmount } = renderHook(useAuthAction);
    let signal!: AbortSignal;
    const success = jest.fn(),
      failure = jest.fn();
    let flight!: Promise<void>;
    act(() => {
      flight = result.current.run(
        'Verifying…',
        (value) => {
          signal = value;
          return new Promise(() => undefined);
        },
        success,
        failure,
      );
    });
    unmount();
    await flight;
    expect(signal.aborted).toBe(true);
    expect(success).not.toHaveBeenCalled();
    expect(failure).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
