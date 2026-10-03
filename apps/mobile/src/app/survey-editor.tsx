import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
// SDK 57 ships this hook through its React Navigation compatibility entry point.
import {
  usePreventRemove,
  type NavigationAction,
} from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoStore, type Survey, type Question } from 'mobile-data';
import { useTheme, useReducedMotion } from 'mobile-tokens';
import {
  Header,
  Card,
  Field,
  Select,
  Button,
  Toggle,
  Accordion,
  IconButton,
  useToast,
  Dialog,
} from 'mobile-ui';
import { Ionicons } from '@expo/vector-icons';
const types: Question['type'][] = [
  'Satisfaction',
  'NPS',
  'Multiple choice',
  'Text',
];
export default function SurveyEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useDemoStore();
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const saving = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const addedQuestion = useRef(false);
  const [saved, setSaved] = useState(false);
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(
    null,
  );
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
  const [openQuestion, setOpenQuestion] = useState<number | null>(
    existing?.questions[0]?.id ?? 1,
  );
  const [error, setError] = useState('');
  const initialDraft = useRef(JSON.stringify({ name, status, questions }));
  const dirty =
    JSON.stringify({ name, status, questions }) !== initialDraft.current;
  usePreventRemove(dirty && !saved, ({ data }) => {
    Keyboard.dismiss();
    setPendingAction(data.action);
  });
  useEffect(() => {
    if (!saved) return;
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more/surveys');
  }, [saved, router]);
  useEffect(() => {
    if (!addedQuestion.current) return;
    const timer = setTimeout(
      () => {
        scroll.current?.scrollToEnd({ animated: !reduced });
        addedQuestion.current = false;
      },
      reduced ? 0 : 240,
    );
    return () => clearTimeout(timer);
  }, [questions.length, reduced]);
  const update = (id: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const move = (questionId: number, delta: number) =>
    setQuestions((qs) => {
      const index = qs.findIndex((q) => q.id === questionId);
      if (index < 0 || index + delta < 0 || index + delta >= qs.length)
        return qs;
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
    setSaved(true);
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
          ref={scroll}
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
              <Accordion
                title={`Question ${index + 1}`}
                summary={`${q.title || 'Untitled question'} · ${q.type} · ${q.required ? 'Required' : 'Optional'}`}
                open={openQuestion === q.id}
                onToggle={(open) => setOpenQuestion(open ? q.id : null)}
              >
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
                  onChange={(v) =>
                    update(q.id, { type: v as Question['type'] })
                  }
                />
                {q.type === 'Multiple choice' && (
                  <Field
                    label="Choices (one per line)"
                    value={q.options.join('\n')}
                    onChangeText={(v) =>
                      update(q.id, { options: v.split('\n') })
                    }
                    multiline
                  />
                )}
                <Toggle
                  label="Required question"
                  value={q.required}
                  onValueChange={(required) => update(q.id, { required })}
                />
              </Accordion>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderTopWidth: 1,
                  borderColor: colors.border,
                  paddingTop: 4,
                  marginTop: 4,
                }}
              >
                <IconButton
                  accessibilityLabel={`Move question ${index + 1} up`}
                  disabled={index === 0}
                  onPress={() => move(q.id, -1)}
                >
                  <Ionicons name="arrow-up" size={20} color={colors.violet} />
                </IconButton>
                <IconButton
                  accessibilityLabel={`Move question ${index + 1} down`}
                  disabled={index === questions.length - 1}
                  onPress={() => move(q.id, 1)}
                >
                  <Ionicons name="arrow-down" size={20} color={colors.violet} />
                </IconButton>
                <View style={{ flex: 1 }} />
                <IconButton
                  accessibilityLabel={`Remove question ${index + 1}`}
                  disabled={questions.length === 1}
                  onPress={() => {
                    setQuestions((qs) => qs.filter((v) => v.id !== q.id));
                    if (openQuestion === q.id) setOpenQuestion(null);
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />
                </IconButton>
              </View>
            </Card>
          ))}
          <Button
            title="Add question"
            variant="secondary"
            disabled={questions.length >= 8}
            onPress={() => {
              if (questions.length >= 8) return;
              Keyboard.dismiss();
              addedQuestion.current = true;
              const nextId = Math.max(...questions.map((q) => q.id), 0) + 1;
              setOpenQuestion(nextId);
              setQuestions((qs) => [
                ...qs,
                {
                  id: nextId,
                  type: 'Text',
                  title: '',
                  options: [],
                  required: false,
                },
              ]);
            }}
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
      <Dialog
        visible={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title="Discard survey changes?"
        message="Your unsaved edits will be lost."
        cancelLabel="Keep editing"
        confirmLabel="Discard changes"
        destructive
        onConfirm={() => {
          if (pendingAction) navigation.dispatch(pendingAction);
        }}
      />
    </View>
  );
}
