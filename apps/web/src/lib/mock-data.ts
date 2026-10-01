export type Feedback = {
  id: number;
  name: string;
  initials: string;
  rating: number;
  date: string;
  staff: string;
  text: string;
  resolved: boolean;
};
export const feedback: Feedback[] = [
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
export type Customer = {
  id: number;
  name: string;
  email: string;
  consent: boolean;
  status: string;
};
export const customers: Customer[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia@example.com',
    consent: true,
    status: 'Ready to send',
  },
  {
    id: 2,
    name: 'James Wilson',
    email: 'james@example.com',
    consent: true,
    status: 'Link clicked',
  },
  {
    id: 3,
    name: 'Emma Thompson',
    email: 'emma@example.com',
    consent: true,
    status: 'Request sent',
  },
  {
    id: 4,
    name: 'Daniel Lewis',
    email: 'daniel@example.com',
    consent: false,
    status: 'No consent',
  },
];
export const reviews = [
  {
    id: 1,
    name: 'Amelia R.',
    rating: 5,
    date: 'Oct 2, 2026',
    text: 'A beautiful salon with such a welcoming team. Love my new colour!',
    draft:
      'Thank you, Amelia! We’re so pleased you love your new colour. It was a pleasure having you at Bloom & Co. and we look forward to your next visit.',
  },
  {
    id: 2,
    name: 'Noah P.',
    rating: 4,
    date: 'Oct 1, 2026',
    text: 'Great haircut and lovely atmosphere. A small wait, but worth it.',
    draft:
      'Thank you for your kind feedback, Noah. We’re happy you enjoyed your haircut, and appreciate your patience with the wait. We look forward to welcoming you again.',
  },
  {
    id: 3,
    name: 'Grace H.',
    rating: 2,
    date: 'Sep 30, 2026',
    text: 'My appointment started late and I felt a little rushed.',
    draft:
      'Thank you for sharing your experience, Grace. We’re sorry your visit felt rushed. Please contact the salon so we can listen and help make things right.',
  },
];
export const navItems = [
  ['Overview', '/dashboard', 'overview'],
  ['QR studio', '/dashboard/qr', 'qr'],
  ['Feedback inbox', '/dashboard/feedback', 'feedback'],
  ['Review requests', '/dashboard/requests', 'requests'],
  ['Google reviews', '/dashboard/reviews', 'reviews'],
] as const;

export const demoPlans: {
  name: string;
  price: string;
  desc: string;
  features: string[];
  featured?: boolean;
}[] = [
  {
    name: 'Starter',
    price: '19',
    desc: 'For one chair, one counter, one great start.',
    features: [
      '1 business location',
      'Branded review QR codes',
      'Private feedback inbox',
      '50 review requests / month',
    ],
  },
  {
    name: 'Grow',
    price: '39',
    desc: 'For busy teams with more stories to hear.',
    features: [
      'Everything in Starter',
      '250 review requests / month',
      'Reminder previews',
      'AI-assisted reply drafts',
    ],
    featured: true,
  },
  {
    name: 'Together',
    price: '79',
    desc: 'A little more room for every location.',
    features: [
      'Everything in Grow',
      'Up to 3 business locations',
      '750 review requests / month',
      'Location-level insights',
    ],
  },
];
export const previewFeedback: {
  initials: string;
  name: string;
  rating: number;
  text: string;
  status: string;
  color: string;
}[] = [
  {
    initials: 'OM',
    name: 'Olivia Martin',
    rating: 5,
    text: 'Such a lovely experience! Sophie really listened…',
    status: 'New',
    color: 'peach',
  },
  {
    initials: 'JW',
    name: 'James Wilson',
    rating: 3,
    text: 'Happy with the cut, but the appointment started late.',
    status: 'Needs a little care',
    color: 'lavender',
  },
  {
    initials: 'ET',
    name: 'Emma Thompson',
    rating: 5,
    text: 'The most relaxing afternoon. Thank you, Mia!',
    status: 'Resolved',
    color: 'sage',
  },
];

export const overviewMetrics: {
  label: string;
  value: string;
  change: string;
  icon: 'QrIcon' | 'ArrowUpRight' | 'MessageSquare' | 'Star';
  desc: string;
}[] = [
  {
    label: 'QR scans',
    value: '184',
    change: '+24 from last period',
    icon: 'QrIcon',
    desc: 'Visits started with your QR',
  },
  {
    label: 'Review-link clicks',
    value: '62',
    change: '+12 from last period',
    icon: 'ArrowUpRight',
    desc: 'Clicks, not confirmed reviews',
  },
  {
    label: 'Private feedback',
    value: '38',
    change: '3 need your attention',
    icon: 'MessageSquare',
    desc: 'Responses shared with your salon',
  },
  {
    label: 'Google reviews',
    value: '24',
    change: '4.8 average sample rating',
    icon: 'Star',
    desc: 'Simulated reviews this month',
  },
];
export const sampleTrend = {
  scans: [18, 22, 15, 28, 32, 27, 42],
  feedback: [3, 5, 2, 6, 8, 5, 9],
  days: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
};
export const sampleRequestText =
  'Hi {name}, it was lovely having you at Bloom & Co. If you have a moment, we’d love to hear about your visit: {review link}. Thank you!';
