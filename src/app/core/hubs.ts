import { CALC_LINKS } from './calc-links';
import { KB_PRESETS, kbPath } from './exams';
import { Faq } from './seo.service';
import { TOOL_LINKS, ToolGroupName } from './tool-links';

/** One category page per group (e.g. /health-calculators) — breadcrumbs and the home page link here. */
export interface HubItem {
  name: string;
  path: string;
  blurb: string;
  icon: string;
}

export interface Hub {
  id: string;
  path: string;
  /** Group name as used in breadcrumbs / home sections */
  name: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  items: HubItem[];
  faqs: Faq[];
}

const CALC_BLURB: Record<string, string> = {
  emi: 'Monthly EMI, interest, yearly schedule',
  'home-loan-emi': 'Home loan EMI up to 30 years',
  'car-loan-emi': 'Compare car loan offers',
  'personal-loan-emi': 'See the real cost of a personal loan',
  sip: 'Mutual fund SIP with yearly step-up',
  lumpsum: 'One-time investment growth',
  fd: 'Fixed deposit maturity & interest',
  ppf: 'Current 7.1% rate, 15+ years',
  'income-tax': 'FY 2026-27 old vs new regime',
  gst: 'Add or remove GST, CGST/SGST/IGST',
  hra: 'Tax-free HRA, new 8 metro cities',
  salary: 'CTC to monthly take-home',
};

const fromGroup = (g: ToolGroupName): HubItem[] => TOOL_LINKS.filter((t) => t.group === g).map((t) => ({ name: t.name, path: t.path, blurb: t.blurb, icon: t.icon }));

export const HUBS: Hub[] = [
  {
    id: 'exam',
    path: 'exam-photo-signature-resize',
    name: 'Exam photos',
    h1: 'Exam Photo & Signature Resizer',
    title: 'Exam Photo & Signature Resizer — SSC, UPSC, IBPS, RRB, TSPSC, NEET',
    description: 'Resize photo and signature to the exact KB and pixel size for SSC, UPSC, IBPS, SBI, RRB, TSPSC, APPSC, NEET and JEE forms. Free, on your phone, no upload.',
    intro:
      'Pick your exam and document. Each page already knows the exact size in pixels and KB, so your photo or signature is accepted the first time. Everything happens on your phone — nothing is uploaded.',
    items: [], // exams are shown as cards with document chips
    faqs: [
      { q: 'Which exams are supported?', a: 'SSC, UPSC, IBPS, SBI, RRB, TSPSC (TGPSC), APPSC, NEET and JEE Main — photo and signature, plus thumb and declaration where the form asks for them.' },
      { q: 'My exam isn’t listed. What can I use?', a: 'Use “Resize image to KB” and type the size from your notification, or open any exam page and tap “Change size”.' },
    ],
  },
  {
    id: 'image',
    path: 'image-tools',
    name: 'Image tools',
    h1: 'Free Image Tools',
    title: 'Image Tools — Resize Image to KB, Compress Photo Online',
    description: 'Resize or compress any photo to an exact size in KB — 10 KB, 20 KB, 50 KB, 100 KB and more. Works on mobile, nothing is uploaded.',
    intro: 'Make any photo small enough for forms, portals and email. Choose a ready size or type your own.',
    items: [
      { name: 'Resize image to KB', path: 'resize-image-to-kb', blurb: 'Any size you need', icon: 'image-up' },
      ...KB_PRESETS.map((k) => ({ name: `Resize image to ${k} KB`, path: kbPath(k), blurb: k <= 30 ? 'Signatures & small photos' : k <= 100 ? 'Exam & ID photos' : 'Documents & scans', icon: 'file-image' })),
      { name: 'JPG to PDF', path: 'jpg-to-pdf', blurb: 'Photos into one PDF', icon: 'file-image' },
    ],
    faqs: [{ q: 'Will my photo lose quality?', a: 'The tool picks the highest quality that fits your size limit and only shrinks the dimensions if it must, then shows the final size before you download.' }],
  },
  {
    id: 'money',
    path: 'money-calculators',
    name: 'Calculators',
    h1: 'Money Calculators for India',
    title: 'Money Calculators India — EMI, SIP, FD, PPF, Income Tax, GST',
    description: 'Free Indian finance calculators: EMI, SIP, lumpsum, FD, PPF, income tax old vs new (FY 2026-27), GST, HRA and in-hand salary. Instant and private.',
    intro: 'Plan loans, savings and taxes with calculators made for Indian rules and rates — updated for FY 2026-27.',
    items: CALC_LINKS.map((c) => ({ name: c.name, path: c.path, blurb: CALC_BLURB[c.id] ?? '', icon: c.kind === 'tax' || c.kind === 'gst' ? 'receipt' : 'calculator' })),
    faqs: [
      { q: 'Are these calculators accurate?', a: 'They use standard formulas and the latest rates we checked (income tax FY 2026-27, PPF 7.1%, GST 2.0). They are estimates, not financial or tax advice.' },
      { q: 'Is my data saved?', a: 'No. Calculations run in your browser and your numbers are never sent anywhere.' },
    ],
  },
  {
    id: 'pdf',
    path: 'pdf-tools',
    name: 'PDF tools',
    h1: 'Free PDF Tools',
    title: 'PDF Tools Online Free — Merge, Split, Compress, JPG to PDF',
    description: 'Merge, split and compress PDFs, convert JPG to PDF and PDF to JPG — free, on your device. Safe for Aadhaar, certificates and bank statements.',
    intro: 'Everyday PDF jobs without uploading your documents anywhere — safe for certificates, Aadhaar and bank statements.',
    items: fromGroup('PDF tools'),
    faqs: [{ q: 'Are my PDFs uploaded?', a: 'No. Every PDF tool runs inside your browser, so your files never leave your phone or computer.' }],
  },
  {
    id: 'business',
    path: 'business-tools',
    name: 'Business tools',
    h1: 'Free Business Tools',
    title: 'Free Business Tools — UPI QR Code Generator, GST Invoice Maker',
    description: 'Free tools for shops and small businesses in India: UPI payment QR with printable poster and a GST tax invoice maker with PDF. No signup.',
    intro: 'Simple tools for shops, freelancers and small businesses — no signup, no fees.',
    items: fromGroup('Business tools'),
    faqs: [{ q: 'Do you take any commission?', a: 'No. The UPI QR sends money straight to your bank account, and invoices are made on your device. We never see your money or data.' }],
  },
  {
    id: 'health',
    path: 'health-calculators',
    name: 'Health calculators',
    h1: 'Health Calculators',
    title: 'Health Calculators India — BMI, Calories, Ideal Weight, Due Date',
    description: 'BMI with Indian (Asian) ranges, daily calories (BMR), ideal weight for your height and pregnancy due date — free and private.',
    intro: 'Quick health estimates made for Indians — BMI uses the lower Asian cut-offs doctors recommend. Not medical advice.',
    items: fromGroup('Health calculators'),
    faqs: [{ q: 'Are these medical advice?', a: 'No. They are estimates to help you understand your numbers. Please talk to a doctor before changing your diet, exercise or treatment.' }],
  },
  {
    id: 'converters',
    path: 'unit-converters',
    name: 'Converters',
    h1: 'Unit & Land Converters',
    title: 'Unit Converters — Land (Acre, Gunta, Cent), Length, Weight, Lakh–Crore',
    description: 'Free converters for India: land units for Telangana & AP (acre, gunta, cent, ankanam, sq yards), km to miles, kg to pounds, tola, °C to °F, lakh to million, dozen.',
    intro: 'Everyday conversions in one place — including land measures used in Hyderabad, Telangana and Andhra Pradesh.',
    items: fromGroup('Converters'),
    faqs: [{ q: 'How accurate are these conversions?', a: 'They use exact standard definitions (for example 1 inch = 2.54 cm, 1 acre = 43,560 sq ft). For land, always confirm the area in your registration documents.' }],
  },
  {
    id: 'language',
    path: 'language-tools',
    name: 'Language tools',
    h1: 'Language Tools',
    title: 'Language Tools — Telugu Typing Online',
    description: 'Type Telugu with English letters and copy it to WhatsApp, documents or social media. Free, works offline. More languages coming.',
    intro: 'Write in Telugu with an English keyboard. Hindi typing is planned next.',
    items: fromGroup('Language tools'),
    faqs: [{ q: 'Do I need to install a keyboard?', a: 'No. Type in English letters on this page and copy the Telugu text anywhere.' }],
  },
];

export function hubByName(name: string): Hub | undefined {
  return HUBS.find((h) => h.name === name);
}
