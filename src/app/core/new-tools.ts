/**
 * Recently added tools (newest first). Each shows a "NEW" badge and appears in "What's new" for
 * NEW_FOR_DAYS days after `added`, then drops off by itself. Add a line here when a tool goes live.
 */
export const NEW_TOOLS: { path: string; added: string }[] = [
  { path: 'rent-receipt-generator', added: '2026-10-27' },
  { path: 'ifsc-code-finder', added: '2026-10-27' },
  { path: 'pf-balance-check', added: '2026-10-27' },
  { path: 'stock-market-today', added: '2026-10-22' },
  { path: 'cgpa-to-percentage-calculator', added: '2026-10-21' },
  { path: 'split-bill-calculator', added: '2026-10-21' },
  { path: 'days-calculator', added: '2026-10-21' },
  { path: 'age-calculator', added: '2026-10-21' },
  { path: 'percentage-calculator', added: '2026-10-21' },
];

const NEW_FOR_DAYS = 30;

/** Paths still inside their "new" window. */
export function freshPaths(now = Date.now()): string[] {
  return NEW_TOOLS.filter((t) => now - new Date(t.added + 'T00:00:00+05:30').getTime() < NEW_FOR_DAYS * 86400000).map((t) => t.path);
}

/** Date of the newest addition — "What's new" counts as seen until this changes. */
export const LATEST_ADDED = NEW_TOOLS[0]?.added ?? '';
