/** Indian languages the games and cards speak, shared so pages don't pull in each other's data. */
export type CoachLang = 'te' | 'en' | 'hi' | 'ta' | 'kn' | 'mr' | 'or';

/** Menu order; `own` = the language's name in its own script. */
export const LANGS: { id: CoachLang; own: string }[] = [
  { id: 'te', own: 'తెలుగు' },
  { id: 'en', own: 'English' },
  { id: 'hi', own: 'हिन्दी' },
  { id: 'ta', own: 'தமிழ்' },
  { id: 'kn', own: 'ಕನ್ನಡ' },
  { id: 'mr', own: 'मराठी' },
  { id: 'or', own: 'ଓଡ଼ିଆ' },
];

/** First visit: the phone's language if we speak it (other than English), else Telugu. */
export function phoneLang(): CoachLang {
  const want = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);
  for (const l of want) {
    const id = l.slice(0, 2).toLowerCase();
    if (id !== 'en' && LANGS.some((x) => x.id === id)) return id as CoachLang;
  }
  return 'te';
}
