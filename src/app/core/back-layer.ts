/**
 * Phone Back closes the top popup (dialog, sheet, stories, news…) instead of leaving the page.
 * Each open popup adds one history step on the same URL (the router ignores those). Back pops the top
 * one and calls its `onBack`. When the page closes a popup itself (✕, Esc, outside tap), `release()`
 * removes its step so the next Back behaves normally.
 */
type Layer = { id: number; onBack: () => void };
const stack: Layer[] = [];
let seq = 0;
let ignore = 0;
let wired = false;
const waiters: (() => void)[] = [];

function onPop() {
  if (ignore > 0) {
    ignore--;
    waiters.shift()?.();
    return;
  }
  stack.pop()?.onBack();
}

export interface BackLayer {
  /** Closed by the page: take our history step(s) back out; resolves once the browser has done it. */
  release(): Promise<void>;
  /** Leaving with a `replaceUrl` navigation: forget the step without going back. */
  drop(): void;
}

export function pushLayer(onBack: () => void): BackLayer {
  if (typeof window === 'undefined') return { release: () => Promise.resolve(), drop: () => undefined };
  if (!wired) {
    addEventListener('popstate', onPop);
    wired = true;
  }
  const id = ++seq;
  stack.push({ id, onBack });
  history.pushState({ ...(history.state ?? {}), layer: id }, '');
  const index = () => stack.findIndex((l) => l.id === id);
  return {
    release() {
      const i = index();
      if (i < 0) return Promise.resolve(); // already closed by Back
      const n = stack.length - i; // also drops any popup opened on top of this one
      stack.splice(i);
      ignore++;
      return new Promise<void>((done) => {
        const t = setTimeout(done, 400);
        waiters.push(() => {
          clearTimeout(t);
          done();
        });
        history.go(-n);
      });
    },
    drop() {
      const i = index();
      if (i >= 0) stack.splice(i);
    },
  };
}
