import { act, fireEvent, render } from '@testing-library/react-native';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  View,
  type KeyboardEvent,
} from 'react-native';
import { AuthBlocker, ToastProvider } from 'mobile-ui';
import { ApiRequestError } from 'api-contracts';
import SignupScreen from '../app/(auth)/signup';

let mockDark = false;
let mockReduced = true;
const mockRegister = jest.fn();
const mockPublicAction = jest.fn();
jest.mock('../data-access/auth-context', () => ({
  useAuth: () => ({
    client: { register: mockRegister, publicAction: mockPublicAction },
  }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (effect: () => () => void) =>
    require('react').useEffect(effect, [effect]),
}));
jest.mock('mobile-tokens', () => {
  const actual = jest.requireActual('mobile-tokens');
  return {
    ...actual,
    useTheme: () => ({
      colors: mockDark ? actual.darkColors : actual.lightColors,
    }),
    useReducedMotion: () => mockReduced,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 24, left: 0, right: 0, bottom: 20 }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon' }));

describe('native authentication feedback rendering', () => {
  it('keeps the panel above an already open keyboard without double-padding a resized window', () => {
    const callbacks: Record<string, (event: KeyboardEvent) => void> = {};
    const original = Keyboard.addListener.bind(Keyboard);
    const listener = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((name, callback) => {
        callbacks[name] = callback;
        return original(name, callback);
      });
    try {
      const view = render(
        <AuthBlocker label={null} onCancel={() => undefined}>
          <Text>Form</Text>
        </AuthBlocker>,
      );
      act(() =>
        callbacks.keyboardDidShow({
          duration: 0,
          easing: 'keyboard',
          endCoordinates: { screenX: 0, screenY: 360, width: 390, height: 280 },
        }),
      );
      view.rerender(
        <AuthBlocker label="Logging you in…" onCancel={() => undefined}>
          <Text>Form</Text>
        </AuthBlocker>,
      );
      fireEvent(view.getByTestId('auth-loading-backdrop'), 'layout', {
        nativeEvent: { layout: { height: 640 } },
      });
      expect(
        StyleSheet.flatten(
          view.getByTestId('auth-loading-backdrop').props.style,
        ).paddingBottom,
      ).toBe(304);
      fireEvent(view.getByTestId('auth-loading-backdrop'), 'layout', {
        nativeEvent: { layout: { height: 360 } },
      });
      expect(
        StyleSheet.flatten(
          view.getByTestId('auth-loading-backdrop').props.style,
        ).paddingBottom,
      ).toBe(44);
    } finally {
      listener.mockRestore();
    }
  });
  beforeEach(() => {
    jest.useFakeTimers();
    mockRegister.mockReset();
    mockPublicAction.mockReset();
  });
  afterEach(() => {
    mockDark = false;
    mockReduced = true;
    jest.useRealTimers();
  });
  it.each([false, true])(
    'blocks covered controls with accessible, reduced-motion feedback (dark=%s)',
    (dark) => {
      mockDark = dark;
      const cancel = jest.fn();
      const view = render(
        <AuthBlocker label="Creating your account…" onCancel={cancel}>
          <Text>Form contents</Text>
        </AuthBlocker>,
      );
      act(() => jest.advanceTimersByTime(120));
      expect(
        view.getByRole('progressbar', { name: 'Creating your account…' }),
      ).toBeTruthy();
      const covered = view
        .UNSAFE_getAllByType(View)
        .find(
          (node) =>
            node.props.importantForAccessibility === 'no-hide-descendants',
        );
      expect(covered?.props.pointerEvents).toBe('none');
      expect(view.UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
      act(() => view.UNSAFE_getByType(Modal).props.onRequestClose());
      expect(cancel).toHaveBeenCalledTimes(1);
      view.rerender(
        <AuthBlocker label={null} onCancel={cancel}>
          <Text>Form contents</Text>
        </AuthBlocker>,
      );
      expect(view.queryByRole('progressbar')).toBeNull();
      expect(view.getByText('Form contents')).toBeTruthy();
    },
  );
  function form() {
    const view = render(
      <ToastProvider>
        <SignupScreen />
      </ToastProvider>,
    );
    fireEvent.changeText(view.getByLabelText('Your name'), 'Native Test');
    fireEvent.changeText(view.getByLabelText('Email'), 'test@example.test');
    fireEvent.changeText(
      view.getByLabelText('Password'),
      'A valid test passphrase',
    );
    return view;
  }
  it('confirms registration once and retains guidance plus resend after toast dismissal', async () => {
    let finish!: (value: { message: string }) => void;
    mockRegister.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const view = form();
    const button = view.getByRole('button', { name: 'Create account' });
    fireEvent.press(button);
    fireEvent.press(button);
    expect(mockRegister).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish({ message: 'Check your email for verification. If you already have an account, log in or reset your password.' });
    });
    expect(
      view.getAllByText('Check your email for verification. If you already have an account, log in or reset your password.'),
    ).toHaveLength(2);
    fireEvent.press(view.getByLabelText('Dismiss notification'));
    expect(
      view.getByText('Check your email for verification. If you already have an account, log in or reset your password.'),
    ).toBeTruthy();
    expect(
      view.getByRole('button', { name: 'Resend verification email' }),
    ).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Create account' })).toBeNull();
    expect(view.getByText('Check your email')).toBeTruthy();
  });
  it('uses confirmed partial creation to offer resend, never a false success', async () => {
    mockRegister.mockRejectedValue(
      new ApiRequestError(
        503,
        'safe-id',
        'REGISTRATION_VERIFICATION_UNAVAILABLE',
      ),
    );
    const view = form();
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Create account' }));
    });
    expect(
      view.getAllByText(/Your account was created, but/).length,
    ).toBeGreaterThan(0);
    expect(
      view.queryByText('Check your email for verification. If you already have an account, log in or reset your password.'),
    ).toBeNull();
    expect(
      view.getByRole('button', { name: 'Resend verification email' }),
    ).toBeTruthy();
  });
  it('preserves entered values on network failure and keeps validation inline', async () => {
    mockRegister.mockRejectedValue(new Error('INTERNAL_SECRET'));
    const view = form();
    fireEvent.changeText(view.getByLabelText('Password'), 'short');
    fireEvent.press(view.getByRole('button', { name: 'Create account' }));
    expect(mockRegister).not.toHaveBeenCalled();
    expect(view.queryByLabelText('Dismiss notification')).toBeNull();
    fireEvent.changeText(
      view.getByLabelText('Password'),
      'A valid test passphrase',
    );
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Create account' }));
    });
    expect(view.getByLabelText('Password').props.value).toBe(
      'A valid test passphrase',
    );
    expect(view.queryByText(/INTERNAL_SECRET/)).toBeNull();
    expect(view.queryByRole('progressbar')).toBeNull();
  });
});
