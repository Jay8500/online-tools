import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';

/** Public half of the push key pair (the private half lives only in Netlify env VAPID_PRIVATE_KEY). */
const VAPID_PUBLIC = 'BBk-VNCqjSdNjucFILuiLxTq18nO0A3-8-9piTH336kKkHKHFqpMXi_1t0wHaDKkYEGcyra_2bpNBn-lLBC0Qog';
const ON = 'push-on';
export interface GoldWatch {
  metal: string;
  below: number;
}

/**
 * Web push on this phone (browser or installed app): the browser's own push service, no third-party SDK.
 * Topics live on our server only as long as notifications are on; turning off deletes them.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly sw = inject(SwPush);
  /** True when this browser can get pushes while the site is closed. */
  readonly supported = typeof window !== 'undefined' && this.sw.isEnabled && 'PushManager' in window;
  readonly on = signal(this.read());

  private read() {
    try {
      return localStorage.getItem(ON) === '1';
    } catch {
      return false;
    }
  }

  private async post(body: Record<string, unknown>) {
    const r = await fetch('/api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({})))['error'] || 'Push failed');
  }

  /** Ask permission (first time), subscribe and save the topics. */
  async enable(gold?: GoldWatch) {
    if (!this.supported) return false;
    const sub = (await firstValueFrom(this.sw.subscription)) ?? (await this.sw.requestSubscription({ serverPublicKey: VAPID_PUBLIC }));
    await this.post({ a: 'sub', sub: sub.toJSON(), topics: gold ? ['gold'] : [], gold });
    this.on.set(true);
    try {
      localStorage.setItem(ON, '1');
    } catch {}
    return true;
  }

  /** Update the gold target while notifications are on (no permission prompt). */
  async updateGold(gold: GoldWatch | null) {
    if (!this.supported || !this.on()) return;
    const sub = await firstValueFrom(this.sw.subscription);
    if (sub) await this.post({ a: 'sub', sub: sub.toJSON(), topics: gold ? ['gold'] : [], gold: gold ?? undefined }).catch(() => undefined);
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
    try {
      localStorage.removeItem(ON);
    } catch {}
  }
}
