import { initialDemoState } from './fixtures.ts';
import type { DemoState, Customer, Campaign, Survey } from './types.ts';

export type Action =
  | { type: 'HYDRATE'; payload: Partial<DemoState> }
  | { type: 'ADD_CUSTOMER'; customer: Customer }
  | { type: 'UPDATE_CUSTOMER'; customer: Customer }
  | { type: 'TOGGLE_CONSENT'; customerId: number }
  | { type: 'TOGGLE_OPT_OUT'; customerId: number }
  | { type: 'SET_FEEDBACK_RESOLVED'; feedbackId: number; resolved: boolean }
  | { type: 'SET_NOTE'; feedbackId: number; note: string }
  | {
      type: 'SET_FOLLOW_UP';
      feedbackId: number;
      followUp: DemoState['followUps'][number];
    }
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
  | {
      type: 'SET_NOTIFICATION';
      key: keyof DemoState['notifications'];
      value: boolean;
    }
  | { type: 'SET_TEMPLATE'; key: keyof DemoState['templates']; value: string }
  | { type: 'SET_WIDGET'; widget: Partial<DemoState['widget']> }
  | { type: 'SET_PLAN'; plan: string }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'SET_REFERRAL'; referral: DemoState['referral'] }
  | { type: 'RESET_DEMO' };

export function demoReducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        ...action.payload,
        customers: (action.payload.customers ?? state.customers).map(
          (customer) => ({
            ...customer,
            // Older demo snapshots used permission wording for acquisition.
            source: customer.source.replace(
              'In-salon permission',
              'In-salon record',
            ),
            consentDate: customer.consent ? customer.consentDate : '',
          }),
        ),
      };
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
            ? {
                ...c,
                consent: !c.consent,
                consentDate: !c.consent ? '2026-10-02' : '',
                status: c.optedOut
                  ? 'Opted out'
                  : !c.consent
                    ? 'Ready to send'
                    : 'No consent',
              }
            : c,
        ),
      };
    case 'TOGGLE_OPT_OUT':
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.customerId
            ? {
                ...c,
                optedOut: !c.optedOut,
                status: !c.optedOut
                  ? 'Opted out'
                  : c.consent
                    ? 'Ready to send'
                    : 'No consent',
              }
            : c,
        ),
      };
    case 'SET_FEEDBACK_RESOLVED':
      return {
        ...state,
        feedback: state.feedback.map((f) =>
          f.id === action.feedbackId ? { ...f, resolved: action.resolved } : f,
        ),
        followUps: state.followUps[action.feedbackId]
          ? {
              ...state.followUps,
              [action.feedbackId]: {
                ...state.followUps[action.feedbackId],
                status: action.resolved ? 'Resolved' : 'Open',
              },
            }
          : state.followUps,
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
        feedback: state.feedback.map((f) =>
          f.id === action.feedbackId
            ? { ...f, resolved: action.followUp.status === 'Resolved' }
            : f,
        ),
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
        approvedReplies:
          action.draft ===
          (state.replyDrafts[action.reviewId] ??
            state.reviews.find((r) => r.id === action.reviewId)?.draft)
            ? state.approvedReplies
            : state.approvedReplies.filter((id) => id !== action.reviewId),
      };
    case 'APPROVE_REPLY':
      return {
        ...state,
        approvedReplies: [
          ...new Set([...state.approvedReplies, action.reviewId]),
        ],
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
    case 'SET_REFERRAL':
      return { ...state, referral: action.referral };
    case 'RESET_DEMO':
      return { ...initialDemoState };
    default:
      return state;
  }
}
