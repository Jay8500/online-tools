import { CALC_LINKS } from './calc-links';
import { DOC_LABEL, EXAMS, examPath } from './exams';

/** Catalogue shown on the home page + footer. `path` null = coming soon (stays honest about what exists). */
export interface ToolLink {
  name: string;
  path: string | null;
  icon: string;
  blurb: string;
}

export interface ToolGroup {
  title: string;
  tools: ToolLink[];
}

export const EXAM_TOOL_LINKS: ToolLink[] = EXAMS.flatMap((e) =>
  e.docs
    .filter((d) => d.kind === 'photo' || d.kind === 'signature')
    .map((d) => ({
      name: `${e.name} ${DOC_LABEL[d.kind].toLowerCase()} resize`,
      path: examPath(e, d.kind),
      icon: d.kind === 'photo' ? 'scan-face' : 'pen-line',
      blurb: `${d.width}×${d.height} px, ${d.minKb}–${d.maxKb} KB`,
    })),
);

const CALC_BLURB: Record<string, string> = {
  emi: 'Home, car & personal loans',
  sip: 'Mutual fund SIP with step-up',
  lumpsum: 'One-time investment growth',
  fd: 'Fixed deposit maturity',
  ppf: 'Latest 7.1% rate, 15+ years',
  'income-tax': 'FY 2026-27, which regime saves more',
  gst: 'Add/remove GST, CGST/SGST',
  hra: 'Exempt HRA, new 8 metro cities',
  salary: 'CTC to monthly take-home',
};

export const TOOL_GROUPS: ToolGroup[] = [
  {
    title: 'Image tools',
    tools: [
      { name: 'Resize image to KB', path: 'resize-image-to-kb', icon: 'image-up', blurb: 'Any photo to an exact KB size' },
      { name: 'Resize image to 20 KB', path: 'resize-image-to-20kb', icon: 'file-image', blurb: 'Common exam form limit' },
      { name: 'Resize image to 50 KB', path: 'resize-image-to-50kb', icon: 'file-image', blurb: 'Bank & SSC forms' },
      { name: 'Resize image to 100 KB', path: 'resize-image-to-100kb', icon: 'file-image', blurb: 'Documents & ID uploads' },
    ],
  },
  {
    title: 'Money calculators',
    tools: CALC_LINKS.filter((c) => !/-loan-emi$/.test(c.id)).map((c) => ({
      name: c.name,
      path: c.path,
      icon: c.kind === 'tax' || c.kind === 'gst' ? 'receipt' : 'calculator',
      blurb: CALC_BLURB[c.id] ?? '',
    })),
  },
  {
    title: 'Coming soon',
    tools: [
      { name: 'PDF merge, split & compress', path: null, icon: 'file-stack', blurb: 'On your device' },
      { name: 'UPI QR code generator', path: null, icon: 'qr-code', blurb: 'For shops & payments' },
      { name: 'GST invoice maker', path: null, icon: 'file-text', blurb: 'Print-ready invoices' },
      { name: 'BMI & health calculators', path: null, icon: 'heart-pulse', blurb: 'Quick estimates' },
      { name: 'Telugu typing', path: null, icon: 'languages', blurb: 'Type in Telugu easily' },
    ],
  },
];
