import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { phoneLang } from '../../core/langs';
import { ToastService } from '../../core/toast.service';
import { Crop, NO_CROP, PhotoCrop, drawCropped } from '../../shared/photo-crop';
import { Icon } from '../../shared/icon';

type Lang = 'te' | 'en' | 'hi';
type EvId = 'wedding' | 'engagement' | 'housewarming' | 'birthday' | 'naming' | 'seemantham' | 'upanayanam' | 'other';
type ThemeId = 'maroon' | 'royal' | 'green' | 'saffron' | 'cream' | 'blush' | 'sky';

interface Words {
  title: string;
  line: string;
  bless: string;
}
interface Ev extends Record<Lang, Words> {
  id: EvId;
  chip: string;
  emoji: string;
  couple: boolean;
  theme: ThemeId;
  /** time label: muhurtham for sacred functions */
  muhurtham: boolean;
  /** one-person events: what the main name field is */
  who?: string;
  whoHint?: string;
  subHint?: string;
  sample?: Record<Lang, string>;
}
interface Theme {
  id: ThemeId;
  name: string;
  bg: [string, string];
  ink: string;
  soft: string;
  accent: string;
}

const GANESHA: Record<Lang, string> = { te: '॥ శ్రీ గణేశాయ నమః ॥', en: '|| Shree Ganeshaya Namah ||', hi: '॥ श्री गणेशाय नमः ॥' };
const SRIRASTU: Record<Lang, string> = { te: 'శ్రీరస్తు  ·  శుభమస్తు  ·  అవిఘ్నమస్తు', en: 'Srirastu · Subhamastu · Avighnamastu', hi: '॥ श्री गणेशाय नमः ॥' };

const EVENTS: Ev[] = [
  {
    id: 'wedding', chip: 'Wedding (Pelli)', emoji: '💍', couple: true, theme: 'maroon', muhurtham: true,
    te: { title: 'శుభ వివాహ ఆహ్వానం', line: 'సకుటుంబ సపరివార సమేతంగా విచ్చేసి వధూవరులను ఆశీర్వదించగలరు', bless: SRIRASTU.te },
    en: { title: 'Wedding Invitation', line: 'Together with our families, we joyfully invite you to bless the couple at the wedding of', bless: GANESHA.en },
    hi: { title: 'शुभ विवाह', line: 'आप सपरिवार पधारकर वर-वधू को अपना आशीर्वाद दें', bless: GANESHA.hi },
  },
  {
    id: 'engagement', chip: 'Engagement', emoji: '💐', couple: true, theme: 'royal', muhurtham: true,
    te: { title: 'నిశ్చితార్థ ఆహ్వానం', line: 'మా ఇంట జరుగు నిశ్చితార్థ వేడుకకు మీరు సకుటుంబంగా విచ్చేసి ఆశీర్వదించగలరు', bless: GANESHA.te },
    en: { title: 'Engagement Ceremony', line: 'We joyfully invite you to celebrate the engagement of', bless: GANESHA.en },
    hi: { title: 'सगाई समारोह', line: 'आप सपरिवार पधारकर इस शुभ अवसर की शोभा बढ़ाएँ', bless: GANESHA.hi },
  },
  {
    id: 'housewarming', chip: 'Housewarming (Gruhapravesam)', emoji: '🏡', couple: false, theme: 'green', muhurtham: true,
    who: 'Family name', whoHint: 'e.g. Lakkoju family', subHint: 'e.g. Sri Ravi & Smt Sita',
    sample: { te: 'లక్కోజు కుటుంబం', en: 'The Lakkoju Family', hi: 'शर्मा परिवार' },
    te: { title: 'గృహప్రవేశ ఆహ్వానం', line: 'మా నూతన గృహప్రవేశ మహోత్సవానికి మీరు సకుటుంబంగా విచ్చేసి ఆశీర్వదించగలరు', bless: GANESHA.te },
    en: { title: 'Housewarming', line: 'We warmly invite you and your family to bless our new home', bless: GANESHA.en },
    hi: { title: 'गृह प्रवेश', line: 'हमारे नए घर के गृह प्रवेश में आप सपरिवार पधारें और आशीर्वाद दें', bless: GANESHA.hi },
  },
  {
    id: 'birthday', chip: 'Birthday', emoji: '🎂', couple: false, theme: 'sky', muhurtham: false,
    who: 'Birthday person’s name', whoHint: 'e.g. Baby Aadya', subHint: 'e.g. D/o Ravi & Sita',
    sample: { te: 'చిన్నారి ఆద్య', en: 'Aadya', hi: 'आद्या' },
    te: { title: 'పుట్టినరోజు వేడుక', line: 'మా చిన్నారి పుట్టినరోజు వేడుకకు మీరు సకుటుంబంగా విచ్చేసి ఆశీర్వదించగలరు', bless: '' },
    en: { title: 'Birthday Party', line: 'Please join us to celebrate the birthday of', bless: '' },
    hi: { title: 'जन्मदिन समारोह', line: 'जन्मदिन के इस खुशी के मौके पर आप सपरिवार ज़रूर पधारें', bless: '' },
  },
  {
    id: 'naming', chip: 'Naming (Barasala)', emoji: '👶', couple: false, theme: 'blush', muhurtham: true,
    who: 'Baby’s name', whoHint: 'e.g. Baby of Ravi & Sita', subHint: 'e.g. S/o Ravi & Sita',
    sample: { te: 'చిన్నారి', en: 'Our Little One', hi: 'हमारे नन्हे मेहमान' },
    te: { title: 'నామకరణ మహోత్సవం', line: 'మా చిన్నారి బారసాల (నామకరణ) వేడుకకు మీరు సకుటుంబంగా విచ్చేసి ఆశీర్వదించగలరు', bless: GANESHA.te },
    en: { title: 'Naming Ceremony', line: 'Please join us to bless our little one at the naming ceremony', bless: GANESHA.en },
    hi: { title: 'नामकरण संस्कार', line: 'हमारे नन्हे मेहमान के नामकरण संस्कार में आप सपरिवार पधारें और आशीर्वाद दें', bless: GANESHA.hi },
  },
  {
    id: 'seemantham', chip: 'Seemantham (Baby shower)', emoji: '🌸', couple: false, theme: 'blush', muhurtham: true,
    who: 'Mother-to-be’s name', whoHint: 'e.g. Sita', subHint: 'e.g. W/o Ravi',
    sample: { te: 'సీత', en: 'Sita', hi: 'सीता' },
    te: { title: 'సీమంతం వేడుక', line: 'మా ఇంట జరుగు సీమంతం వేడుకకు మీరు సకుటుంబంగా విచ్చేసి ఆశీర్వదించగలరు', bless: GANESHA.te },
    en: { title: 'Seemantham', line: 'Please join us to bless the mother-to-be at the baby shower of', bless: GANESHA.en },
    hi: { title: 'गोद भराई', line: 'गोद भराई की रस्म में आप सपरिवार पधारें और माँ-शिशु को आशीर्वाद दें', bless: GANESHA.hi },
  },
  {
    id: 'upanayanam', chip: 'Upanayanam', emoji: '🪔', couple: false, theme: 'saffron', muhurtham: true,
    who: 'Boy’s name (vatuvu)', whoHint: 'e.g. Chi. Karthik', subHint: 'e.g. S/o Sri Ravi & Smt Sita',
    sample: { te: 'చి. కార్తీక్', en: 'Chi. Karthik', hi: 'चि. कार्तिक' },
    te: { title: 'ఉపనయన మహోత్సవం', line: 'మా చిరంజీవి ఉపనయన మహోత్సవానికి మీరు సకుటుంబంగా విచ్చేసి ఆశీర్వదించగలరు', bless: GANESHA.te },
    en: { title: 'Upanayanam', line: 'We invite you to bless our son at his sacred thread ceremony', bless: GANESHA.en },
    hi: { title: 'उपनयन संस्कार', line: 'हमारे पुत्र के उपनयन संस्कार में आप सपरिवार पधारकर आशीर्वाद दें', bless: GANESHA.hi },
  },
  {
    id: 'other', chip: 'Other function', emoji: '✨', couple: false, theme: 'cream', muhurtham: false,
    who: 'Name(s) on the card', whoHint: 'e.g. Ravi & Sita', subHint: 'Optional line under the name',
    sample: { te: 'రవి & సీత', en: 'Ravi & Sita', hi: 'रवि और सीता' },
    te: { title: 'ఆహ్వానం', line: 'ఈ శుభ సందర్భానికి మీరు సకుటుంబంగా విచ్చేయగలరు', bless: '' },
    en: { title: 'You’re Invited', line: 'We would love to have you with us to celebrate', bless: '' },
    hi: { title: 'निमंत्रण', line: 'इस शुभ अवसर पर आप सपरिवार अवश्य पधारें', bless: '' },
  },
];

const THEMES: Theme[] = [
  { id: 'maroon', name: 'Maroon & gold', bg: ['#7a1020', '#3b0710'], ink: '#fff7e8', soft: '#f6dcc0', accent: '#e9c46a' },
  { id: 'royal', name: 'Royal blue', bg: ['#1e3a8a', '#0f1d4a'], ink: '#f8fafc', soft: '#dbe4ff', accent: '#f2c66d' },
  { id: 'green', name: 'Temple green', bg: ['#14532d', '#0a2e1c'], ink: '#f7fee7', soft: '#d9f2df', accent: '#f5d27a' },
  { id: 'saffron', name: 'Saffron', bg: ['#c2410c', '#7c2d12'], ink: '#fff7ed', soft: '#ffe4c7', accent: '#fde68a' },
  { id: 'cream', name: 'Cream classic', bg: ['#fffaf0', '#f3ddb5'], ink: '#4a1608', soft: '#6b3a22', accent: '#b7791f' },
  { id: 'blush', name: 'Blush pink', bg: ['#fff1f4', '#f7c6d3'], ink: '#4c0f24', soft: '#6d2a40', accent: '#be3a64' },
  { id: 'sky', name: 'Party blue', bg: ['#eff6ff', '#bfd7ff'], ink: '#0f2a5c', soft: '#2f4a7a', accent: '#2563eb' },
];

const LANG_CHIPS: { id: Lang; own: string }[] = [
  { id: 'te', own: 'తెలుగు' },
  { id: 'en', own: 'English' },
  { id: 'hi', own: 'हिन्दी' },
];
const LABEL: Record<Lang, { time: string; muhurtham: string; venue: string; host: string; scan: string; weds: string; and: string }> = {
  te: { time: 'సమయం', muhurtham: 'ముహూర్తం', venue: 'వేదిక', host: 'ఆహ్వానించువారు', scan: 'లొకేషన్ కోసం స్కాన్ చేయండి', weds: '&', and: '&' },
  en: { time: 'Time', muhurtham: 'Muhurtham', venue: 'Venue', host: 'With love,', scan: 'Scan for location', weds: 'weds', and: '&' },
  hi: { time: 'समय', muhurtham: 'मुहूर्त', venue: 'स्थान', host: 'निवेदक', scan: 'लोकेशन के लिए स्कैन करें', weds: 'संग', and: '&' },
};
const SAMPLE_COUPLE: Record<Lang, [string, string]> = { te: ['రవి', 'సీత'], en: ['Ravi', 'Sita'], hi: ['रवि', 'सीता'] };

const W = 1080;
const H = 1440;
const EN_FONT = 'Inter, "Segoe UI", Roboto, system-ui, sans-serif';
const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';
const FONT: Record<Lang, string> = {
  te: '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Mallanna", sans-serif',
  en: EN_FONT,
  hi: '"Noto Sans Devanagari", "Nirmala UI", "Mangal", "Kohinoor Devanagari", sans-serif',
};
const DRAFT_KEY = 'invite-draft-v1';
const PAGE = 'tools.spreadapps.in/invitation-card-maker';

interface Form {
  ev: EvId;
  lang: Lang;
  theme: ThemeId;
  groom: string;
  groomP: string;
  bride: string;
  brideP: string;
  brideFirst: boolean;
  name: string;
  sub: string;
  age: string;
  date: string;
  time: string;
  venue: string;
  addr: string;
  map: string;
  host: string;
  note: string;
  /** null = use the event's default wording */
  title: string | null;
  line: string | null;
  bless: string | null;
}
type TextKey = { [K in keyof Form]: Form[K] extends string ? K : never }[keyof Form];

function blank(lang: Lang = 'te'): Form {
  return { ev: 'wedding', lang, theme: 'maroon', groom: '', groomP: '', bride: '', brideP: '', brideFirst: false, name: '', sub: '', age: '', date: '', time: '', venue: '', addr: '', map: '', host: '', note: '', title: null, line: null, bless: null };
}

/** 1 → 1st (en), మొదటి (te), पहला (hi) — for "Nth Birthday". */
function ordinal(n: number, lang: Lang): string {
  if (lang === 'te') return n === 1 ? 'మొదటి' : `${n}వ`;
  if (lang === 'hi') return ['', 'पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पाँचवाँ', 'छठा'][n] ?? `${n}वाँ`;
  const t = n % 100, s = t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

/** yyyy-mm-dd → "Friday, 12 February 2027" in the card's language. */
function niceDate(d: string, lang: Lang): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const dt = new Date(`${d}T12:00:00`);
  try {
    return new Intl.DateTimeFormat(`${lang}-IN`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dt);
  } catch {
    return d;
  }
}

/** hh:mm → "10:30 AM" / "ఉదయం 10:30 గంటలకు" / "सुबह 10:30 बजे". */
function niceTime(t: string, lang: Lang): string {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m) return '';
  const h = +m[1], mm = m[2], h12 = h % 12 || 12;
  if (lang === 'en') return `${h12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
  const part = h >= 4 && h < 12 ? 0 : h >= 12 && h < 16 ? 1 : h >= 16 && h < 19 ? 2 : 3;
  if (lang === 'te') return `${['ఉదయం', 'మధ్యాహ్నం', 'సాయంత్రం', 'రాత్రి'][part]} ${h12}:${mm} గంటలకు`;
  return `${['सुबह', 'दोपहर', 'शाम', 'रात'][part]} ${h12}:${mm} बजे`;
}

/** "Sri Ravi & Smt Sita" → "S/o Sri Ravi & Smt Sita" / "… గార్ల కుమారుడు" / "सुपुत्र …". */
function childOf(parents: string, son: boolean, lang: Lang): string {
  if (!parents) return '';
  if (lang === 'te') return `${parents} ${/&|,| and /i.test(parents) ? 'గార్ల' : 'గారి'} ${son ? 'కుమారుడు' : 'కుమార్తె'}`;
  if (lang === 'hi') return `${son ? 'सुपुत्र' : 'सुपुत्री'} ${parents}`;
  return `${son ? 'S/o' : 'D/o'} ${parents}`;
}

function validMap(u: string): boolean {
  try {
    return new URL(u).protocol === 'https:';
  } catch {
    return false;
  }
}

type Block =
  | { k: 'text'; text: string; size: number; weight: string; color: string; font: string; gap: number; max: number; alpha?: number }
  | { k: 'div'; gap: number }
  | { k: 'photo'; r: number; gap: number }
  | { k: 'qr'; size: number; gap: number; caption: string; font: string };
type Placed = Block & { h: number; lines?: string[]; s?: number; lh?: number };

@Component({
  selector: 'app-invite-tool',
  imports: [PhotoCrop, Icon],
  template: `
    <div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div class="space-y-4">
        <div>
          <p class="label">Function</p>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Function">
            @for (e of events; track e.id) {
              <button type="button" class="chip min-h-9 text-sm" [attr.aria-pressed]="f().ev === e.id" (click)="setEvent(e.id)">{{ e.emoji }} {{ e.chip }}</button>
            }
          </div>
        </div>
        <div>
          <p class="label">Card language</p>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Card language">
            @for (l of langs; track l.id) {
              <button type="button" class="chip min-h-9 text-sm" [attr.lang]="l.id" [attr.aria-pressed]="f().lang === l.id" (click)="setLang(l.id)">{{ l.own }}</button>
            }
          </div>
          <p class="mt-1 text-xs text-muted">Names can be typed in English or your language — both look fine on the card.</p>
        </div>
        <div>
          <p class="label">Design</p>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Design">
            @for (t of themes; track t.id) {
              <button type="button" class="size-10 rounded-full border-2 shadow-sm transition-transform" [class.scale-110]="f().theme === t.id"
                [style.border-color]="f().theme === t.id ? t.accent : 'transparent'" [style.background]="swatch(t)"
                [attr.aria-pressed]="f().theme === t.id" [attr.aria-label]="t.name" [title]="t.name" (click)="patch('theme', t.id)"></button>
            }
          </div>
        </div>

        @if (ev().couple) {
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="label" for="i-groom">Groom’s name</label>
              <input id="i-groom" class="input" maxlength="40" placeholder="e.g. Ravi" [value]="f().groom" (input)="set('groom', $event)" />
            </div>
            <div>
              <label class="label" for="i-bride">Bride’s name</label>
              <input id="i-bride" class="input" maxlength="40" placeholder="e.g. Sita" [value]="f().bride" (input)="set('bride', $event)" />
            </div>
            <div>
              <label class="label" for="i-gp">Groom’s parents <span class="text-muted">(optional)</span></label>
              <input id="i-gp" class="input" maxlength="60" placeholder="e.g. Sri Rao & Smt Lakshmi" [value]="f().groomP" (input)="set('groomP', $event)" />
            </div>
            <div>
              <label class="label" for="i-bp">Bride’s parents <span class="text-muted">(optional)</span></label>
              <input id="i-bp" class="input" maxlength="60" placeholder="e.g. Sri Murthy & Smt Devi" [value]="f().brideP" (input)="set('brideP', $event)" />
            </div>
          </div>
          <button type="button" class="btn-ghost min-h-9 text-sm" (click)="patch('brideFirst', !f().brideFirst)">⇅ {{ f().brideFirst ? 'Groom’s name first' : 'Bride’s name first' }}</button>
        } @else {
          <div [class]="ev().id === 'birthday' ? 'grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]' : 'grid gap-3'">
            <div>
              <label class="label" for="i-name">{{ ev().who }}</label>
              <input id="i-name" class="input" maxlength="50" [placeholder]="ev().whoHint" [value]="f().name" (input)="set('name', $event)" />
            </div>
            @if (ev().id === 'birthday') {
              <div>
                <label class="label" for="i-age">Turning <span class="text-muted">(age)</span></label>
                <input id="i-age" class="input" inputmode="numeric" maxlength="3" placeholder="e.g. 1" [value]="f().age" (input)="setAge($event)" />
              </div>
            }
          </div>
          <div>
            <label class="label" for="i-sub">Line under the name <span class="text-muted">(optional)</span></label>
            <input id="i-sub" class="input" maxlength="60" [placeholder]="ev().subHint" [value]="f().sub" (input)="set('sub', $event)" />
          </div>
        }

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="label" for="i-date">Date</label>
            <input id="i-date" type="date" class="input" [value]="f().date" (input)="set('date', $event)" />
          </div>
          <div>
            <label class="label" for="i-time">{{ ev().muhurtham ? 'Muhurtham time' : 'Time' }}</label>
            <input id="i-time" type="time" class="input" [value]="f().time" (input)="set('time', $event)" />
          </div>
        </div>
        <div>
          <label class="label" for="i-venue">Venue</label>
          <input id="i-venue" class="input" maxlength="60" placeholder="e.g. Sri Venkateswara Function Hall" [value]="f().venue" (input)="set('venue', $event)" />
        </div>
        <div>
          <label class="label" for="i-addr">Address / city <span class="text-muted">(optional)</span></label>
          <input id="i-addr" class="input" maxlength="80" placeholder="e.g. Kukatpally, Hyderabad" [value]="f().addr" (input)="set('addr', $event)" />
        </div>
        <div>
          <label class="label" for="i-host">Invited by <span class="text-muted">(optional)</span></label>
          <input id="i-host" class="input" maxlength="60" placeholder="e.g. Lakkoju family & friends" [value]="f().host" (input)="set('host', $event)" />
        </div>

        <div>
          <p class="label">Photo <span class="text-muted">(optional)</span></p>
          <div class="flex flex-wrap items-center gap-2">
            <label class="btn-ghost min-h-10 cursor-pointer text-sm">
              <svg lucideIcon="image-up" [size]="16" /> {{ photo() ? 'Change photo' : 'Add photo' }}
              <input type="file" accept="image/*" class="sr-only" (change)="pick($event)" />
            </label>
            @if (photo()) {
              <button type="button" class="btn-ghost min-h-10 text-sm" (click)="cropping.set(true)"><svg lucideIcon="crop" [size]="16" /> Adjust</button>
              <button type="button" class="btn-ghost min-h-10 text-sm" (click)="photo.set(null)">Remove</button>
            }
          </div>
          <p class="mt-1 text-xs text-muted">Your photo stays on your phone — it is never uploaded.</p>
          @if (cropping() && photo(); as img) { <app-photo-crop [image]="img" [start]="crop()" (done)="crop.set($event); cropping.set(false)" (cancelled)="cropping.set(false)" /> }
        </div>

        <details class="rounded-xl border border-line p-3" [open]="moreOpen()" (toggle)="moreOpen.set($any($event.target).open)">
          <summary class="cursor-pointer text-sm font-semibold">More options — wording, location QR, extra note</summary>
          <div class="mt-3 space-y-3">
            <div>
              <label class="label" for="i-map">Google Maps link <span class="text-muted">(optional)</span></label>
              <input id="i-map" class="input" inputmode="url" maxlength="300" placeholder="Paste from Google Maps → Share" [value]="f().map" (input)="set('map', $event)" />
              @if (f().map && !mapOk()) { <p class="mt-1 text-xs text-red-600">Paste a full link starting with https:// (Google Maps → Share → Copy link).</p> }
              @else { <p class="mt-1 text-xs text-muted">Adds a “scan for location” QR on the card and the link in your WhatsApp message.</p> }
            </div>
            <div>
              <label class="label" for="i-note">Extra note <span class="text-muted">(optional)</span></label>
              <input id="i-note" class="input" maxlength="80" placeholder="e.g. Lunch follows · Reception at 7 PM" [value]="f().note" (input)="set('note', $event)" />
            </div>
            <div>
              <label class="label" for="i-bless">Blessing line on top</label>
              <input id="i-bless" class="input" maxlength="60" placeholder="Leave empty for none" [value]="bless()" (input)="setWording('bless', $event)" />
            </div>
            <div>
              <label class="label" for="i-title">Heading</label>
              <input id="i-title" class="input" maxlength="50" [value]="title()" (input)="setWording('title', $event)" />
            </div>
            <div>
              <label class="label" for="i-line">Invitation line</label>
              <textarea id="i-line" class="input min-h-20" maxlength="160" [value]="line()" (input)="setWording('line', $event)"></textarea>
            </div>
            @if (edited()) {
              <button type="button" class="btn-ghost min-h-9 text-sm" (click)="resetWording()"><svg lucideIcon="rotate-ccw" [size]="14" /> Use suggested wording</button>
            }
          </div>
        </details>
        <button type="button" class="btn-ghost min-h-10 w-full text-sm md:hidden" (click)="toPreview()">👁 See my card</button>
      </div>

      <div class="md:sticky md:top-20 md:self-start" #pv>
        <p class="label">Preview</p>
        <canvas #cv [width]="w" [height]="h" class="aspect-[3/4] w-full max-w-[440px] rounded-2xl border border-line shadow-lg" role="img" [attr.aria-label]="title() + ' invitation preview'"></canvas>
        @if (sampleShown()) { <p class="mt-2 text-xs text-muted">Faded names are samples — type yours on the left.</p> }
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="btn-primary min-h-11" (click)="share()"><svg lucideIcon="share-2" [size]="16" /> Share on WhatsApp</button>
          <button type="button" class="btn-ghost min-h-11" (click)="download()"><svg lucideIcon="download" [size]="16" /> Image</button>
          <button type="button" class="btn-ghost min-h-11" (click)="pdf()"><svg lucideIcon="file-text" [size]="16" /> PDF to print</button>
          <button type="button" class="btn-ghost min-h-11" (click)="copyText()"><svg lucideIcon="copy" [size]="16" /> Copy message</button>
        </div>
        <button type="button" class="mt-2 text-xs text-muted underline" (click)="startNew()">Start a new card</button>
      </div>
    </div>
  `,
})
export class InviteTool {
  private readonly toast = inject(ToastService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly cv = viewChild<ElementRef<HTMLCanvasElement>>('cv');
  private readonly pv = viewChild<ElementRef<HTMLElement>>('pv');
  protected readonly w = W;
  protected readonly h = H;
  protected readonly events = EVENTS;
  protected readonly themes = THEMES;
  protected readonly langs = LANG_CHIPS;
  protected readonly f = signal<Form>(blank());
  protected readonly photo = signal<ImageBitmap | null>(null);
  protected readonly crop = signal<Crop>(NO_CROP);
  protected readonly cropping = signal(false);
  protected readonly moreOpen = signal(false);
  private readonly qr = signal<{ size: number; get: (r: number, c: number) => boolean } | null>(null);
  private readonly ready = signal(false);

  protected readonly ev = computed(() => EVENTS.find((e) => e.id === this.f().ev) ?? EVENTS[0]);
  private readonly words = computed(() => this.ev()[this.f().lang]);
  protected readonly title = computed(() => {
    const f = this.f();
    if (f.title !== null) return f.title;
    const n = +f.age;
    if (f.ev === 'birthday' && n >= 1 && n <= 120) return { te: `${ordinal(n, 'te')} పుట్టినరోజు వేడుక`, en: `${ordinal(n, 'en')} Birthday Party`, hi: `${ordinal(n, 'hi')} जन्मदिन समारोह` }[f.lang];
    return this.words().title;
  });
  protected readonly line = computed(() => this.f().line ?? this.words().line);
  protected readonly bless = computed(() => this.f().bless ?? this.words().bless);
  protected readonly edited = computed(() => this.f().title !== null || this.f().line !== null || this.f().bless !== null);
  protected readonly mapOk = computed(() => validMap(this.f().map.trim()));
  protected readonly sampleShown = computed(() => {
    const f = this.f();
    return this.ev().couple ? !f.groom.trim() || !f.bride.trim() : !f.name.trim();
  });

  constructor() {
    afterNextRender(() => {
      const l = phoneLang();
      let draft: Form = blank(l === 'hi' ? 'hi' : 'te');
      try {
        const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Partial<Form> | null;
        if (saved && EVENTS.some((e) => e.id === saved.ev)) draft = { ...draft, ...saved };
      } catch {}
      this.f.set(draft);
      if (draft.map || draft.note) this.moreOpen.set(true);
      document.fonts?.ready.then(() => this.ready.set(true));
      this.ready.set(true);
    });
    // Keep the draft (not the photo) so a refresh or coming back later loses nothing
    effect(() => {
      const f = this.f();
      if (!this.ready()) return;
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
      } catch {}
    });
    // Location QR, made only when a valid link is pasted
    effect(() => {
      const u = this.f().map.trim();
      if (!this.browser || !validMap(u)) return this.qr.set(null);
      import('qrcode')
        .then((m) => {
          const q = ((m as unknown as { default?: typeof m }).default ?? m).create(u, { errorCorrectionLevel: 'M' });
          if (this.f().map.trim() === u) this.qr.set({ size: q.modules.size, get: (r, c) => !!q.modules.get(r, c) });
        })
        .catch(() => this.qr.set(null));
    });
    effect(() => {
      const c = this.cv()?.nativeElement;
      if (!this.browser || !c || !this.ready()) return;
      this.draw(c, this.f(), this.photo(), this.crop(), this.qr());
    });
  }

  protected swatch(t: Theme) {
    return `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]})`;
  }

  protected patch<K extends keyof Form>(k: K, v: Form[K]) {
    this.f.update((f) => ({ ...f, [k]: v }));
  }

  /** Typing rule: no leading or double spaces. */
  protected set(k: TextKey, e: Event) {
    const el = e.target as HTMLInputElement;
    const v = el.value.replace(/^\s+/, '').replace(/ {2,}/g, ' ');
    if (v !== el.value) el.value = v;
    this.patch(k, v);
  }

  protected setAge(e: Event) {
    const el = e.target as HTMLInputElement;
    const v = el.value.replace(/\D/g, '').slice(0, 3);
    if (v !== el.value) el.value = v;
    this.patch('age', v);
  }

  protected setWording(k: 'title' | 'line' | 'bless', e: Event) {
    this.patch(k, (e.target as HTMLInputElement).value.replace(/^\s+/, ''));
  }

  protected resetWording() {
    this.f.update((f) => ({ ...f, title: null, line: null, bless: null }));
  }

  /** New function or language → suggested wording and that function's usual design. */
  protected setEvent(id: EvId) {
    const e = EVENTS.find((x) => x.id === id)!;
    this.f.update((f) => ({ ...f, ev: id, theme: e.theme, title: null, line: null, bless: null }));
  }

  protected setLang(l: Lang) {
    this.f.update((f) => ({ ...f, lang: l, title: null, line: null, bless: null }));
  }

  protected toPreview() {
    this.pv()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected startNew() {
    const f = this.f();
    this.f.set({ ...blank(f.lang), ev: f.ev, theme: this.ev().theme });
    this.photo.set(null);
    this.crop.set(NO_CROP);
    this.toast.show('Cleared — start your new card.', 'success', 2000);
  }

  protected async pick(e: Event) {
    const el = e.target as HTMLInputElement, file = el.files?.[0];
    el.value = '';
    if (!file) return;
    try {
      this.photo.set(await createImageBitmap(file));
      this.crop.set(NO_CROP);
      this.cropping.set(true);
    } catch {
      this.toast.show('Couldn’t open that photo. Try a JPG or PNG.', 'error', 2500);
    }
  }

  // ---------- drawing ----------

  private draw(c: HTMLCanvasElement, f: Form, photo: ImageBitmap | null, crop: Crop, qr: { size: number; get: (r: number, c: number) => boolean } | null) {
    const g = c.getContext('2d')!;
    const th = THEMES.find((t) => t.id === f.theme) ?? THEMES[0];
    const ev = this.ev();
    const L = LABEL[f.lang];
    const font = FONT[f.lang];
    const nameFont = f.lang === 'en' ? SERIF : font;
    this.background(g, th);

    const b: Block[] = [];
    const text = (t: string, size: number, weight: string, color: string, gap: number, max = 2, fnt = font, alpha?: number) => t && b.push({ k: 'text', text: t, size, weight, color, font: fnt, gap, max, alpha });
    text(this.bless().trim(), 30, '600', th.accent, 0, 1);
    text(this.title().trim(), 74, '800', th.ink, 18, 2, f.lang === 'en' ? SERIF : font);
    b.push({ k: 'div', gap: 22 });
    text(this.line().trim(), 34, '500', th.soft, 22, 3);
    if (photo) b.push({ k: 'photo', r: 135, gap: 30 });

    if (ev.couple) {
      const [sg, sb] = SAMPLE_COUPLE[f.lang];
      const groom = { n: f.groom.trim() || sg, p: childOf(f.groomP.trim(), true, f.lang), sample: !f.groom.trim() };
      const bride = { n: f.bride.trim() || sb, p: childOf(f.brideP.trim(), false, f.lang), sample: !f.bride.trim() };
      const [a, z] = f.brideFirst ? [bride, groom] : [groom, bride];
      text(a.n, 92, '700', th.ink, 30, 1, nameFont, a.sample ? 0.45 : 1);
      text(a.p, 28, '500', th.soft, 6, 2);
      text(f.ev === 'engagement' ? L.and : L.weds, 44, 'italic 600', th.accent, 14, 1, f.lang === 'en' ? SERIF : font);
      text(z.n, 92, '700', th.ink, 14, 1, nameFont, z.sample ? 0.45 : 1);
      text(z.p, 28, '500', th.soft, 6, 2);
    } else {
      const n = f.name.trim();
      text(n || ev.sample![f.lang], 84, '700', th.ink, 30, 2, nameFont, n ? 1 : 0.45);
      text(f.sub.trim(), 30, '500', th.soft, 8, 2);
    }

    b.push({ k: 'div', gap: 30 });
    text(niceDate(f.date, f.lang), 42, '700', th.accent, 24, 2);
    const t = niceTime(f.time, f.lang);
    if (t) text(`${ev.muhurtham ? L.muhurtham : L.time}: ${t}`, 34, '600', th.ink, 10, 1);
    if (f.venue.trim() || f.addr.trim()) {
      text(L.venue, 26, '700', th.accent, 26, 1);
      text(f.venue.trim(), 40, '700', th.ink, 6, 2);
      text(f.addr.trim(), 30, '500', th.soft, 6, 2);
    }
    text(f.note.trim(), 30, '600', th.ink, 18, 2);
    if (qr) b.push({ k: 'qr', size: 150, gap: 22, caption: L.scan, font });
    if (f.host.trim()) {
      text(L.host, 26, '600', th.accent, 26, 1);
      text(f.host.trim(), 34, '700', th.ink, 4, 2);
    }

    // Fit everything between the frame's top and bottom, shrinking a little when the card is full
    const top = 120, bottom = H - 130, avail = bottom - top;
    let placed: Placed[] = [], total = 0;
    for (let i = 0; i <= 10; i++) {
      const s = 1 - i * 0.04;
      placed = b.map((x) => ({ ...this.measure(g, x, s), gap: x.gap * s }));
      total = placed.reduce((a, x, j) => a + x.h + (j ? x.gap : 0), 0);
      if (total <= avail) break;
    }
    let y = top + Math.max(0, (avail - total) / 2);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    placed.forEach((x, i) => {
      if (i) y += x.gap;
      this.paint(g, x, y, th, photo, crop, qr);
      y += x.h;
    });

    g.globalAlpha = 0.65;
    g.fillStyle = th.ink;
    g.font = `500 22px ${EN_FONT}`;
    g.fillText('Made free at tools.spreadapps.in', W / 2, H - 82);
    g.globalAlpha = 1;
  }

  private measure(g: CanvasRenderingContext2D, b: Block, s: number): Placed {
    if (b.k === 'div') return { ...b, h: 24 * s };
    if (b.k === 'photo') return { ...b, r: b.r * s, h: b.r * s * 2 + 12 };
    if (b.k === 'qr') return { ...b, size: b.size * s, h: b.size * s + 24 + 40 * s };
    const indic = /[ऀ-෿]/.test(b.text);
    const max = W - 260;
    let size = b.size * s, lines: string[] = [];
    for (const floor = size * 0.7; size >= floor; size -= 2) {
      g.font = `${b.weight} ${size}px ${b.font}`;
      lines = [];
      let cur = '';
      for (const w of b.text.split(' ')) {
        const t = cur ? cur + ' ' + w : w;
        if (g.measureText(t).width > max && cur) (lines.push(cur), (cur = w));
        else cur = t;
      }
      if (cur) lines.push(cur);
      if (lines.length <= b.max) break;
    }
    const lh = size * (indic ? 1.5 : 1.28);
    return { ...b, s: size, lh, lines, h: lines.length * lh };
  }

  private paint(g: CanvasRenderingContext2D, b: Placed, y: number, th: Theme, photo: ImageBitmap | null, crop: Crop, qr: { size: number; get: (r: number, c: number) => boolean } | null) {
    const cx = W / 2;
    if (b.k === 'text') {
      g.font = `${b.weight} ${b.s}px ${b.font}`;
      g.fillStyle = b.color;
      g.globalAlpha = b.alpha ?? 1;
      b.lines!.forEach((l, i) => g.fillText(l, cx, y + b.lh! * (i + 0.5), W - 240));
      g.globalAlpha = 1;
    } else if (b.k === 'div') {
      const my = y + b.h / 2;
      g.strokeStyle = th.accent;
      g.fillStyle = th.accent;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx - 170, my);
      g.lineTo(cx - 22, my);
      g.moveTo(cx + 22, my);
      g.lineTo(cx + 170, my);
      g.stroke();
      g.beginPath();
      g.moveTo(cx, my - 10);
      g.lineTo(cx + 10, my);
      g.lineTo(cx, my + 10);
      g.lineTo(cx - 10, my);
      g.closePath();
      g.fill();
    } else if (b.k === 'photo' && photo) {
      const r = b.r, cy = y + r + 6;
      g.save();
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.clip();
      drawCropped(g, photo, crop, cx, cy, r);
      g.restore();
      g.strokeStyle = th.accent;
      g.lineWidth = 8;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, r + 12, 0, Math.PI * 2);
      g.stroke();
    } else if (b.k === 'qr' && qr) {
      const s = b.size, pad = 12, x0 = cx - s / 2 - pad, cell = s / qr.size;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.roundRect(x0, y, s + pad * 2, s + pad * 2, 14);
      g.fill();
      g.fillStyle = '#111111';
      for (let r = 0; r < qr.size; r++) for (let c = 0; c < qr.size; c++) if (qr.get(r, c)) g.fillRect(x0 + pad + c * cell, y + pad + r * cell, Math.ceil(cell), Math.ceil(cell));
      g.fillStyle = th.soft;
      g.font = `600 ${Math.round(b.size * 0.16)}px ${b.font}`;
      g.fillText(b.caption, cx, y + s + pad * 2 + (b.h - s - pad * 2) / 2);
    }
  }

  /** Gradient, soft mandala, double gold frame and corner flourishes. */
  private background(g: CanvasRenderingContext2D, th: Theme) {
    const grad = g.createLinearGradient(0, 0, W * 0.35, H);
    grad.addColorStop(0, th.bg[0]);
    grad.addColorStop(1, th.bg[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    const mandala = (cx: number, cy: number, R: number, alpha: number) => {
      g.save();
      g.globalAlpha = alpha;
      g.strokeStyle = th.accent;
      g.lineWidth = 2;
      for (const [n, r, len] of [[32, R, R * 0.22], [20, R * 0.68, R * 0.2], [12, R * 0.4, R * 0.18]] as const) {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          g.beginPath();
          g.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, len, len * 0.36, a, 0, Math.PI * 2);
          g.stroke();
        }
        g.beginPath();
        g.arc(cx, cy, r - len, 0, Math.PI * 2);
        g.stroke();
      }
      g.restore();
    };
    mandala(W / 2, 0, 340, 0.13);
    mandala(W / 2, H, 300, 0.1);

    g.strokeStyle = th.accent;
    g.lineWidth = 8;
    g.strokeRect(30, 30, W - 60, H - 60);
    g.lineWidth = 2;
    g.strokeRect(52, 52, W - 104, H - 104);
    // corner flourishes
    g.fillStyle = th.accent;
    for (const [x, y, sx, sy] of [[52, 52, 1, 1], [W - 52, 52, -1, 1], [52, H - 52, 1, -1], [W - 52, H - 52, -1, -1]] as const) {
      g.save();
      g.translate(x, y);
      g.scale(sx, sy);
      g.lineWidth = 3;
      for (const r of [34, 56]) {
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI / 2);
        g.stroke();
      }
      g.beginPath();
      g.arc(20, 20, 6, 0, Math.PI * 2);
      g.fill();
      for (const [dx, dy] of [[70, 8], [8, 70]]) {
        g.beginPath();
        g.arc(dx, dy, 4, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
  }

  // ---------- output ----------

  /** Warn before sharing a card that still shows sample names. */
  private checkNames(): boolean {
    if (!this.sampleShown()) return true;
    this.toast.show(this.ev().couple ? 'Type the bride’s and groom’s names first.' : 'Type the name for the card first.', 'error', 2500);
    document.getElementById(this.ev().couple ? (this.f().groom.trim() ? 'i-bride' : 'i-groom') : 'i-name')?.focus();
    return false;
  }

  private fileName(ext: string) {
    return `${this.f().ev}-invitation.${ext}`;
  }

  private blob(): Promise<Blob | null> {
    const c = this.cv()?.nativeElement;
    return new Promise((res) => (c ? c.toBlob((b) => res(b), 'image/png') : res(null)));
  }

  /** WhatsApp message to go with the card — the map link is tappable there. */
  private message(): string {
    const f = this.f();
    const names = this.ev().couple ? (f.brideFirst ? [f.bride, f.groom] : [f.groom, f.bride]).map((x) => x.trim()).join(f.ev === 'engagement' ? ' & ' : ` ${LABEL[f.lang].weds} `) : f.name.trim();
    const when = [niceDate(f.date, f.lang), niceTime(f.time, f.lang)].filter(Boolean).join(', ');
    const where = [f.venue.trim(), f.addr.trim()].filter(Boolean).join(', ');
    const lines = [
      `${this.ev().emoji} ${this.title().trim()}`,
      names && `*${names}*`,
      when && `🗓️ ${when}`,
      where && `📍 ${where}`,
      this.mapOk() ? f.map.trim() : '',
      f.note.trim(),
      f.host.trim() && `${LABEL[f.lang].host} ${f.host.trim()}`,
    ].filter(Boolean);
    return [...lines, '', `Make your invitation free: ${PAGE}`].join('\n');
  }

  protected async download() {
    if (!this.checkNames()) return;
    const b = await this.blob();
    if (!b) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = this.fileName('png');
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  protected async share() {
    if (!this.checkNames()) return;
    const b = await this.blob();
    if (!b) return;
    const file = new File([b], this.fileName('png'), { type: 'image/png' });
    const text = this.message();
    try {
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text });
    } catch {
      return; // share sheet closed
    }
    await this.download();
    this.toast.show('Card saved — open WhatsApp and attach it from your gallery.', 'success', 3500);
  }

  protected async copyText() {
    if (!this.checkNames()) return;
    try {
      await navigator.clipboard.writeText(this.message());
      this.toast.show('Message copied — paste it in WhatsApp with the card.', 'success', 2500);
    } catch {
      this.toast.show('Couldn’t copy on this browser.', 'error', 2500);
    }
  }

  /** A5 page (148 × 210 mm) with the card centred — ready for a print shop. */
  protected async pdf() {
    if (!this.checkNames()) return;
    const b = await this.blob();
    if (!b) return;
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const pw = 419.53, ph = 595.28; // A5 in points
      const page = doc.addPage([pw, ph]);
      const img = await doc.embedPng(await b.arrayBuffer());
      const sc = Math.min(pw / W, ph / H);
      page.drawImage(img, { x: (pw - W * sc) / 2, y: (ph - H * sc) / 2, width: W * sc, height: H * sc });
      doc.setTitle(this.title().trim());
      const bytes = await doc.save();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      a.download = this.fileName('pdf');
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch {
      this.toast.show('Couldn’t make the PDF. Use Image instead.', 'error', 2500);
    }
  }
}
