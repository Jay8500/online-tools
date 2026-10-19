/**
 * Traffic fines as written in the Motor Vehicles Act, 1988 (as amended in 2019) — the law every state follows.
 * States may "compound" (settle) some offences for less, so the challan you get can be lower: the e-challan portal shows the exact amount.
 * Per-state differences go in STATES[].extra / overrides when a state notifies its own schedule.
 */
export interface Fine {
  id: string;
  icon: string;
  title: string;
  /** Who it applies to / short meaning */
  who: string;
  first: string;
  repeat?: string;
  /** Extra action: licence suspension, jail… */
  also?: string;
  section: string;
  tags: string;
}

export const FINES: Fine[] = [
  { id: 'helmet', icon: '🪖', title: 'No helmet', who: 'Rider or pillion (both must wear one)', first: '₹1,000', also: 'Licence can be suspended for 3 months', section: '194D', tags: 'helmet bike two wheeler pillion' },
  { id: 'seatbelt', icon: '🔒', title: 'No seat belt', who: 'Driver or any passenger, front or back', first: '₹1,000', section: '194B', tags: 'seat belt car' },
  { id: 'drunk', icon: '🍺', title: 'Drunk driving', who: 'Over 30 mg alcohol per 100 ml blood', first: '₹10,000', repeat: '₹15,000', also: 'Jail up to 6 months (2 years if repeated); licence suspended', section: '185', tags: 'drunk drink alcohol' },
  { id: 'phone', icon: '📱', title: 'Phone in hand while driving', who: 'Calls, texts or videos while driving', first: '₹1,000 – ₹5,000', repeat: 'up to ₹10,000', also: 'Licence can be suspended', section: '184', tags: 'mobile phone call' },
  { id: 'signal', icon: '🚦', title: 'Red light jumping / wrong side', who: 'Dangerous driving: signal jump, wrong way, rash overtaking', first: '₹1,000 – ₹5,000', repeat: 'up to ₹10,000', also: 'Jail 6–12 months possible', section: '184', tags: 'signal red light jump wrong side rash dangerous' },
  { id: 'speed', icon: '🏎️', title: 'Over-speeding', who: 'Car/bike (LMV) · bus/truck in brackets', first: '₹1,000 – ₹2,000 (₹2,000 – ₹4,000)', also: 'Licence can be impounded if repeated', section: '183', tags: 'speed speeding overspeed' },
  { id: 'licence', icon: '🪪', title: 'Driving without licence', who: 'No valid driving licence', first: '₹5,000', also: 'Jail up to 3 months possible', section: '181', tags: 'licence license dl' },
  { id: 'insurance', icon: '📄', title: 'No insurance', who: 'Vehicle without valid third-party insurance', first: '₹2,000', repeat: '₹4,000', also: 'Jail up to 3 months possible', section: '196', tags: 'insurance' },
  { id: 'rc', icon: '🧾', title: 'Unregistered vehicle', who: 'No registration (RC) or number plate', first: '₹2,000 – ₹5,000', repeat: '₹5,000 – ₹10,000', section: '192', tags: 'rc registration number plate' },
  { id: 'triple', icon: '🛵', title: 'Triple riding', who: 'More than 2 people on a two-wheeler', first: '₹1,000', also: 'Licence can be suspended for 3 months', section: '194C', tags: 'triple riding bike' },
  { id: 'minor', icon: '🧒', title: 'Minor driving', who: 'Under-18 driving (owner/parent is punished)', first: '₹25,000', also: 'Parent/owner jail up to 3 years; RC cancelled for 1 year; child gets no licence until 25', section: '199A', tags: 'minor child juvenile under 18' },
  { id: 'ambulance', icon: '🚑', title: 'Blocking an ambulance', who: 'Not giving way to ambulance or fire engine', first: '₹10,000', also: 'Jail up to 6 months possible', section: '194E', tags: 'ambulance fire emergency' },
  { id: 'pollution', icon: '💨', title: 'Pollution / noise norms', who: 'Breaking air or noise pollution rules (e.g. no valid PUC)', first: 'up to ₹10,000', also: 'Licence can be suspended for 3 months', section: '190(2)', tags: 'pollution puc smoke noise silencer' },
  { id: 'horn', icon: '📯', title: 'Horn in silence zone', who: 'Near hospitals, schools, courts', first: '₹2,000', repeat: '₹4,000', section: '194F', tags: 'horn honking silence' },
  { id: 'parking', icon: '🅿️', title: 'Wrong parking', who: 'No-parking area, footpath, blocking traffic', first: '₹500 – ₹1,000', also: 'Vehicle can be towed (towing charges extra)', section: '177A', tags: 'parking no parking tow' },
  { id: 'disobey', icon: '👮', title: 'Not following police orders', who: 'Refusing to stop or show documents', first: '₹2,000', section: '179', tags: 'police disobey documents' },
  { id: 'race', icon: '🏁', title: 'Racing / stunts', who: 'Speed racing or stunts on public roads', first: '₹5,000', repeat: '₹10,000', also: 'Jail up to 3 months possible', section: '189', tags: 'race racing stunt wheelie' },
  { id: 'overload', icon: '🚚', title: 'Overloading', who: 'Goods vehicle over its weight limit', first: '₹20,000 + ₹2,000 per extra tonne', section: '194', tags: 'overload truck goods' },
  { id: 'general', icon: '⚠️', title: 'Other offences', who: 'Any rule with no separate fine', first: '₹500', repeat: '₹1,500', section: '177', tags: 'general other' },
];

export interface StateInfo {
  id: string;
  name: string;
  portal: { label: string; url: string };
  notes: string[];
}

export const STATES: StateInfo[] = [
  {
    id: 'telangana',
    name: 'Telangana',
    portal: { label: 'Telangana e-Challan (TS Police)', url: 'https://echallan.tspolice.gov.in/publicview/' },
    notes: [
      'Hyderabad, Cyberabad and Rachakonda cameras send challans automatically — check your vehicle number often.',
      'Only trust SMS from the official “ECHALN” sender; never pay through a link in WhatsApp.',
    ],
  },
  {
    id: 'andhra',
    name: 'Andhra Pradesh',
    portal: { label: 'Parivahan e-Challan (AP & all states)', url: 'https://echallan.parivahan.gov.in/' },
    notes: ['You can also pay at a MeeSeva centre.', 'Never pay through a link in an SMS or WhatsApp — open the portal yourself.'],
  },
];

export const RULES: { icon: string; title: string; text: string }[] = [
  { icon: '🪖', title: 'Helmet for both', text: 'Rider and pillion, ISI-marked, strap buckled. Kids 9 months–4 years need a helmet and safety harness, and the bike must stay under 40 km/h.' },
  { icon: '🔒', title: 'Belt up, every seat', text: 'Seat belts are compulsory for back-seat passengers too.' },
  { icon: '🍺', title: 'Zero drinks is safest', text: 'The limit is 30 mg per 100 ml of blood — even one drink can cross it.' },
  { icon: '📱', title: 'Phone down', text: 'No calls or texts in hand. Hands-free navigation only.' },
  { icon: '🚦', title: 'Stop at the line', text: 'On red, stop behind the white stop line, off the zebra crossing. Pedestrians cross first.' },
  { icon: '⬅️', title: 'Keep left', text: 'Drive on the left, overtake from the right, never drive on the wrong side.' },
  { icon: '🚑', title: 'Make way', text: 'Move left and give way to ambulances and fire engines.' },
  { icon: '🧒', title: 'Right age only', text: '16+ for gearless scooters up to 50 cc with a learner/licence; 18+ for everything else.' },
  { icon: '📲', title: 'Digital papers are valid', text: 'Licence, RC, insurance and PUC in DigiLocker or mParivahan are accepted.' },
  { icon: '🤫', title: 'No horn zones', text: 'No honking near hospitals, schools and courts.' },
];
