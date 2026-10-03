import { render, fireEvent, act } from '@testing-library/react-native';
import {
  Field,
  FilterChips,
  BottomSheet,
  Accordion,
  Stars,
  DateField,
} from 'mobile-ui';
import { Text, Platform } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: 'DateTimePicker',
  DateTimePickerAndroid: { open: jest.fn() },
}));
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
  it.each([2.5, 4.5])(
    'represents %s with a half star and its precise spoken rating',
    (rating) => {
      const view = render(<Stars rating={rating} />);
      expect(view.getByLabelText(`${rating} out of 5 stars`)).toBeTruthy();
      const icons = view.UNSAFE_getAllByType('Icon' as never);
      expect(icons.filter((icon) => icon.props.name === 'star')).toHaveLength(
        Math.floor(rating),
      );
      expect(
        icons.filter((icon) => icon.props.name === 'star-half'),
      ).toHaveLength(1);
    },
  );
  it('uses Android system selection and preserves the selected local calendar day', () => {
    const previous = Platform.OS;
    Platform.OS = 'android';
    try {
      const onChange = jest.fn();
      const view = render(
        <DateField label="Due date" value="2026-10-03" onChange={onChange} />,
      );
      fireEvent.press(view.getByLabelText('Due date: 3 Oct 2026'));
      const open = jest.mocked(DateTimePickerAndroid.open);
      const options = open.mock.calls.at(-1)?.[0];
      expect(options?.mode).toBe('date');
      expect(onChange).not.toHaveBeenCalled();
      const selected = new Date(2026, 9, 9, 0, 0);
      act(() =>
        options?.onValueChange?.(
          { nativeEvent: { timestamp: selected.getTime(), utcOffset: 330 } },
          selected,
        ),
      );
      expect(onChange).toHaveBeenCalledWith('2026-10-09');
    } finally {
      Platform.OS = previous;
    }
  });
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

describe('accordion lifecycle', () => {
  it('removes collapsed controls immediately with reduced motion', () => {
    const view = render(
      <Accordion title="Question" initiallyOpen>
        <Field label="Answer" value="Draft" onChangeText={() => undefined} />
      </Accordion>,
    );
    expect(view.getByLabelText('Answer')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Question'));
    expect(view.queryByLabelText('Answer')).toBeNull();
  });
  it('survives interrupted collapse and removes content after the final collapse', () => {
    mockReducedMotion = false;
    jest.useFakeTimers();
    const make = (open: boolean) => (
      <Accordion title="Question" open={open}>
        <Text>Draft content</Text>
      </Accordion>
    );
    const view = render(make(true));
    view.rerender(make(false));
    view.rerender(make(true));
    act(() => jest.advanceTimersByTime(500));
    expect(view.getByText('Draft content')).toBeTruthy();
    view.rerender(make(false));
    act(() => jest.advanceTimersByTime(500));
    expect(view.queryByText('Draft content')).toBeNull();
    jest.useRealTimers();
    mockReducedMotion = true;
  });
});

describe('sheet lifecycle', () => {
  it('survives rapid closing and reopening without stale hidden state', () => {
    mockReducedMotion = false;
    jest.useFakeTimers();
    const onClose = jest.fn();
    const { rerender, getByText, queryByText } = render(
      <BottomSheet visible onClose={onClose} title="Choose an option">
        <Text>Sheet content</Text>
      </BottomSheet>,
    );
    rerender(
      <BottomSheet visible={false} onClose={onClose} title="Choose an option">
        <Text>Sheet content</Text>
      </BottomSheet>,
    );
    rerender(
      <BottomSheet visible onClose={onClose} title="Choose an option">
        <Text>Sheet content</Text>
      </BottomSheet>,
    );
    act(() => jest.advanceTimersByTime(500));
    expect(getByText('Choose an option')).toBeTruthy();
    rerender(
      <BottomSheet visible={false} onClose={onClose} title="Choose an option">
        <Text>Sheet content</Text>
      </BottomSheet>,
    );
    act(() => jest.advanceTimersByTime(500));
    expect(queryByText('Choose an option')).toBeNull();
    jest.useRealTimers();
    mockReducedMotion = true;
  });
});
