import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { Icon } from '../../shared/icon';

const KEY = 'steps-v1';
/** Set while counting is on, so the page starts counting by itself next time it's opened. */
const AUTO_KEY = 'steps-auto';
interface Saved {
  weight: number;
  height: number;
  sex: 'm' | 'f';
  goal: number;
  days: Record<string, number>;
}
const DEFAULTS: Saved = { weight: 65, height: 165, sex: 'm', goal: 10000, days: {} };

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Step counter using the phone's motion sensor (DeviceMotion) while this page is open,
 * plus distance and calories from height/weight. Everything stays on the device (localStorage).
 * Browsers can't count in the background — the page keeps the screen awake while counting.
 */
@Component({
  selector: 'app-steps-tool',
  imports: [Icon],
  template: `
    <div class="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
      <!-- Progress ring -->
      <div class="relative mx-auto size-52">
        <svg viewBox="0 0 120 120" class="size-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" stroke-width="10" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--brand)" stroke-width="10" stroke-linecap="round"
                  [attr.stroke-dasharray]="ring" [attr.stroke-dashoffset]="ring * (1 - pct())" class="transition-[stroke-dashoffset] duration-500" />
        </svg>
        <div class="absolute inset-0 grid place-items-center text-center">
          <div>
            <span class="text-3xl" [class.walker]="running() && walkState() === 'walking'" aria-hidden="true">{{ running() && walkState() === 'resting' ? '🧘' : '🚶' }}</span>
            <p class="text-3xl font-extrabold tabular-nums" aria-live="polite">{{ fmt(steps()) }}</p>
            <p class="text-xs text-muted">of {{ fmt(goal()) }} steps</p>
            @if (pct() >= 1) { <p class="text-xs font-bold text-green-600">🎉 Goal reached!</p> }
          </div>
        </div>
      </div>

      <div>
        <dl class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-xl bg-surface-2 p-2"><dt class="text-[11px] text-muted">Distance</dt><dd class="text-lg font-bold tabular-nums">{{ km().toFixed(2) }} <span class="text-xs">km</span></dd></div>
          <div class="rounded-xl bg-surface-2 p-2"><dt class="text-[11px] text-muted">Calories</dt><dd class="text-lg font-bold tabular-nums">{{ kcal() }} <span class="text-xs">kcal</span></dd></div>
          <div class="rounded-xl bg-surface-2 p-2"><dt class="text-[11px] text-muted">Walking time</dt><dd class="text-lg font-bold tabular-nums">{{ mins() }} <span class="text-xs">min</span></dd></div>
        </dl>
        <div class="mt-3 flex flex-wrap gap-2">
          @if (!running()) {
            <button type="button" class="btn-primary" (click)="start()"><span aria-hidden="true">▶</span> {{ steps() ? 'Continue counting' : 'Start counting' }}</button>
          } @else {
            <button type="button" class="btn-primary bg-amber-600 hover:bg-amber-700" (click)="stop()"><span aria-hidden="true">⏸</span> Pause</button>
          }
          <button type="button" class="btn-ghost" (click)="reset()" [disabled]="!steps()"><svg lucideIcon="rotate-ccw" [size]="16" /> Reset today</button>
        </div>
        @if (note()) { <p class="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs" role="status">{{ note() }}</p> }
        @if (running()) {
          <p class="mt-2 flex items-center gap-2 text-xs font-semibold" role="status" [class]="walkState() === 'walking' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'">
            <span class="relative flex size-2"><span class="absolute inline-flex size-full animate-ping rounded-full opacity-75" [class]="walkState() === 'walking' ? 'bg-green-500' : 'bg-amber-500'"></span><span class="relative inline-flex size-2 rounded-full" [class]="walkState() === 'walking' ? 'bg-green-600' : 'bg-amber-500'"></span></span>
            @switch (walkState()) {
              @case ('walking') { Walking — counting every step }
              @case ('resting') { Auto-paused — you stopped. Starts again by itself when you walk. }
              @default { Ready — start walking, counting begins after a few steady steps }
            }
          </p>
          <p class="mt-1 text-xs text-muted">No need to tap Pause when you sit — just keep this page open (phone in hand, pocket or on the table). The screen stays on.</p>
        }
        <details class="mt-3 rounded-xl bg-surface-2 p-3 text-xs" open>
          <summary class="cursor-pointer font-semibold">How counting works</summary>
          <ul class="mt-2 list-disc space-y-1 pl-4 text-muted">
            <li>Your phone’s motion sensor feels the small bounce of each step — nothing leaves your phone.</li>
            <li>Tap Start once. When you sit or keep the phone down it auto-pauses, and when you walk again it starts by itself — no Pause/Continue needed.</li>
            <li>It starts counting after about 7 steady steps (and adds them), so picking up or putting down the phone isn’t counted.</li>
            <li>Next time you open this page, counting turns on automatically (tap Pause to turn that off).</li>
            <li>Shakes, bumps and very fast or uneven movement are ignored.</li>
            <li>Counts only while this page is open. Usually within 5–10% of a fitness band.</li>
          </ul>
        </details>
      </div>
    </div>

    <details class="mt-4 rounded-2xl border border-line p-3" [open]="!hasMotion()">
      <summary class="cursor-pointer text-sm font-semibold">Already walked? Enter steps from your phone’s health app</summary>
      <div class="mt-2 flex gap-2">
        <label class="sr-only" for="s-manual">Steps</label>
        <input id="s-manual" class="input" type="number" inputmode="numeric" min="0" max="100000" placeholder="e.g. 6500" [value]="manual()" (input)="manual.set(num($event))" />
        <button type="button" class="btn-primary shrink-0" (click)="setManual()" [disabled]="!validManual()">Use</button>
      </div>
      @if (manual() && !validManual()) { <p class="mt-1 text-xs text-rose-600" role="alert">Enter steps between 1 and 1,00,000.</p> }
    </details>

    <div class="mt-4 grid gap-3 sm:grid-cols-4">
      <div><label class="label" for="s-w">Weight (kg)</label><input id="s-w" class="input" type="number" inputmode="decimal" min="20" max="250" [value]="weight()" (input)="setNum('weight', $event, 20, 250)" /></div>
      <div><label class="label" for="s-h">Height (cm)</label><input id="s-h" class="input" type="number" inputmode="numeric" min="90" max="230" [value]="height()" (input)="setNum('height', $event, 90, 230)" /></div>
      <div>
        <span class="label">Gender</span>
        <div class="flex gap-1.5" role="group" aria-label="Gender">
          <button type="button" class="chip min-h-10 flex-1" [attr.aria-pressed]="sex() === 'm'" (click)="setSex('m')">Male</button>
          <button type="button" class="chip min-h-10 flex-1" [attr.aria-pressed]="sex() === 'f'" (click)="setSex('f')">Female</button>
        </div>
      </div>
      <div><label class="label" for="s-g">Daily goal</label><input id="s-g" class="input" type="number" inputmode="numeric" min="1000" max="50000" step="500" [value]="goal()" (input)="setNum('goal', $event, 1000, 50000)" /></div>
    </div>
    <p class="mt-1 text-xs text-muted">Stride ≈ {{ (stride() * 100).toFixed(0) }} cm (from height). Saved only on this device.</p>

    @if (week().length) {
      <h3 class="mt-5 mb-2 text-sm font-bold">Last 7 days</h3>
      <div class="flex h-28 items-end gap-2" role="img" [attr.aria-label]="'Steps in the last 7 days'">
        @for (d of week(); track d.date) {
          <div class="flex flex-1 flex-col items-center gap-1">
            <span class="text-[10px] tabular-nums text-muted">{{ d.steps ? short(d.steps) : '' }}</span>
            <div class="w-full rounded-t-md" [class]="d.steps >= goal() ? 'bg-green-500' : 'bg-brand/70'" [style.height.%]="d.h"></div>
            <span class="text-[10px] text-muted">{{ d.label }}</span>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .walker { display: inline-block; animation: walk 0.6s ease-in-out infinite alternate; }
    @keyframes walk { from { transform: translateX(-3px) rotate(-4deg); } to { transform: translateX(3px) rotate(4deg); } }
    @media (prefers-reduced-motion: reduce) { .walker { animation: none; } }
  `,
})
export class StepsTool {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly ring = 2 * Math.PI * 52;
  protected readonly weight = signal(DEFAULTS.weight);
  protected readonly height = signal(DEFAULTS.height);
  protected readonly sex = signal<'m' | 'f'>(DEFAULTS.sex);
  protected readonly goal = signal(DEFAULTS.goal);
  private readonly days = signal<Record<string, number>>({});
  protected readonly steps = computed(() => this.days()[today()] ?? 0);
  protected readonly running = signal(false);
  protected readonly note = signal<string | null>(null);
  protected readonly hasMotion = signal(true);
  protected readonly manual = signal<number | null>(null);

  /** Stride from height (common rule: 41.5% men, 41.3% women). */
  protected readonly stride = computed(() => (this.height() * (this.sex() === 'm' ? 0.415 : 0.413)) / 100);
  protected readonly km = computed(() => (this.steps() * this.stride()) / 1000);
  /** Walking ≈ 0.57 kcal per pound per mile → 0.78 kcal per kg per km (estimate). */
  protected readonly kcal = computed(() => Math.round(this.km() * this.weight() * 0.78));
  /** ~100 steps a minute at a normal pace. */
  protected readonly mins = computed(() => Math.round(this.steps() / 100));
  protected readonly pct = computed(() => Math.min(1, this.steps() / this.goal()));
  protected readonly validManual = computed(() => {
    const m = this.manual();
    return m != null && Number.isInteger(m) && m > 0 && m <= 100000;
  });
  protected readonly week = computed(() => {
    const out: { date: string; label: string; steps: number; h: number }[] = [];
    const d = this.days();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
      out.push({ date: iso, label: x.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2), steps: d[iso] ?? 0, h: 0 });
    }
    const max = Math.max(this.goal(), ...out.map((o) => o.steps));
    out.forEach((o) => (o.h = Math.max(o.steps ? 4 : 1, (o.steps / max) * 100)));
    return out.some((o) => o.steps) ? out : [];
  });

  // Step detection state (gravity-removed, smoothed signal; steps confirmed only during steady walking)
  private gravity = 9.81;
  private smooth = 0;
  private above = false;
  private peak = 0;
  private lastCandidate = 0;
  private intervals: number[] = [];
  private pending = 0;
  private walking = false;
  private gotMotion = false;
  /** Shown while counting: 'waiting' until steady walking is confirmed, 'walking', then 'resting' once the walker stops (auto-pause) */
  protected readonly walkState = signal<'waiting' | 'walking' | 'resting'>('waiting');
  private wake: { release(): Promise<void> } | null = null;
  private readonly onMotion = (e: DeviceMotionEvent) => this.motion(e);

  constructor() {
    afterNextRender(() => {
      try {
        const s = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Saved>) };
        this.weight.set(s.weight);
        this.height.set(s.height);
        this.sex.set(s.sex);
        this.goal.set(s.goal);
        this.days.set(s.days ?? {});
      } catch {
        /* defaults */
      }
      this.hasMotion.set(typeof DeviceMotionEvent !== 'undefined');
      // Counting was on last time: start again without a tap
      let auto = false;
      try {
        auto = localStorage.getItem(AUTO_KEY) === '1';
      } catch {
        /* no storage */
      }
      if (auto && this.hasMotion()) void this.start(true);
    });
    // The browser drops the screen lock when the tab is hidden — take it again on return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && this.running() && !this.wake) void this.keepAwake();
    };
    if (this.browser) document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      if (this.browser) document.removeEventListener('visibilitychange', onVisible);
      this.halt();
    });
  }

  /** `auto`: opened without a tap — on iPhone motion permission needs a tap, so just wait for Start. */
  protected async start(auto = false) {
    if (!this.browser) return;
    this.note.set(null);
    if (typeof DeviceMotionEvent === 'undefined') {
      this.hasMotion.set(false);
      return this.note.set('This device has no motion sensor. Enter steps from your phone’s health app below.');
    }
    // iPhone asks permission for motion, only after a tap
    const req = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
    if (req) {
      try {
        const r = await req();
        if (r !== 'granted' && auto) return;
        if (r !== 'granted') return this.note.set('Motion permission was denied. Allow “Motion & Orientation” in Settings → Safari, then try again.');
      } catch {
        if (auto) return;
        return this.note.set('Couldn’t get motion permission. Enter steps below instead.');
      }
    }
    this.gotMotion = false;
    this.resetWalk();
    this.walkState.set('waiting');
    this.lastCandidate = 0;
    window.addEventListener('devicemotion', this.onMotion);
    this.running.set(true);
    this.setAuto(true);
    await this.keepAwake();
    setTimeout(() => {
      if (this.running() && !this.gotMotion) {
        this.stop();
        this.hasMotion.set(false);
        this.note.set('No movement sensor found (laptops and some browsers don’t have one). Use this on your phone, or enter steps below.');
      }
    }, 3000);
  }

  /** Pause button: stop counting and don't auto-start on the next visit. */
  protected stop() {
    this.setAuto(false);
    this.halt();
  }

  private halt() {
    if (typeof window !== 'undefined') window.removeEventListener('devicemotion', this.onMotion);
    if (this.running()) this.save();
    this.running.set(false);
    void this.wake?.release().catch(() => undefined);
    this.wake = null;
  }

  private async keepAwake() {
    try {
      const lock = await (navigator as unknown as { wakeLock?: { request(t: 'screen'): Promise<WakeLockSentinel> } }).wakeLock?.request('screen');
      this.wake = lock ?? null;
      lock?.addEventListener('release', () => (this.wake = null));
    } catch {
      this.wake = null;
    }
  }

  private setAuto(on: boolean) {
    try {
      if (on) localStorage.setItem(AUTO_KEY, '1');
      else localStorage.removeItem(AUTO_KEY);
    } catch {
      /* no storage */
    }
  }

  /**
   * Pedometer, the way phone step counters work:
   * 1. remove gravity (slow average) and smooth jitter → only body bounce remains;
   * 2. a step = a bounce peak between 1.2 and 12 m/s² (bigger = phone put down / dropped / shaken → ignored);
   * 3. steps must come at a walking rhythm (0.27–2 s apart) and evenly spaced;
   * 4. counting starts only after 7 steady steps in a row (those 7 are then added), and a pause > 2 s resets it.
   */
  private motion(e: DeviceMotionEvent) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    this.gotMotion = true;
    const m = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    this.gravity = this.gravity * 0.95 + m * 0.05;
    this.smooth = this.smooth * 0.6 + (m - this.gravity) * 0.4;
    const now = performance.now();
    if (this.walking && now - this.lastCandidate > 2000) this.resetWalk();
    if (!this.above) {
      if (this.smooth > 1.2) (this.above = true), (this.peak = this.smooth);
      return;
    }
    this.peak = Math.max(this.peak, this.smooth);
    if (this.smooth > 0.3) return; // still on the same bounce
    this.above = false;
    if (this.peak > 12) return this.resetWalk(); // a jolt, not a step
    const dt = now - this.lastCandidate;
    this.lastCandidate = now;
    if (dt < 270) return; // too fast to be a step (vibration)
    if (dt > 2000) {
      // first step after a pause: start a fresh check
      this.resetWalk();
      this.pending = 1;
      return;
    }
    this.intervals = [...this.intervals.slice(-5), dt];
    const avg = this.intervals.reduce((x, y) => x + y, 0) / this.intervals.length;
    const steady = this.intervals.every((i) => Math.abs(i - avg) < avg * 0.45);
    if (this.walking) return void this.add(1);
    if (!steady) {
      this.pending = 1;
      this.intervals = [dt];
      return;
    }
    this.pending++;
    if (this.pending >= 7) {
      this.walking = true;
      this.walkState.set('walking');
      this.add(this.pending);
      this.pending = 0;
    }
  }

  private resetWalk() {
    if (this.walking) {
      this.walkState.set('resting'); // auto-pause: resumes by itself after a few steady steps
      this.save();
    }
    this.walking = false;
    this.pending = 0;
    this.intervals = [];
  }

  private add(n: number) {
    this.days.update((d) => ({ ...d, [today()]: (d[today()] ?? 0) + n }));
    if (this.steps() % 20 === 0) this.save();
  }

  protected setManual() {
    if (!this.validManual()) return;
    this.days.update((d) => ({ ...d, [today()]: this.manual()! }));
    this.save();
  }

  protected reset() {
    this.days.update((d) => ({ ...d, [today()]: 0 }));
    this.save();
  }

  protected setNum(k: 'weight' | 'height' | 'goal', e: Event, min: number, max: number) {
    const v = Number((e.target as HTMLInputElement).value);
    if (!Number.isFinite(v) || v < min || v > max) return;
    this[k].set(v);
    this.save();
  }
  protected setSex(s: 'm' | 'f') {
    this.sex.set(s);
    this.save();
  }

  private save() {
    try {
      const days = Object.fromEntries(Object.entries(this.days()).sort().slice(-60));
      localStorage.setItem(KEY, JSON.stringify({ weight: this.weight(), height: this.height(), sex: this.sex(), goal: this.goal(), days }));
    } catch {
      /* private mode: still works for this visit */
    }
  }

  protected num(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    return v === '' ? null : Number(v);
  }
  protected fmt(n: number) {
    return n.toLocaleString('en-IN');
  }
  protected short(n: number) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }
}
