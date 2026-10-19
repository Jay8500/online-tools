/** "YYYY-MM-DD" in the visitor's own time zone (toISOString() is UTC — a day behind in India until 5:30 am). */
export function localIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Local date `days` before today. */
export function daysAgoIso(days: number): string {
  const d = new Date();
  return localIso(new Date(d.getFullYear(), d.getMonth(), d.getDate() - days));
}
