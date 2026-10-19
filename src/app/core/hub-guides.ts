import { DOC_LABEL, EXAMS } from './exams';
import { PPF_RATE, TAX_YEAR } from './finance';
import { TELUGU_HELP } from './telugu';

/** Extra content that makes each category page worth opening (not just a copy of the home page). */
export interface GuideBlock {
  h: string;
  p?: string;
  list?: string[];
  table?: { head: string[]; rows: string[][] };
}

const size = (w: number, h: number, min: number, max: number) => `${w}×${h} px · ${min}–${max} KB`;

export const HUB_GUIDES: Record<string, GuideBlock[]> = {
  exam: [
    {
      h: 'Photo & signature sizes at a glance',
      p: 'Tap an exam above to resize to these exact sizes. Always check the official notification — rules can change between recruitments.',
      table: {
        head: ['Exam', 'Photo', 'Signature'],
        rows: EXAMS.map((e) => {
          const p = e.docs.find((d) => d.kind === 'photo')!;
          const s = e.docs.find((d) => d.kind === 'signature')!;
          return [e.name, size(p.width, p.height, p.minKb, p.maxKb), size(s.width, s.height, s.minKb, s.maxKb)];
        }),
      },
    },
    {
      h: 'Extra documents some exams ask for',
      list: EXAMS.flatMap((e) => e.docs.filter((d) => d.kind !== 'photo' && d.kind !== 'signature').map((d) => `${e.name} — ${DOC_LABEL[d.kind]}: ${size(d.width, d.height, d.minKb, d.maxKb)}`)),
    },
    {
      h: 'Why photos get rejected',
      list: [
        'File is above the maximum KB, or below the minimum KB.',
        'Wrong pixel size or a stretched face.',
        'Dark, patterned or coloured background (use “White background”).',
        'Cap, sunglasses, or a selfie taken at an angle.',
        'Blurred photo, or a photo of a printed photo.',
        'Signature in CAPITAL letters, or signed on lined/coloured paper.',
      ],
    },
  ],
  image: [
    {
      h: 'Which size do I need?',
      table: {
        head: ['Typical limit', 'Usually for'],
        rows: [
          ['10–20 KB', 'Signatures, thumb impressions'],
          ['20–50 KB', 'Exam and job photos (SSC, IBPS, SBI, TSPSC, APPSC)'],
          ['50–100 KB', 'Declarations, ID photos'],
          ['100–200 KB', 'NEET / JEE photos, small documents'],
          ['200–500 KB', 'Scanned certificates and documents'],
        ],
      },
    },
    {
      h: 'Tips for the smallest file that still looks good',
      list: ['Crop away empty space first — fewer pixels means a smaller file.', 'Use JPG for photos; PNG files are much larger.', 'For documents, convert to PDF and use Compress PDF instead.'],
    },
  ],
  money: [
    {
      h: `Income tax slabs, new regime (${TAX_YEAR})`,
      p: 'Budget 2026 kept these unchanged. 4% health & education cess is added to the tax.',
      table: {
        head: ['Taxable income', 'Rate'],
        rows: [
          ['Up to ₹4 lakh', 'Nil'],
          ['₹4–8 lakh', '5%'],
          ['₹8–12 lakh', '10%'],
          ['₹12–16 lakh', '15%'],
          ['₹16–20 lakh', '20%'],
          ['₹20–24 lakh', '25%'],
          ['Above ₹24 lakh', '30%'],
        ],
      },
    },
    {
      h: 'Key numbers we use',
      list: [
        'New regime: no tax up to ₹12 lakh taxable income (87A rebate) — about ₹12.75 lakh salary with the ₹75,000 standard deduction.',
        'Old regime: standard deduction ₹50,000; 80C up to ₹1.5 lakh; rebate up to ₹5 lakh income.',
        `PPF interest: ${PPF_RATE}% (October–December 2026).`,
        'GST: 5%, 18% and 40% (GST 2.0, from 22 September 2025); 3% on gold.',
        'HRA: 50% of basic for 8 metro cities from FY 2026-27, including Hyderabad.',
      ],
    },
    {
      h: 'Which calculator do I need?',
      list: ['Taking a loan → EMI (or home / car / personal loan EMI).', 'Investing monthly → SIP; one-time → Lumpsum; safe savings → FD or PPF.', 'Choosing a tax regime → Income tax; got an offer letter → In-hand salary.', 'Billing a customer → GST calculator or the GST invoice maker.'],
    },
  ],
  pdf: [
    {
      h: 'Which PDF tool do I need?',
      table: {
        head: ['I want to…', 'Use'],
        rows: [
          ['Put several certificates into one file', 'Merge PDF'],
          ['Send only pages 2–4', 'Split PDF → Keep pages'],
          ['Upload to a portal with a 200 KB / 1 MB limit', 'Compress PDF'],
          ['Turn phone photos of documents into a PDF', 'JPG to PDF'],
          ['Upload a PDF page where only JPG is allowed', 'PDF to JPG'],
        ],
      },
    },
    { h: 'Safe for private documents', p: 'Every PDF tool runs inside your browser. Aadhaar, PAN, bank statements and mark sheets never leave your phone or computer.' },
  ],
  business: [
    {
      h: 'What a GST tax invoice must show',
      list: [
        'Your name, address and GSTIN.',
        'A unique invoice number (up to 16 characters, one series per financial year) and the date.',
        'Customer name and address, and their GSTIN if registered.',
        'Place of supply (state) — decides CGST + SGST or IGST.',
        'Description, HSN/SAC code, quantity and taxable value of each item.',
        'GST rate and amount (CGST, SGST or IGST) and the total.',
        'Signature of the supplier or authorised person.',
      ],
    },
    {
      h: 'UPI QR: personal vs merchant',
      list: ['A personal UPI QR (made here) is fine for small shops, tutors and freelancers.', 'A merchant QR from your bank or UPI app adds sound-box alerts, settlement reports and business limits.', 'Always test a new QR with ₹1 before printing it.'],
    },
  ],
  health: [
    {
      h: 'BMI chart for Indians',
      p: 'India uses lower BMI cut-offs than the WHO because health risks start at a lower BMI for South Asians.',
      table: {
        head: ['Category', 'Indian (Asian) BMI', 'WHO international'],
        rows: [
          ['Underweight', 'Below 18.5', 'Below 18.5'],
          ['Normal', '18.5 – 22.9', '18.5 – 24.9'],
          ['Overweight', '23 – 24.9', '25 – 29.9'],
          ['Obese', '25 and above', '30 and above'],
        ],
      },
    },
    { h: 'Waist size matters too', p: 'A waist above about 90 cm for men or 80 cm for women is a warning sign even with a normal BMI. Talk to a doctor for advice that fits you.' },
  ],
  converters: [
    {
      h: 'Land units used in Telangana & Andhra Pradesh',
      table: {
        head: ['Unit', 'Square feet', 'Square yards', 'Per acre'],
        rows: [
          ['Acre', '43,560', '4,840', '1'],
          ['Gunta / Kunta', '1,089', '121', '40'],
          ['Cent', '435.6', '48.4', '100'],
          ['Ankanam', '72', '8', '605'],
          ['Square yard (gajam)', '9', '1', '4,840'],
          ['Hectare', '1,07,639', '11,960', '0.4047'],
        ],
      },
    },
    {
      h: 'Handy everyday numbers',
      list: ['1 km = 1,000 m = 0.621 miles', '1 tola = 11.66 g · 1 sovereign = 8 g', '37 °C = 98.6 °F', '1 dozen = 12 · 1 gross = 144', '1 lakh = 1,00,000 · 1 crore = 100 lakh = 10 million', '1 MB = 1,024 KB'],
    },
  ],
  daily: [
    {
      h: 'Gold purity and hallmark numbers',
      table: {
        head: ['Karat', 'Purity', 'Hallmark grade'],
        rows: [
          ['24K', '99.9%', '999'],
          ['22K', '91.6%', '916'],
          ['18K', '75%', '750'],
          ['14K', '58.5%', '585'],
        ],
      },
    },
    { h: 'Before you buy gold', list: ['Check the BIS hallmark and the 6-character HUID on the ornament.', 'Ask for the rate, wastage/VA and making charges separately on the bill.', 'GST on jewellery is 3%.'] },
  ],
  language: [
    {
      h: 'Telugu letter guide',
      table: { head: ['Type', 'You get'], rows: TELUGU_HELP.map((h) => [h.en, h.te]) },
    },
  ],
};
