import type {
  FeedbackItem,
  Customer,
  Review,
  Campaign,
  Survey,
  SurveyResponse,
  StaffMember,
  ReportRow,
  TeamMember,
  BusinessProfile,
  WidgetConfig,
  DemoState,
} from './types.js';

export const demoDate = '2026-10-02';

export const initialFeedback: FeedbackItem[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    initials: 'OM',
    rating: 5,
    date: 'Today, 10:42 am',
    staff: 'Sophie',
    text: 'Such a lovely experience! Sophie really listened to what I wanted and the colour turned out beautifully. Already looking forward to my next visit.',
    resolved: false,
  },
  {
    id: 2,
    name: 'James Wilson',
    initials: 'JW',
    rating: 3,
    date: 'Today, 9:18 am',
    staff: 'Alex',
    text: 'Happy with the haircut, but I waited about 25 minutes past my appointment. A little heads-up would have helped.',
    resolved: false,
  },
  {
    id: 3,
    name: 'Emma Thompson',
    initials: 'ET',
    rating: 5,
    date: 'Yesterday, 4:30 pm',
    staff: 'Mia',
    text: 'The most relaxing afternoon. Mia is wonderful and the salon has such a calm atmosphere. Thank you!',
    resolved: true,
  },
  {
    id: 4,
    name: 'Daniel Lewis',
    initials: 'DL',
    rating: 2,
    date: 'Yesterday, 11:05 am',
    staff: 'Alex',
    text: 'The cut felt rushed and was shorter than we discussed. I would appreciate a call to talk about it.',
    resolved: false,
  },
  {
    id: 5,
    name: 'Isabella Chen',
    initials: 'IC',
    rating: 4,
    date: 'Oct 1, 2:15 pm',
    staff: 'Sophie',
    text: 'Beautiful colour and friendly staff. The booking process could be a little easier, but I will be back.',
    resolved: true,
  },
];

export const initialCustomers: Customer[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia@example.com',
    consent: true,
    status: 'Ready to send',
    tags: ['Regular', 'Colour'],
    source: 'In-salon permission · fictional',
    consentDate: '2026-09-10',
    lastVisit: '2026-09-30',
    staff: 'Sophie',
    service: 'Colour',
    optedOut: false,
  },
  {
    id: 2,
    name: 'James Wilson',
    email: 'james@example.com',
    consent: true,
    status: 'Link clicked',
    tags: ['New customer'],
    source: 'In-salon permission · fictional',
    consentDate: '2026-09-10',
    lastVisit: '2026-09-02',
    staff: 'Alex',
    service: 'Cut & finish',
    optedOut: false,
  },
  {
    id: 3,
    name: 'Emma Thompson',
    email: 'emma@example.com',
    consent: true,
    status: 'Request sent',
    tags: ['New customer'],
    source: 'In-salon permission · fictional',
    consentDate: '2026-09-10',
    lastVisit: '2026-08-12',
    staff: 'Mia',
    service: 'Treatments',
    optedOut: false,
  },
  {
    id: 4,
    name: 'Daniel Lewis',
    email: 'daniel@example.com',
    consent: false,
    status: 'No consent',
    tags: ['Follow-up'],
    source: 'In-salon permission · fictional',
    consentDate: '',
    lastVisit: '2026-09-29',
    staff: 'Alex',
    service: 'Cut & finish',
    optedOut: false,
  },
];

export const initialReviews: Review[] = [
  {
    id: 1,
    name: 'Amelia R.',
    rating: 5,
    date: 'Oct 2, 2026',
    text: 'A beautiful salon with such a welcoming team. Love my new colour!',
    draft:
      "Thank you, Amelia! We're so pleased you love your new colour. It was a pleasure having you at Bloom & Co. and we look forward to your next visit.",
  },
  {
    id: 2,
    name: 'Noah P.',
    rating: 4,
    date: 'Oct 1, 2026',
    text: 'Great haircut and lovely atmosphere. A small wait, but worth it.',
    draft:
      "Thank you for your kind feedback, Noah. We're happy you enjoyed your haircut, and appreciate your patience with the wait. We look forward to welcoming you again.",
  },
  {
    id: 3,
    name: 'Grace H.',
    rating: 2,
    date: 'Sep 30, 2026',
    text: 'My appointment started late and I felt a little rushed.',
    draft:
      "Thank you for sharing your experience, Grace. We're sorry your visit felt rushed. Please contact the salon so we can listen and help make things right.",
  },
];

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

export const staffMembers: StaffMember[] = [
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

export const reportRows: ReportRow[] = [
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

export const initialTeam: TeamMember[] = [
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
];

export const initialBusiness: BusinessProfile = {
  name: 'Bloom & Co.',
  category: 'Salon & beauty',
  hours: 'Monday–Saturday · 09:00–18:00',
  locations: 'Notting Hill, Richmond',
  branding: '#6b52b9',
  onboarded: false,
};

export const initialWidget: WidgetConfig = {
  layout: 'Review cards',
  theme: 'Light',
  colour: '#6b52b9',
  reviewIds: [1, 2],
};

export const overviewMetrics = [
  {
    label: 'QR scans',
    value: '184',
    change: '+24 from last period',
    desc: 'Visits started with your QR',
  },
  {
    label: 'Review-link clicks',
    value: '62',
    change: '+12 from last period',
    desc: 'Clicks, not confirmed reviews',
  },
  {
    label: 'Private feedback',
    value: '38',
    change: '3 need your attention',
    desc: 'Responses shared with your salon',
  },
  {
    label: 'Google reviews',
    value: '24',
    change: '4.8 average sample rating',
    desc: 'Simulated reviews this month',
  },
];

export const sampleTrend = {
  scans: [18, 22, 15, 28, 32, 27, 42],
  feedback: [3, 5, 2, 6, 8, 5, 9],
  days: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
};

export const demoPlans = [
  {
    name: 'Essentials',
    price: 'TBD',
    desc: 'For a single business location.',
    features: [
      'Single-location concept',
      'Branded review QR codes',
      'Private feedback inbox',
      'Request limits to be confirmed',
    ],
  },
  {
    name: 'Growth',
    price: 'TBD',
    desc: 'For teams exploring outreach and follow-up.',
    features: [
      'Everything in Essentials',
      'Request limits to be confirmed',
      'Reminder previews',
      'Reply draft previews',
    ],
    featured: true,
  },
  {
    name: 'Multiple locations',
    price: 'TBD',
    desc: 'For owners planning across several locations.',
    features: [
      'Everything in Growth',
      'Multiple business locations',
      'Request limits to be confirmed',
      'Location-level insights',
    ],
  },
];

export const competitorData = [
  {
    name: 'Bloom & Co.',
    rating: 4.8,
    reviews: 24,
    responseRate: 92,
    isYou: true,
  },
  {
    name: 'The Salon NW',
    rating: 4.6,
    reviews: 31,
    responseRate: 78,
    isYou: false,
  },
  {
    name: 'Richmond Cuts',
    rating: 4.4,
    reviews: 18,
    responseRate: 65,
    isYou: false,
  },
  {
    name: 'Glow Studio',
    rating: 4.2,
    reviews: 12,
    responseRate: 54,
    isYou: false,
  },
];

export const integrationProviders = [
  {
    name: 'Google',
    icon: 'google',
    description: 'Sync Google Business reviews and reply from RevuPing.',
  },
  {
    name: 'WhatsApp',
    icon: 'whatsapp',
    description: 'Send review requests and reminders via WhatsApp.',
  },
  {
    name: 'SMS',
    icon: 'sms',
    description: 'Reach customers with SMS review requests.',
  },
  {
    name: 'Email',
    icon: 'email',
    description: 'Send branded email campaigns and follow-ups.',
  },
];

export const followUpFor = (id: number, resolved = false) => ({
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

export const initialDemoState: DemoState = {
  referral: {
    name: 'Bring a friend to Bloom',
    message: 'A little time for someone you love. Explore Bloom & Co.: {link}',
    terms:
      'Fictional programme. No rewards are offered for reviews or ratings.',
    eligibility:
      'Open to all customers who choose to participate. No review required.',
    paused: false,
  },
  feedback: initialFeedback,
  customers: initialCustomers,
  reviews: initialReviews,
  replyDrafts: Object.fromEntries(initialReviews.map((r) => [r.id, r.draft])),
  approvedReplies: [],
  notes: {},
  followUps: {},
  campaigns: initialCampaigns,
  surveys: initialSurveys,
  responses: initialResponses,
  business: initialBusiness,
  team: initialTeam,
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
  widget: initialWidget,
  onboarded: false,
};
