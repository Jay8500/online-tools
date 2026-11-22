/**
 * Spread Learn — swipe cards about the universe, scientists, the human body and first aid.
 * Rules: short, correct, kind; facts from NASA/ISRO, Nobel and encyclopaedia records, ICMR-NIN,
 * WHO and Red Cross first-aid guidance. Health cards are general information, not medical advice.
 */
export type LearnLang = 'te' | 'en';
export type TopicId = 'universe' | 'science' | 'body' | 'firstaid';

export interface LearnText {
  /** title */
  t: string;
  /** the idea in one word (or two) */
  w: string;
  /** 2–3 short sentences */
  s: string;
  /** "Did you know?" */
  f?: string;
  /** first aid: what to do / what not to do */
  d?: string[];
  x?: string[];
}

export interface LearnCard {
  id: string;
  /** group inside the topic (chips) */
  g: string;
  /** picture key in learn-img.ts (photos), else the emoji art is shown */
  img?: string;
  emoji: string;
  /** emoji art background */
  bg?: [string, string];
  /** scientists: year of the key work (negative = BCE), country and field for the filters */
  y?: number;
  c?: string;
  k?: string;
  /** scientists: life years shown on the card */
  life?: string;
  te: LearnText;
  en: LearnText;
}

export interface LearnGroup {
  id: string;
  icon: string;
  n: Record<LearnLang, string>;
}

export interface LearnTopic {
  id: TopicId;
  icon: string;
  n: Record<LearnLang, string>;
  blurb: Record<LearnLang, string>;
  cover?: string;
  bg: [string, string];
  groups: LearnGroup[];
  note?: Record<LearnLang, string>;
}
