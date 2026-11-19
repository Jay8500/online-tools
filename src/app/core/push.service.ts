import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';

/** Public half of the push key pair (the private half lives only in Netlify env VAPID_PRIVATE_KEY). */
const VAPID_PUBLIC = 'BBk-VNCqjSdNjucFILuiLxTq18nO0A3-8-9piTH336kKkHKHFqpMXi_1t0wHaDKkYEGcyra_2bpNBn-lLBC0Qog';
const ON = 'push-on';
const TOPICS_KEY = 'push-topics';
export type Topic = 'gold' | 'jobs' | 'festival' | 'news' | 'walk';
export interface GoldWatch {
  metal: string;
  below: number;
}

/**
 * Web push on this phone (browser or installed app): the browser's own push service, no third-party SDK.
 * The chosen topics live on our server only while notifications are on; turning off deletes them.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly sw = inject(SwPush);
  /** True when this browser can get pushes while the site is closed. */
  readonly supported = typeof window !== 'undefined' && this.sw.isEnabled && 'PushManager' in window;
  readonly on = signal(this.read(ON) === '1');
  readonly topics = signal<Topic[]>(this.readTopics());
  private gold: GoldWatch | undefined;

  private read(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  }
  private readTopics(): Topic[] {
    try {
      const t = JSON.parse(this.read(TOPICS_KEY) || '[]');
      return Array.isArray(t) ? t : [];
    } catch {
      return [];
    }
  }
  private remember() {
    try {
      localStorage.setItem(TOPICS_KEY, JSON.stringify(this.topics()));
      if (this.on()) localStorage.setItem(ON, '1');
      else localStorage.removeItem(ON);
    } catch {}
  }

  private async post(body: Record<string, unknown>) {
    const r = await fetch('/api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({})))['error'] || 'Push failed');
  }

  private goldFromPhone(): GoldWatch | undefined {
    try {
      const w = JSON.parse(this.read('price-watch') || 'null');
      return w?.metal && w.below > 0 ? { metal: w.metal, below: w.below } : undefined;
    } catch {
      return undefined;
    }
  }

  /** Send this phone's topics (and gold target) to the server; asks permission the first time. */
  private async sync(ask: boolean) {
    if (!this.supported) return false;
    let sub = await firstValueFrom(this.sw.subscription);
    if (!sub && ask) sub = await this.sw.requestSubscription({ serverPublicKey: VAPID_PUBLIC });
    if (!sub) return false;
    const gold = this.topics().includes('gold') ? (this.gold ?? this.goldFromPhone()) : undefined;
    await this.post({ a: 'sub', sub: sub.toJSON(), topics: this.topics(), gold });
    this.on.set(true);
    this.remember();
    return true;
  }

  /** Turn one alert on or off (asks for permission when turning the first one on). */
  async setTopic(t: Topic, wanted: boolean, gold?: GoldWatch) {
    if (gold) this.gold = gold;
    const next = wanted ? [...new Set([...this.topics(), t])] : this.topics().filter((x) => x !== t);
    const before = this.topics();
    this.topics.set(next);
    try {
      return await this.sync(wanted);
    } catch (e) {
      this.topics.set(before);
      this.remember();
      throw e;
    }
  }

  /** Gold page: target changed or removed (no permission prompt). */
  async updateGold(gold: GoldWatch | null) {
    this.gold = gold ?? undefined;
    if (!this.on()) return;
    if (!gold) this.topics.update((t) => t.filter((x) => x !== 'gold'));
    await this.sync(false).catch(() => undefined);
  }

  async test() {
    const sub = await firstValueFrom(this.sw.subscription);
    if (!sub) throw new Error('Notifications are off');
    await this.post({ a: 'test', endpoint: sub.endpoint });
  }

  /** Off everywhere: our server forgets this phone, the browser drops the subscription. */
  async disable() {
    const sub = this.supported ? await firstValueFrom(this.sw.subscription) : null;
    if (sub) {
      await this.post({ a: 'unsub', endpoint: sub.endpoint }).catch(() => undefined);
      await this.sw.unsubscribe().catch(() => undefined);
    }
    this.on.set(false);
    this.topics.set([]);
    this.remember();
  }
}
