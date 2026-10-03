import { render, fireEvent, act } from '@testing-library/react-native';
import { Field, FilterChips, BottomSheet } from 'mobile-ui';
let mockReducedMotion = true;
jest.mock('mobile-tokens', () => {
  const actual = jest.requireActual('mobile-tokens');
  return {
    ...actual,
    useTheme: () => ({ colors: actual.lightColors }),
    useReducedMotion: () => mockReducedMotion,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon' }));
describe('native controls', () => {
  it('masks passwords and toggles the accessible reveal control', () => {
    const { getByLabelText } = render(
      <Field
        label="Password"
        value="demo-secret"
        onChangeText={() => undefined}
        secureTextEntry
      />,
    );
    expect(getByLabelText('Password').props.secureTextEntry).toBe(true);
    fireEvent.press(getByLabelText('Show password'));
    expect(getByLabelText('Password').props.secureTextEntry).toBe(false);
    fireEvent.press(getByLabelText('Hide password'));
    expect(getByLabelText('Password').props.secureTextEntry).toBe(true);
  });
  it('changes filter selection through native buttons', () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <FilterChips options={['All', 'New']} value="All" onChange={onChange} />,
    );
    expect(
      getByRole('button', { name: 'All' }).props.accessibilityState.selected,
    ).toBe(true);
    fireEvent.press(getByRole('button', { name: 'New' }));
    expect(onChange).toHaveBeenCalledWith('New');
  });
});

describe('sheet lifecycle', () => {
  it('survives rapid closing and reopening without stale hidden state', () => {
    mockReducedMotion = false;
    jest.useFakeTimers();
    const onClose = jest.fn();
    const { rerender, getByText, queryByText } = render(
      <BottomSheet visible onClose={onClose} title="Choose an option">
        <></>
      </BottomSheet>,
    );
    rerender(
      <BottomSheet visible={false} onClose={onClose} title="Choose an option">
        <></>
      </BottomSheet>,
    );
    rerender(
      <BottomSheet visible onClose={onClose} title="Choose an option">
        <></>
      </BottomSheet>,
    );
    act(() => jest.advanceTimersByTime(500));
    expect(getByText('Choose an option')).toBeTruthy();
    rerender(
      <BottomSheet visible={false} onClose={onClose} title="Choose an option">
        <></>
      </BottomSheet>,
    );
    act(() => jest.advanceTimersByTime(500));
    expect(queryByText('Choose an option')).toBeNull();
    jest.useRealTimers();
    mockReducedMotion = true;
  });
});
