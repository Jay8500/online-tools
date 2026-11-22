import { BODY } from './body';
import { FIRSTAID } from './firstaid';
import { SCIENCE } from './science';
import type { LearnCard, LearnLang, LearnTopic, TopicId } from './types';
import { UNIVERSE } from './universe';

export const TOPICS: LearnTopic[] = [
  {
    id: 'universe', icon: '🌌', cover: 'deepfield', bg: ['#1e1b4b', '#020617'],
    n: { te: 'విశ్వం', en: 'Universe' },
    blurb: { te: 'బిగ్ బ్యాంగ్ నుంచి చంద్రయాన్ వరకు', en: 'From the Big Bang to Chandrayaan' },
    groups: [
      { id: 'start', icon: '✨', n: { te: 'ఆరంభం', en: 'Beginning' } },
      { id: 'stars', icon: '🌠', n: { te: 'నక్షత్రాలు, గెలాక్సీలు', en: 'Stars & galaxies' } },
      { id: 'solar', icon: '☀️', n: { te: 'సౌర కుటుంబం', en: 'Solar system' } },
      { id: 'explore', icon: '🚀', n: { te: 'అన్వేషణ', en: 'Exploring space' } },
    ],
  },
  {
    id: 'science', icon: '🔬', cover: 'einstein', bg: ['#422006', '#0c0702'],
    n: { te: 'శాస్త్రవేత్తలు', en: 'Scientists' },
    blurb: { te: 'ఎవరు, ఏం కనుగొన్నారు, ఎప్పుడు', en: 'Who found what, and when' },
    groups: [
      { id: 'ancient', icon: '🏛️', n: { te: 'ప్రాచీన కాలం', en: 'Ancient' } },
      { id: 'early', icon: '📜', n: { te: '1500–1800', en: '1500–1800' } },
      { id: 'c19', icon: '⚙️', n: { te: '1800లు', en: '1800s' } },
      { id: 'c20', icon: '🚀', n: { te: '1900 తర్వాత', en: '1900 onwards' } },
    ],
  },
  {
    id: 'body', icon: '🫀', bg: ['#881337', '#14030a'],
    n: { te: 'మన శరీరం', en: 'Human body' },
    blurb: { te: 'అవయవాలు, ప్రోటీన్లు, విటమిన్లు, ఖనిజాలు', en: 'Organs, proteins, vitamins, minerals' },
    groups: [
      { id: 'organs', icon: '🫀', n: { te: 'అవయవాలు', en: 'Organs' } },
      { id: 'food', icon: '🥗', n: { te: 'పోషకాలు', en: 'Nutrients' } },
      { id: 'vitamins', icon: '🍊', n: { te: 'విటమిన్లు', en: 'Vitamins' } },
      { id: 'minerals', icon: '⛏️', n: { te: 'ఖనిజాలు', en: 'Minerals' } },
    ],
    note: { te: 'సాధారణ సమాచారం మాత్రమే — వైద్య సలహా కాదు. ఆరోగ్య సమస్యలకు డాక్టర్‌ను సంప్రదించండి.', en: 'General information, not medical advice. See a doctor for health problems.' },
  },
  {
    id: 'firstaid', icon: '⛑️', bg: ['#991b1b', '#170303'],
    n: { te: 'ప్రథమ చికిత్స', en: 'First aid' },
    blurb: { te: 'అత్యవసరంలో ఏం చేయాలి, ఏం చేయకూడదు', en: 'What to do — and not do — in an emergency' },
    groups: [
      { id: 'life', icon: '🚨', n: { te: 'ప్రాణాపాయం', en: 'Life-saving' } },
      { id: 'injury', icon: '🩹', n: { te: 'గాయాలు', en: 'Injuries' } },
      { id: 'bites', icon: '🐍', n: { te: 'కాట్లు, కుట్లు', en: 'Bites & stings' } },
      { id: 'env', icon: '🌡️', n: { te: 'ఎండ, నీరు, కరెంట్', en: 'Heat, water, power' } },
      { id: 'illness', icon: '🤒', n: { te: 'అకస్మాత్తు అనారోగ్యం', en: 'Sudden illness' } },
    ],
    note: { te: 'Red Cross / WHO మార్గదర్శకాల ఆధారంగా సంక్షిప్త సమాచారం — శిక్షణ, వైద్యుడికి ప్రత్యామ్నాయం కాదు. ప్రమాదం అయితే ముందు 108కి కాల్ చేయండి.', en: 'Short guidance based on Red Cross / WHO advice — not a replacement for training or a doctor. In an emergency, call 108 first.' },
  },
];

/** Scientists read best in time order. */
export const CARDS: Record<TopicId, LearnCard[]> = {
  universe: UNIVERSE,
  science: [...SCIENCE].sort((a, b) => (a.y ?? 0) - (b.y ?? 0)),
  body: BODY,
  firstaid: FIRSTAID,
};

export const COUNTRIES: { id: string; n: Record<LearnLang, string> }[] = [
  { id: 'india', n: { te: 'భారత్', en: 'India' } },
  { id: 'uk', n: { te: 'బ్రిటన్', en: 'UK' } },
  { id: 'usa', n: { te: 'అమెరికా', en: 'USA' } },
  { id: 'germany', n: { te: 'జర్మనీ', en: 'Germany' } },
  { id: 'france', n: { te: 'ఫ్రాన్స్', en: 'France' } },
  { id: 'italy', n: { te: 'ఇటలీ', en: 'Italy' } },
  { id: 'greece', n: { te: 'గ్రీస్', en: 'Greece' } },
  { id: 'other', n: { te: 'ఇతర దేశాలు', en: 'Others' } },
];

export const FIELDS: { id: string; icon: string; n: Record<LearnLang, string> }[] = [
  { id: 'physics', icon: '⚛️', n: { te: 'భౌతిక శాస్త్రం', en: 'Physics' } },
  { id: 'space', icon: '🔭', n: { te: 'అంతరిక్షం', en: 'Space' } },
  { id: 'maths', icon: '➗', n: { te: 'గణితం', en: 'Maths' } },
  { id: 'chemistry', icon: '🧪', n: { te: 'రసాయన శాస్త్రం', en: 'Chemistry' } },
  { id: 'biology', icon: '🧬', n: { te: 'జీవశాస్త్రం', en: 'Biology' } },
  { id: 'medicine', icon: '⚕️', n: { te: 'వైద్యం', en: 'Medicine' } },
  { id: 'tech', icon: '💡', n: { te: 'సాంకేతికత', en: 'Technology' } },
];

const UI_EN = { word: 'In one word', fact: 'Did you know?', do: 'Do', dont: 'Don’t', day: 'Today’s card', read: 'Read', all: 'All', timeline: 'Timeline', list: 'All cards', filter: 'Filter', country: 'Country', field: 'Field', clear: 'Clear', none: 'No one matches this filter', swipe: 'Swipe for the next card', share: 'Share', cards: 'cards', start: 'Start', bce: 'BCE', copied: 'Link copied — paste it in WhatsApp', photo: 'Photo', done: 'Done! 🎉 Try another topic' };

/** Words on the Spread Learn screens. */
export const UI: Record<LearnLang, Record<keyof typeof UI_EN, string>> = {
  te: { word: 'ఒక్క మాటలో', fact: 'మీకు తెలుసా?', do: 'చేయాల్సింది', dont: 'చేయకూడనిది', day: 'నేటి విశేషం', read: 'చదవండి', all: 'అన్నీ', timeline: 'కాలక్రమం', list: 'అన్ని కార్డులు', filter: 'ఫిల్టర్', country: 'దేశం', field: 'రంగం', clear: 'తీసేయండి', none: 'ఈ ఫిల్టర్‌కు ఎవరూ లేరు', swipe: 'తర్వాతి కార్డుకు స్వైప్ చేయండి', share: 'షేర్', cards: 'కార్డులు', start: 'మొదలుపెట్టండి', bce: 'క్రీ.పూ.', copied: 'లింక్ కాపీ అయింది — WhatsAppలో పేస్ట్ చేయండి', photo: 'ఫొటో', done: 'పూర్తి! 🎉 ఇంకో అంశం చూడండి' },
  en: UI_EN,
};
