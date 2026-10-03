import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';

const storage = AsyncStorage as unknown as AsyncStorageStatic;
import { initialDemoState } from './fixtures.ts';
import type { DemoState, Customer, Campaign, Survey } from './types.ts';

const STORAGE_KEY = 'revuping-mobile-demo-v1';

type Action =
  | { type: 'HYDRATE'; payload: Partial<DemoState> }
  | { type: 'ADD_CUSTOMER'; customer: Customer }
  | { type: 'UPDATE_CUSTOMER'; customer: Customer }
  | { type: 'TOGGLE_CONSENT'; customerId: number }
  | { type: 'TOGGLE_OPT_OUT'; customerId: number }
  | { type: 'SET_FEEDBACK_RESOLVED'; feedbackId: number; resolved: boolean }
  | { type: 'SET_NOTE'; feedbackId: number; note: string }
  | { type: 'SET_FOLLOW_UP'; feedbackId: number; followUp: DemoState['followUps'][number] }
  | { type: 'ADD_CAMPAIGN'; campaign: Campaign }
  | { type: 'UPDATE_CAMPAIGN'; campaign: Campaign }
  | { type: 'ADD_SURVEY'; survey: Survey }
  | { type: 'UPDATE_SURVEY'; survey: Survey }
  | { type: 'SET_REPLY_DRAFT'; reviewId: number; draft: string }
  | { type: 'APPROVE_REPLY'; reviewId: number }
  | { type: 'SET_BUSINESS'; business: Partial<DemoState['business']> }
  | { type: 'ADD_TEAM_MEMBER'; member: DemoState['team'][number] }
  | { type: 'REMOVE_TEAM_MEMBER'; memberId: number }
  | { type: 'SET_CONNECTION'; provider: string; status: string }
  | { type: 'SET_NOTIFICATION'; key: keyof DemoState['notifications']; value: boolean }
  | { type: 'SET_TEMPLATE'; key: keyof DemoState['templates']; value: string }
  | { type: 'SET_WIDGET'; widget: Partial<DemoState['widget']> }
  | { type: 'SET_PLAN'; plan: string }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_DEMO' };

function demoReducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.customer] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.customer.id ? action.customer : c,
        ),
      };
    case 'TOGGLE_CONSENT':
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.customerId
            ? { ...c, consent: !c.consent, consentDate: !c.consent ? '2026-10-02' : '' }
            : c,
        ),
      };
    case 'TOGGLE_OPT_OUT':
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.customerId ? { ...c, optedOut: !c.optedOut } : c,
        ),
      };
    case 'SET_FEEDBACK_RESOLVED':
      return {
        ...state,
        feedback: state.feedback.map((f) =>
          f.id === action.feedbackId ? { ...f, resolved: action.resolved } : f,
        ),
      };
    case 'SET_NOTE':
      return {
        ...state,
        notes: { ...state.notes, [action.feedbackId]: action.note },
      };
    case 'SET_FOLLOW_UP':
      return {
        ...state,
        followUps: { ...state.followUps, [action.feedbackId]: action.followUp },
      };
    case 'ADD_CAMPAIGN':
      return { ...state, campaigns: [...state.campaigns, action.campaign] };
    case 'UPDATE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          c.id === action.campaign.id ? action.campaign : c,
        ),
      };
    case 'ADD_SURVEY':
      return { ...state, surveys: [...state.surveys, action.survey] };
    case 'UPDATE_SURVEY':
      return {
        ...state,
        surveys: state.surveys.map((s) =>
          s.id === action.survey.id ? action.survey : s,
        ),
      };
    case 'SET_REPLY_DRAFT':
      return {
        ...state,
        replyDrafts: { ...state.replyDrafts, [action.reviewId]: action.draft },
      };
    case 'APPROVE_REPLY':
      return {
        ...state,
        approvedReplies: [...state.approvedReplies, action.reviewId],
      };
    case 'SET_BUSINESS':
      return {
        ...state,
        business: { ...state.business, ...action.business },
      };
    case 'ADD_TEAM_MEMBER':
      return { ...state, team: [...state.team, action.member] };
    case 'REMOVE_TEAM_MEMBER':
      return {
        ...state,
        team: state.team.filter((m) => m.id !== action.memberId),
      };
    case 'SET_CONNECTION':
      return {
        ...state,
        connections: { ...state.connections, [action.provider]: action.status },
      };
    case 'SET_NOTIFICATION':
      return {
        ...state,
        notifications: { ...state.notifications, [action.key]: action.value },
      };
    case 'SET_TEMPLATE':
      return {
        ...state,
        templates: { ...state.templates, [action.key]: action.value },
      };
    case 'SET_WIDGET':
      return {
        ...state,
        widget: { ...state.widget, ...action.widget },
      };
    case 'SET_PLAN':
      return { ...state, selectedPlan: action.plan };
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        onboarded: true,
        business: { ...state.business, onboarded: true },
      };
    case 'RESET_DEMO':
      return { ...initialDemoState };
    default:
      return state;
  }
}

interface DemoStoreValue {
  state: DemoState;
  dispatch: React.Dispatch<Action>;
  resetDemo: () => void;
  loaded: boolean;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storage.getItem(STORAGE_KEY)
      .then((raw: string | null) => {
        if (raw) {
          try {
            const saved = JSON.parse(raw) as Partial<DemoState>;
            dispatch({ type: 'HYDRATE', payload: saved });
          } catch {
            // ignore parse errors
          }
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [loaded, state]);

  const resetDemo = useCallback(() => {
    dispatch({ type: 'RESET_DEMO' });
    storage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  if (!loaded) return null;

  return (
    <DemoStoreContext.Provider value={{ state, dispatch, resetDemo, loaded }}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore(): DemoStoreValue {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) throw new Error('useDemoStore must be used within DemoStoreProvider');
  return ctx;
}
