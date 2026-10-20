import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DOC_SHORT, EXAMS, examPath } from './exams';
import { TOOL_GROUPS } from './tools';

/** Pinned + recently used tools — saved only in this browser (localStorage). */
const PIN_KEY = 'pinned-tools';
export const RECENT_KEY = 'recent-tools';
const MAX_PINS = 12;

export interface ToolRef {
  path: string;
  name: string;
  icon: string;
}

/** Every page a visitor can pin or see in "Recent": all tools + every exam document page. */
export const ALL_TOOLS: ToolRef[] = [
  ...TOOL_GROUPS.flatMap((g) => g.tools).flatMap((t) => (t.path ? [{ path: t.path, name: t.name, icon: t.icon }] : [])),
  ...EXAMS.flatMap((e) => e.docs.map((d) => ({ path: examPath(e, d.kind), name: `${e.name} ${DOC_SHORT[d.kind].toLowerCase()}`, icon: 'scan-face' }))),
];
const BY_PATH = new Map(ALL_TOOLS.map((t) => [t.path, t]));

function read(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class UserTools {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly pinned = signal<string[]>([]);
  readonly recent = signal<string[]>([]);

  /** Call after render (browser only) — prerendered pages never show personal rows. */
  load() {
    if (!this.browser) return;
    this.pinned.set(read(PIN_KEY).filter((p) => BY_PATH.has(p)));
    this.recent.set(read(RECENT_KEY).filter((p) => BY_PATH.has(p)));
  }

  isPinned(path: string) {
    return this.pinned().includes(path);
  }

  /** Returns true when the tool is now pinned. */
  toggle(path: string): boolean {
    const on = !this.isPinned(path);
    this.pinned.update((p) => (on ? [path, ...p].slice(0, MAX_PINS) : p.filter((x) => x !== path)));
    try {
      localStorage.setItem(PIN_KEY, JSON.stringify(this.pinned()));
    } catch {
      /* this visit only */
    }
    return on;
  }

  ref(path: string): ToolRef | undefined {
    return BY_PATH.get(path);
  }
}
