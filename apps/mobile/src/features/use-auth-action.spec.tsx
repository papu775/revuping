import { act, renderHook } from '@testing-library/react-native';
import { useAuthAction } from './use-auth-action';
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => () => void) =>
    require('react').useEffect(effect, [effect]),
}));

describe('native blocking action lifecycle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it('blocks repeated taps and clears network failures', async () => {
    const { result } = renderHook(useAuthAction);
    let reject!: (value: Error) => void;
    const action = jest.fn(
      () =>
        new Promise((_, failure) => {
          reject = failure;
        }),
    );
    const success = jest.fn(),
      failure = jest.fn();
    let flight!: Promise<void>;
    act(() => {
      flight = result.current.run('Creating…', action, success, failure);
    });
    await act(async () => {
      await result.current.run('Creating…', action, success, failure);
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(true);
    await act(async () => {
      reject(new Error('network'));
      await flight;
    });
    expect(result.current.pending).toBe(false);
    expect(failure).toHaveBeenCalledTimes(1);
  });
  it('times out and ignores delayed completion', async () => {
    const { result } = renderHook(useAuthAction);
    let finish!: (value: string) => void;
    const success = jest.fn(),
      failure = jest.fn();
    let flight!: Promise<void>;
    act(() => {
      flight = result.current.run(
        'Resetting…',
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
    await act(async () => {
      finish('late');
    });
    expect(success).not.toHaveBeenCalled();
    expect(failure).toHaveBeenCalledTimes(1);
  });
  it('cancels on navigation blur/unmount without publishing stale feedback', async () => {
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
