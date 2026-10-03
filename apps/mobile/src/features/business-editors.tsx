import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';
import {
  Accordion,
  BottomSheet,
  Button,
  DateField,
  Field,
  IconButton,
  Select,
} from 'mobile-ui';

export function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select
      label="Category"
      value={value}
      onChange={onChange}
      options={[
        ...new Set([
          value,
          'Salon & beauty',
          'Hospitality',
          'Healthcare',
          'Retail',
          'Professional services',
          'Other',
        ]),
      ]}
    />
  );
}

export function HoursEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  const times = value.match(/(\d{2}:\d{2})[–-](\d{2}:\d{2})/);
  const [days, setDays] = useState(value.split(' · ')[0] || 'Monday–Saturday');
  const [from, setFrom] = useState(times?.[1] ?? '09:00');
  const [to, setTo] = useState(times?.[2] ?? '18:00');
  const [error, setError] = useState('');
  return (
    <View style={{ marginBottom: 16 }}>
      <Accordion title="Opening hours" summary={value}>
        <Select
          label="Open days"
          value={days}
          onChange={setDays}
          options={[
            ...new Set([
              days,
              'Monday–Friday',
              'Monday–Saturday',
              'Every day',
              'Weekends',
            ]),
          ]}
        />
        <DateField
          label="Opens at"
          value={from}
          onChange={setFrom}
          mode="time"
        />
        <DateField label="Closes at" value={to} onChange={setTo} mode="time" />
        {!!error && (
          <Text
            style={{ color: colors.danger, marginBottom: 12 }}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        )}
        <Button
          title="Apply hours to profile"
          variant="secondary"
          onPress={() => {
            if (
              !/^([01]\d|2[0-3]):[0-5]\d$/.test(from) ||
              !/^([01]\d|2[0-3]):[0-5]\d$/.test(to) ||
              from >= to
            ) {
              setError('Choose a closing time after opening time.');
              return;
            }
            onChange(`${days} · ${from}–${to}`);
            setError('');
          }}
        />
      </Accordion>
    </View>
  );
}

export function LocationsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(value.split(',').map((v) => v.trim()));
  const [error, setError] = useState('');
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          color: colors.muted,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 6,
        }}
      >
        Locations
      </Text>
      <Button
        title={value || 'Add locations'}
        variant="secondary"
        onPress={() => {
          setRows(value.split(',').map((v) => v.trim()));
          setError('');
          setOpen(true);
        }}
        accessibilityLabel="Edit locations"
      />
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Business locations"
      >
        {rows.map((location, index) => (
          <View
            key={index}
            style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
          >
            <View style={{ flex: 1 }}>
              <Field
                label={`Location ${index + 1}`}
                value={location}
                autoCapitalize="words"
                onChangeText={(next) =>
                  setRows(rows.map((v, i) => (i === index ? next : v)))
                }
              />
            </View>
            <IconButton
              accessibilityLabel={`Remove location ${index + 1}`}
              disabled={rows.length === 1}
              onPress={() => setRows(rows.filter((_, i) => i !== index))}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </IconButton>
          </View>
        ))}
        <Button
          title="Add location"
          disabled={rows.length >= 8}
          variant="secondary"
          onPress={() => setRows([...rows, ''])}
          style={{ marginBottom: 12 }}
        />
        {!!error && (
          <Text
            style={{ color: colors.danger, marginBottom: 12 }}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        )}
        <Button
          title="Apply locations"
          onPress={() => {
            const trimmed = rows.map((v) => v.trim());
            if (
              trimmed.some((v) => !v || v.includes(',')) ||
              new Set(trimmed.map((v) => v.toLowerCase())).size !==
                trimmed.length
            ) {
              setError('Name each location uniquely, without commas.');
              return;
            }
            onChange(trimmed.join(', '));
            setOpen(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}
