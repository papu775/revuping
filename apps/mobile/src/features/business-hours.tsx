import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Field, Select } from 'mobile-ui';
import { useTheme } from 'mobile-tokens';
import type { OnboardingDraft } from 'api-contracts';
const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export function BusinessHours({
  draft,
  owner,
  update,
}: {
  draft: OnboardingDraft;
  owner: boolean;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  const { colors } = useTheme();
  const [copyFrom, setCopyFrom] = useState<number | null>(null);
  const [destinations, setDestinations] = useState<number[]>([]);
  return (
    <>
      {' '}
      {copyFrom !== null && (
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.ink }}>
            Copy {days[copyFrom]} hours to selected days
          </Text>
          {days.map(
            (day, n) =>
              n !== copyFrom && (
                <Button
                  key={day}
                  title={`${destinations.includes(n) ? '✓ ' : ''}${day}`}
                  variant="secondary"
                  onPress={() =>
                    setDestinations((current) =>
                      current.includes(n)
                        ? current.filter((i) => i !== n)
                        : [...current, n],
                    )
                  }
                />
              ),
          )}
          <Button
            title="Copy to selected days"
            disabled={!destinations.length}
            onPress={() => {
              update({
                hours: draft.hours.map((value, n) =>
                  destinations.includes(n)
                    ? draft.hours[copyFrom].map((item) => ({
                        ...item,
                      }))
                    : value,
                ),
                closedDays: draft.closedDays.map((value, n) =>
                  destinations.includes(n) ? draft.closedDays[copyFrom] : value,
                ),
              });
              setCopyFrom(null);
            }}
          />
          <Button
            title="Cancel copy"
            variant="ghost"
            onPress={() => setCopyFrom(null)}
          />
        </View>
      )}
      {days.map((day, i) => (
        <View key={day} style={{ gap: 8 }}>
          <Text style={{ color: colors.ink, fontWeight: '600' }}>{day}</Text>
          <Select
            label={`${day} status`}
            value={
              draft.hours[i].length
                ? 'Open'
                : draft.closedDays[i]
                  ? 'Closed'
                  : 'Not provided'
            }
            options={['Not provided', 'Open', 'Closed']}
            onChange={(value) =>
              update({
                hours: draft.hours.map((items, n) =>
                  n === i
                    ? value === 'Open'
                      ? [{ open: '09:00', close: '17:00' }]
                      : []
                    : items,
                ),
                closedDays: draft.closedDays.map((v, n) =>
                  n === i ? value === 'Closed' : v,
                ),
              })
            }
          />
          {(draft.hours[i].length > 0 || draft.closedDays[i]) && (
            <Button
              title={`Copy ${day} hours`}
              variant="ghost"
              onPress={() => {
                setCopyFrom(i);
                setDestinations([]);
              }}
            />
          )}
          {!draft.hours[i].length && (
            <Text style={{ color: colors.muted }}>
              {draft.closedDays[i] ? 'Closed' : 'Not provided'}
            </Text>
          )}
          {draft.hours[i].map((interval, j) => (
            <View key={j}>
              {(['open', 'close'] as const).map((key) => (
                <Field
                  key={key}
                  label={`${day} ${key} ${j + 1}`}
                  value={interval[key]}
                  onChangeText={(value) =>
                    update({
                      hours: draft.hours.map((items, n) =>
                        n === i
                          ? items.map((item, m) =>
                              m === j ? { ...item, [key]: value } : item,
                            )
                          : items,
                      ),
                    })
                  }
                  editable={owner}
                />
              ))}
              {owner && (
                <Button
                  title={`Remove ${day} interval ${j + 1}`}
                  variant="ghost"
                  onPress={() =>
                    update({
                      hours: draft.hours.map((items, n) =>
                        n === i ? items.filter((_, m) => m !== j) : items,
                      ),
                    })
                  }
                />
              )}
            </View>
          ))}
          {owner && !draft.closedDays[i] && draft.hours[i].length < 4 && (
            <Button
              title={`Add ${day} interval`}
              variant="ghost"
              onPress={() =>
                update({
                  hours: draft.hours.map((items, n) =>
                    n === i
                      ? [...items, { open: '09:00', close: '17:00' }]
                      : items,
                  ),
                })
              }
            />
          )}
        </View>
      ))}
    </>
  );
}
