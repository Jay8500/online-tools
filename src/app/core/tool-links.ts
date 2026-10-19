/** Light list of the "more tools" pages for routes, nav, home and stats (page text lives in tool-pages.ts). */
export type ToolKind =
  | 'bmi'
  | 'calorie'
  | 'ideal-weight'
  | 'due-date'
  | 'upi-qr'
  | 'telugu'
  | 'gst-invoice'
  | 'pdf-merge'
  | 'pdf-split'
  | 'pdf-compress'
  | 'image-to-pdf'
  | 'pdf-to-image'
  | 'land'
  | 'length'
  | 'weight'
  | 'volume'
  | 'temperature'
  | 'speed'
  | 'data'
  | 'count';

export type ToolGroupName = 'PDF tools' | 'Business tools' | 'Health calculators' | 'Language tools' | 'Converters';

export interface ToolLinkLite {
  id: ToolKind;
  path: string;
  name: string;
  group: ToolGroupName;
  icon: string;
  blurb: string;
}

export const TOOL_LINKS: ToolLinkLite[] = [
  { id: 'pdf-merge', path: 'merge-pdf', name: 'Merge PDF', group: 'PDF tools', icon: 'file-stack', blurb: 'Join PDFs into one' },
  { id: 'pdf-split', path: 'split-pdf', name: 'Split PDF', group: 'PDF tools', icon: 'scissors', blurb: 'Pick or remove pages' },
  { id: 'pdf-compress', path: 'compress-pdf', name: 'Compress PDF', group: 'PDF tools', icon: 'file-down', blurb: 'Make PDFs smaller' },
  { id: 'image-to-pdf', path: 'jpg-to-pdf', name: 'JPG to PDF', group: 'PDF tools', icon: 'file-image', blurb: 'Photos/scans into one PDF' },
  { id: 'pdf-to-image', path: 'pdf-to-jpg', name: 'PDF to JPG', group: 'PDF tools', icon: 'image-up', blurb: 'Each page as an image' },
  { id: 'upi-qr', path: 'upi-qr-code-generator', name: 'UPI QR generator', group: 'Business tools', icon: 'qr-code', blurb: 'Payment QR + shop poster' },
  { id: 'gst-invoice', path: 'gst-invoice-generator', name: 'GST invoice maker', group: 'Business tools', icon: 'file-text', blurb: 'Print-ready tax invoice' },
  { id: 'bmi', path: 'bmi-calculator', name: 'BMI calculator', group: 'Health calculators', icon: 'heart-pulse', blurb: 'Indian (Asian) BMI ranges' },
  { id: 'calorie', path: 'calorie-calculator', name: 'Calorie calculator', group: 'Health calculators', icon: 'flame', blurb: 'BMR & daily calories' },
  { id: 'ideal-weight', path: 'ideal-weight-calculator', name: 'Ideal weight', group: 'Health calculators', icon: 'scale', blurb: 'Healthy range for your height' },
  { id: 'due-date', path: 'pregnancy-due-date-calculator', name: 'Pregnancy due date', group: 'Health calculators', icon: 'baby', blurb: 'Due date & week by week' },
  { id: 'land', path: 'land-area-converter', name: 'Land area & price', group: 'Converters', icon: 'ruler', blurb: 'Acre, gunta, cent, ankanam, gajam' },
  { id: 'length', path: 'length-converter', name: 'Length converter', group: 'Converters', icon: 'ruler', blurb: 'km, miles, feet, inches' },
  { id: 'weight', path: 'weight-converter', name: 'Weight converter', group: 'Converters', icon: 'scale', blurb: 'kg, pounds, tola, quintal' },
  { id: 'temperature', path: 'temperature-converter', name: 'Temperature converter', group: 'Converters', icon: 'thermometer', blurb: '°C ↔ °F ↔ Kelvin' },
  { id: 'count', path: 'number-converter', name: 'Lakh, crore & dozen', group: 'Converters', icon: 'hash', blurb: 'Lakh ↔ million, dozen, gross' },
  { id: 'volume', path: 'volume-converter', name: 'Volume converter', group: 'Converters', icon: 'cup-soda', blurb: 'Litres, ml, gallons' },
  { id: 'speed', path: 'speed-converter', name: 'Speed converter', group: 'Converters', icon: 'gauge', blurb: 'km/h, mph, m/s' },
  { id: 'data', path: 'data-size-converter', name: 'Data size converter', group: 'Converters', icon: 'hard-drive', blurb: 'KB, MB, GB, Mbps' },
  { id: 'telugu', path: 'telugu-typing', name: 'Telugu typing', group: 'Language tools', icon: 'languages', blurb: 'Type English, get తెలుగు' },
];
