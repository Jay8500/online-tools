/** Group (category) page paths — tiny, safe to import from the app shell and routes. Content lives in hubs.ts. */
export const HUB_PATHS: Record<string, string> = {
  'Exam photos': 'exam-photo-signature-resize',
  'Image tools': 'image-tools',
  'Money calculators': 'money-calculators',
  Calculators: 'money-calculators',
  'PDF tools': 'pdf-tools',
  'Business tools': 'business-tools',
  'Health calculators': 'health-calculators',
  'Language tools': 'language-tools',
  Converters: 'unit-converters',
};

export const HUB_ROUTES = [...new Set(Object.values(HUB_PATHS))];
