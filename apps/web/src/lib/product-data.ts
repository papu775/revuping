export const demoDate = '2026-10-02';
export type CustomerProfile = {
  tags: string[];
  source: string;
  consentDate: string;
  lastVisit: string;
  staff: string;
  service: string;
  optedOut: boolean;
};
export const profileFor = (id: number): CustomerProfile => ({
  tags:
    id === 1
      ? ['Regular', 'Colour']
      : id === 4
        ? ['Follow-up']
        : ['New customer'],
  source: 'In-salon permission · fictional',
  consentDate: id === 4 ? '' : '2026-09-10',
  lastVisit: ['2026-09-30', '2026-09-02', '2026-08-12', '2026-09-29'][
    Math.max(0, id - 1) % 4
  ],
  staff: ['Sophie', 'Alex', 'Mia', 'Alex'][Math.max(0, id - 1) % 4],
  service: ['Colour', 'Cut & finish', 'Treatments', 'Cut & finish'][
    Math.max(0, id - 1) % 4
  ],
  optedOut: false,
});
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
export const initialCampaigns: Campaign[] = [
  {
    id: 1,
    name: 'October visit follow-up',
    kind: 'Review request',
    status: 'Scheduled',
    audience: 'All eligible customers',
    channel: 'Email',
    message:
      'Hi {name}, thank you for visiting Bloom & Co. Share an honest review or private feedback: {link}',
    scheduled: '2026-10-03T10:00',
    reminderDays: 3,
    stop: 'Opt-out or owner confirms completion',
    customerIds: [1, 2, 3],
    created: demoDate,
  },
  {
    id: 2,
    name: 'September reminder',
    kind: 'Reminder',
    status: 'Completed',
    audience: 'Regular customers',
    channel: 'SMS',
    message: 'Hi {name}, a friendly reminder to share your experience: {link}',
    scheduled: '2026-09-29T12:00',
    reminderDays: 0,
    stop: 'Opt-out or owner confirms completion',
    customerIds: [1],
    created: '2026-09-25',
  },
  {
    id: 3,
    name: 'Time for your next visit',
    kind: 'Repeat visit',
    status: 'Draft',
    audience: 'Last visit over 30 days',
    channel: 'WhatsApp',
    message:
      'Hi {name}, ready for some time for yourself? Preview your next appointment at {link}',
    scheduled: '2026-10-05T11:00',
    reminderDays: 0,
    stop: 'Opt-out or rebooking recorded',
    customerIds: [3],
    created: demoDate,
  },
];
export type FollowUp = {
  assignee: string;
  priority: string;
  tags: string;
  due: string;
  status: 'Open' | 'In progress' | 'Resolved';
  summary: string;
  history: string[];
};
export const followUpFor = (id: number, resolved = false): FollowUp => ({
  assignee: id === 2 || id === 4 ? 'Alex' : id === 3 ? 'Mia' : 'Sophie',
  priority: id === 4 ? 'High' : 'Normal',
  tags:
    id === 2 ? 'Waiting time' : id === 4 ? 'Consultation' : 'Visit experience',
  due: id === 4 ? '2026-10-01' : '2026-10-05',
  status: resolved ? 'Resolved' : 'Open',
  summary: resolved
    ? 'Discussed the visit with the team. Sample resolution.'
    : '',
  history: ['Feedback received · fictional activity'],
});
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
export const initialSurveys: Survey[] = [
  {
    id: 1,
    name: 'Your salon experience',
    status: 'Active',
    questions: [
      {
        id: 1,
        type: 'Satisfaction',
        title: 'How satisfied were you with your visit?',
        options: [],
        required: true,
      },
      {
        id: 2,
        type: 'NPS',
        title: 'How likely are you to recommend this salon to a friend?',
        options: [],
        required: true,
      },
      {
        id: 3,
        type: 'Multiple choice',
        title: 'What mattered most during your visit?',
        options: ['Listening', 'Comfort', 'Results'],
        required: true,
      },
      {
        id: 4,
        type: 'Optional text',
        title: 'Anything else you would like to share?',
        options: [],
        required: false,
      },
    ],
  },
];
export type SurveyResponse = {
  id: number;
  surveyId: number;
  answers: Record<number, string>;
  date: string;
};
export const initialResponses: SurveyResponse[] = [
  {
    id: 1,
    surveyId: 1,
    date: '2026-10-01',
    answers: {
      1: '5',
      2: '9',
      3: 'Listening',
      4: 'A thoughtful consultation.',
    },
  },
  {
    id: 2,
    surveyId: 1,
    date: '2026-09-29',
    answers: {
      1: '3',
      2: '6',
      3: 'Comfort',
      4: 'The appointment started late.',
    },
  },
  {
    id: 3,
    surveyId: 1,
    date: '2026-09-24',
    answers: { 1: '4', 2: '8', 3: 'Results', 4: '' },
  },
];
export const staffMembers = [
  {
    name: 'Alex',
    role: 'Stylist',
    service: 'Cut & finish',
    theme: 'Appointment communication',
  },
  {
    name: 'Mia',
    role: 'Therapist',
    service: 'Treatments',
    theme: 'Comfort and care',
  },
  {
    name: 'Sophie',
    role: 'Colour specialist',
    service: 'Colour',
    theme: 'Listening and consultation',
  },
];
export const reportRows = [
  {
    date: '2026-09-11',
    location: 'Notting Hill',
    requests: 18,
    clicks: 10,
    feedback: 5,
    reviews: 3,
    replyHours: 10,
    resolutionHours: 32,
  },
  {
    date: '2026-09-18',
    location: 'Notting Hill',
    requests: 22,
    clicks: 13,
    feedback: 7,
    reviews: 4,
    replyHours: 8,
    resolutionHours: 28,
  },
  {
    date: '2026-09-25',
    location: 'Notting Hill',
    requests: 24,
    clicks: 14,
    feedback: 9,
    reviews: 5,
    replyHours: 7,
    resolutionHours: 24,
  },
  {
    date: '2026-10-02',
    location: 'Notting Hill',
    requests: 28,
    clicks: 25,
    feedback: 17,
    reviews: 12,
    replyHours: 6,
    resolutionHours: 20,
  },
  {
    date: '2026-09-11',
    location: 'Richmond',
    requests: 10,
    clicks: 5,
    feedback: 3,
    reviews: 1,
    replyHours: 14,
    resolutionHours: 36,
  },
  {
    date: '2026-09-18',
    location: 'Richmond',
    requests: 12,
    clicks: 6,
    feedback: 4,
    reviews: 2,
    replyHours: 12,
    resolutionHours: 34,
  },
  {
    date: '2026-09-25',
    location: 'Richmond',
    requests: 14,
    clicks: 8,
    feedback: 6,
    reviews: 3,
    replyHours: 10,
    resolutionHours: 30,
  },
  {
    date: '2026-10-02',
    location: 'Richmond',
    requests: 16,
    clicks: 9,
    feedback: 7,
    reviews: 3,
    replyHours: 8,
    resolutionHours: 26,
  },
];
export type ProductState = {
  profiles: Record<number, CustomerProfile>;
  campaigns: Campaign[];
  followUps: Record<number, FollowUp>;
  surveys: Survey[];
  responses: SurveyResponse[];
  referral: {
    name: string;
    message: string;
    terms: string;
    eligibility: string;
    paused: boolean;
  };
  referralActivity: {
    id: number;
    name: string;
    status: string;
    date: string;
  }[];
  business: {
    name: string;
    category: string;
    hours: string;
    locations: string;
    branding: string;
    onboarded: boolean;
  };
  location: string;
  team: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  }[];
  connections: Record<string, string>;
  notifications: { weekly: boolean; feedback: boolean; reminders: boolean };
  templates: { request: string; rebooking: string };
  selectedPlan: string;
  widget: {
    layout: string;
    theme: string;
    colour: string;
    reviewIds: number[];
  };
};
export const initialProduct: ProductState = {
  profiles: Object.fromEntries([1, 2, 3, 4].map((id) => [id, profileFor(id)])),
  campaigns: initialCampaigns,
  followUps: {},
  surveys: initialSurveys,
  responses: initialResponses,
  referral: {
    name: 'Bring a friend to Bloom',
    message: 'A little time for someone you love. Explore Bloom & Co.: {link}',
    terms:
      'Fictional programme. No rewards are offered for reviews or ratings.',
    eligibility:
      'Open to all customers who choose to participate. No review required.',
    paused: false,
  },
  referralActivity: [
    {
      id: 1,
      name: 'Sample friend A',
      status: 'Visit interest recorded',
      date: '2026-10-01',
    },
    {
      id: 2,
      name: 'Sample friend B',
      status: 'Link opened',
      date: '2026-09-29',
    },
  ],
  business: {
    name: 'Bloom & Co.',
    category: 'Salon & beauty',
    hours: 'Monday–Saturday · 09:00–18:00',
    locations: 'Notting Hill, Richmond',
    branding: '#6b52b9',
    onboarded: false,
  },
  location: 'Notting Hill',
  team: [
    {
      id: 1,
      name: 'Demo owner',
      email: 'owner@example.com',
      role: 'Owner',
      status: 'Active · demo',
    },
    {
      id: 2,
      name: 'Alex',
      email: 'alex@example.com',
      role: 'Staff',
      status: 'Active · demo',
    },
  ],
  connections: {
    Google: 'Disconnected',
    WhatsApp: 'Disconnected',
    SMS: 'Disconnected',
    Email: 'Disconnected',
  },
  notifications: { weekly: true, feedback: true, reminders: false },
  templates: {
    request: 'Hi {name}, share an honest review or private feedback: {link}',
    rebooking: 'Hi {name}, ready for your next visit? {link}',
  },
  selectedPlan: 'Demo workspace',
  widget: {
    layout: 'Review cards',
    theme: 'Light',
    colour: '#6b52b9',
    reviewIds: [1, 2],
  },
};
export const productSections = [
  'customers',
  'campaigns',
  'reminders',
  'repeat-visits',
  'referrals',
  'staff',
  'reports',
  'surveys',
  'widgets',
  'competitors',
  'integrations',
  'settings',
  'billing',
  'onboarding',
] as const;
export const navigationGroups = [
  {
    label: 'Reputation',
    items: [
      ['QR code studio', 'qr'],
      ['Feedback inbox', 'feedback'],
      ['Google reviews', 'reviews'],
      ['Customer surveys', 'surveys'],
    ],
  },
  {
    label: 'Campaigns',
    items: [
      ['Review requests', 'requests'],
      ['Campaign builder', 'campaigns'],
      ['Reminders', 'reminders'],
      ['Repeat visits', 'repeat-visits'],
      ['Referrals', 'referrals'],
    ],
  },
  {
    label: 'Insights',
    items: [
      ['Reports', 'reports'],
      ['Staff & services', 'staff'],
      ['Competitor comparison', 'competitors'],
    ],
  },
  {
    label: 'Tools & settings',
    items: [
      ['Review widgets', 'widgets'],
      ['Integrations', 'integrations'],
      ['Business & team', 'settings'],
      ['Billing', 'billing'],
      ['Business onboarding', 'onboarding'],
    ],
  },
];
export const sectionLabel = (path: string) =>
  path === '/dashboard'
    ? 'Overview'
    : path.endsWith('/customers')
      ? 'Customers'
      : navigationGroups
          .flatMap((g) => g.items)
          .find(([, section]) => path === `/dashboard/${section}`)?.[0] ||
        'Workspace';
