import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoStore, type Survey, type Question } from 'mobile-data';
import { useTheme } from 'mobile-tokens';
import {
  Header,
  Card,
  Field,
  Select,
  Button,
  Toggle,
  useToast,
} from 'mobile-ui';
const types: Question['type'][] = [
  'Satisfaction',
  'NPS',
  'Multiple choice',
  'Optional text',
];
export default function SurveyEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useDemoStore();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const saving = useRef(false);
  const existing = state.surveys.find((s) => s.id === Number(id));
  const [name, setName] = useState(existing?.name ?? '');
  const [status, setStatus] = useState<Survey['status']>(
    existing?.status ?? 'Draft',
  );
  const [questions, setQuestions] = useState<Question[]>(
    existing?.questions ?? [
      {
        id: 1,
        type: 'Satisfaction',
        title: 'How was your visit?',
        options: [],
        required: true,
      },
    ],
  );
  const [error, setError] = useState('');
  const update = (id: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const move = (index: number, delta: number) =>
    setQuestions((qs) => {
      const next = [...qs];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  const save = () => {
    if (saving.current) return;
    if (
      !name.trim() ||
      !questions.length ||
      questions.some(
        (q) =>
          !q.title.trim() ||
          (q.type === 'Multiple choice' &&
            q.options.filter((v) => v.trim()).length < 2),
      )
    ) {
      setError(
        'Name each question and add at least two choices to multiple choice questions.',
      );
      return;
    }
    saving.current = true;
    const survey: Survey = {
      id: existing?.id ?? Math.max(0, ...state.surveys.map((s) => s.id)) + 1,
      name: name.trim(),
      status,
      questions: questions.map((q) => ({
        ...q,
        title: q.title.trim(),
        options: q.options.map((v) => v.trim()).filter(Boolean),
      })),
    };
    dispatch(
      existing
        ? { type: 'UPDATE_SURVEY', survey }
        : { type: 'ADD_SURVEY', survey },
    );
    toast.showToast('Survey saved in this demo. No responses are collected.');
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more/surveys');
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={existing ? 'Edit survey' : 'New survey'}
        fallbackHref="/(tabs)/more/surveys"
        showBack
        subtitle="Demo question editor"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 24 + insets.bottom,
            gap: 16,
          }}
        >
          <Card>
            <Field
              label="Survey name"
              value={name}
              onChangeText={setName}
              error={error && !name.trim() ? 'Enter a name' : undefined}
            />
            <Select
              label="Status"
              value={status}
              options={['Draft', 'Active', 'Paused']}
              onChange={(v) => setStatus(v as Survey['status'])}
            />
          </Card>
          {questions.map((q, index) => (
            <Card key={q.id}>
              <Text
                style={{
                  color: colors.ink,
                  fontSize: 18,
                  fontWeight: '600',
                  marginBottom: 16,
                }}
              >
                Question {index + 1}
              </Text>
              <Field
                label="Question"
                value={q.title}
                onChangeText={(title) => update(q.id, { title })}
                multiline
              />
              <Select
                label="Question type"
                value={q.type}
                options={types}
                onChange={(v) => update(q.id, { type: v as Question['type'] })}
              />
              {q.type === 'Multiple choice' && (
                <Field
                  label="Choices (one per line)"
                  value={q.options.join('\n')}
                  onChangeText={(v) => update(q.id, { options: v.split('\n') })}
                  multiline
                />
              )}
              <Toggle
                label="Required question"
                value={q.required}
                onValueChange={(required) => update(q.id, { required })}
              />
              <View style={{ gap: 8, marginTop: 16 }}>
                <Button
                  title="Move up"
                  variant="secondary"
                  disabled={index === 0}
                  onPress={() => move(index, -1)}
                />
                <Button
                  title="Move down"
                  variant="secondary"
                  disabled={index === questions.length - 1}
                  onPress={() => move(index, 1)}
                />
                <Button
                  title="Remove question"
                  variant="danger"
                  disabled={questions.length === 1}
                  onPress={() =>
                    setQuestions((qs) => qs.filter((v) => v.id !== q.id))
                  }
                />
              </View>
            </Card>
          ))}
          <Button
            title="Add question"
            variant="secondary"
            disabled={questions.length >= 8}
            onPress={() =>
              setQuestions((qs) => [
                ...qs,
                {
                  id: Math.max(...qs.map((q) => q.id), 0) + 1,
                  type: 'Optional text',
                  title: '',
                  options: [],
                  required: false,
                },
              ])
            }
          />
          <Text style={{ color: colors.muted }}>
            Up to 8 questions. Your draft stays here while opening selectors.
          </Text>
          {!!error && (
            <Text
              style={{ color: colors.danger }}
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          )}
          <Button title="Save survey" onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
