export type FeedbackItem = {
  id: number;
  name: string;
  initials: string;
  rating: number;
  date: string;
  staff: string;
  text: string;
  resolved: boolean;
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  consent: boolean;
  status: string;
  tags: string[];
  source: string;
  consentDate: string;
  lastVisit: string;
  staff: string;
  service: string;
  optedOut: boolean;
};

export type Review = {
  id: number;
  name: string;
  rating: number;
  date: string;
  text: string;
  draft: string;
};

export type Campaign = {
  id: number;
  name: string;
  kind: 'Review request' | 'Reminder' | 'Repeat visit';
  status: 'Draft' | 'Scheduled' | 'Paused' | 'Completed';
  audience: string;
  channel: string;
  message: string;
  scheduled: string;
  reminderDays: number;
  stop: string;
  customerIds: number[];
  created: string;
};

export type FollowUp = {
  assignee: string;
  priority: string;
  tags: string;
  due: string;
  status: 'Open' | 'In progress' | 'Resolved';
  summary: string;
  history: string[];
};

export type Question = {
  id: number;
  type: 'Satisfaction' | 'NPS' | 'Multiple choice' | 'Optional text';
  title: string;
  options: string[];
  required: boolean;
};

export type Survey = {
  id: number;
  name: string;
  status: 'Draft' | 'Active' | 'Paused';
  questions: Question[];
};

export type SurveyResponse = {
  id: number;
  surveyId: number;
  answers: Record<number, string>;
  date: string;
};

export type StaffMember = {
  name: string;
  role: string;
  service: string;
  theme: string;
};

export type ReportRow = {
  date: string;
  location: string;
  requests: number;
  clicks: number;
  feedback: number;
  reviews: number;
  replyHours: number;
  resolutionHours: number;
};

export type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type BusinessProfile = {
  name: string;
  category: string;
  hours: string;
  locations: string;
  branding: string;
  onboarded: boolean;
};

export type WidgetConfig = {
  layout: string;
  theme: string;
  colour: string;
  reviewIds: number[];
};

export type DemoState = {
  feedback: FeedbackItem[];
  customers: Customer[];
  reviews: Review[];
  replyDrafts: Record<number, string>;
  approvedReplies: number[];
  notes: Record<number, string>;
  followUps: Record<number, FollowUp>;
  campaigns: Campaign[];
  surveys: Survey[];
  responses: SurveyResponse[];
  business: BusinessProfile;
  team: TeamMember[];
  connections: Record<string, string>;
  notifications: { weekly: boolean; feedback: boolean; reminders: boolean };
  templates: { request: string; rebooking: string };
  selectedPlan: string;
  widget: WidgetConfig;
  onboarded: boolean;
};
