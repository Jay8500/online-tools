/** Shared "install as an app" helpers for the one-time tip and the footer box. */
export interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export type InstallKind = 'prompt' | 'ios' | 'android' | 'desktop';

/** The browser's install offer, caught early in app.ts (it can fire before our components load). */
export function installEvent(): InstallEvent | null {
  return ((window as { __installEvent?: Event }).__installEvent as InstallEvent) ?? null;
}
export function clearInstallEvent() {
  (window as { __installEvent?: Event }).__installEvent = undefined;
}

export function isInstalled(): boolean {
  return matchMedia('(display-mode: standalone)').matches || !!(navigator as { standalone?: boolean }).standalone;
}

/** How this device can install the site (null = this browser can't, e.g. desktop Firefox/Safari). */
export function installKind(): InstallKind | null {
  if (installEvent()) return 'prompt';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Chrome|Chromium|Edg\//.test(ua) && !/OPR\//.test(ua)) return 'desktop';
  return null;
}

/** Opens the browser's own install dialog. Returns true if the visitor installed. */
export async function promptInstall(): Promise<boolean> {
  const e = installEvent();
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  clearInstallEvent();
  return outcome === 'accepted';
}
