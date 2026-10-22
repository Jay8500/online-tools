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
  | 'count'
  | 'gold'
  | 'weather'
  | 'travel'
  | 'metro'
  | 'fuel'
  | 'grocery'
  | 'cinema'
  | 'holidays'
  | 'traffic'
  | 'police'
  | 'bunks'
  | 'steps'
  | 'currency'
  | 'techterms'
  | 'recharge'
  | 'ott'
  | 'markets'
  | 'panchangam'
  | 'age'
  | 'percent'
  | 'days'
  | 'cgpa'
  | 'split';

export type ToolGroupName = 'PDF tools' | 'Business tools' | 'Health calculators' | 'Language tools' | 'Converters' | 'Daily tools';

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
  { id: 'steps', path: 'step-counter', name: 'Step counter & calories', group: 'Health calculators', icon: 'footprints', blurb: 'Count steps, km & calories burned' },
  { id: 'due-date', path: 'pregnancy-due-date-calculator', name: 'Pregnancy due date', group: 'Health calculators', icon: 'baby', blurb: 'Due date & week by week' },
  { id: 'gold', path: 'gold-price-calculator', name: 'Gold & silver price', group: 'Daily tools', icon: 'scale', blurb: 'Jewellery price with making & GST' },
  { id: 'fuel', path: 'petrol-diesel-price', name: 'Petrol & diesel price', group: 'Daily tools', icon: 'gauge', blurb: 'Hyderabad, AP & metros with ▲▼' },
  { id: 'holidays', path: 'holiday-calendar', name: 'Holiday calendar', group: 'Daily tools', icon: 'calendar-days', blurb: 'India, Telangana & AP holidays 2026–27' },
  { id: 'weather', path: 'weather', name: 'Weather', group: 'Daily tools', icon: 'thermometer', blurb: 'Today + 5-day forecast, any city' },
  { id: 'panchangam', path: 'telugu-panchangam', name: 'Telugu Panchangam', group: 'Daily tools', icon: 'sun', blurb: 'Today’s tithi, nakshatram, Rahu kalam' },
  { id: 'grocery', path: 'vegetable-prices-today', name: 'Vegetable & grocery prices', group: 'Daily tools', icon: 'receipt', blurb: 'Rythu Bazar & mandi rates, milk, eggs' },
  { id: 'metro', path: 'hyderabad-metro-fare', name: 'Hyderabad Metro fare', group: 'Daily tools', icon: 'map-pin', blurb: 'Fare, stations & route, all 3 lines' },
  { id: 'traffic', path: 'traffic-challan-fines', name: 'Traffic fines & rules', group: 'Daily tools', icon: 'traffic-cone', blurb: 'Challan amounts for TS & AP, rules in short' },
  { id: 'police', path: 'police-station-near-me', name: 'Police station near me', group: 'Daily tools', icon: 'shield-check', blurb: 'Nearest stations + 112 / 100 call' },
  { id: 'bunks', path: 'petrol-bunk-near-me', name: 'Petrol bunk near me', group: 'Daily tools', icon: 'gauge', blurb: 'Nearest pumps by brand & distance' },
  { id: 'recharge', path: 'mobile-recharge-plans', name: 'Mobile recharge plans', group: 'Daily tools', icon: 'smartphone', blurb: 'Jio, Airtel, Vi, BSNL — cost per day' },
  { id: 'markets', path: 'stock-market-today', name: 'Stock market today', group: 'Daily tools', icon: 'trending-up', blurb: 'Sensex, US & world markets, IPOs explained' },
  { id: 'ott', path: 'ott-subscription-prices', name: 'OTT subscription prices', group: 'Daily tools', icon: 'tv', blurb: 'Netflix, Prime, JioHotstar, aha & more' },
  { id: 'cinema', path: 'cinemas-near-me', name: 'Cinemas near me', group: 'Daily tools', icon: 'clapperboard', blurb: 'Theatres by distance, shows & tickets' },
  { id: 'travel', path: 'travel-planner', name: 'Travel planner', group: 'Daily tools', icon: 'map-pin', blurb: 'Route, stops & time by road, rail, air' },
  { id: 'age', path: 'age-calculator', name: 'Age calculator', group: 'Daily tools', icon: 'cake', blurb: 'Exact age in years, months, days' },
  { id: 'cgpa', path: 'cgpa-to-percentage-calculator', name: 'CGPA to percentage', group: 'Daily tools', icon: 'graduation-cap', blurb: 'JNTU, CBSE, AICTE formulas' },
  { id: 'split', path: 'split-bill-calculator', name: 'Split bill', group: 'Daily tools', icon: 'users', blurb: 'Trip & party: who pays whom' },
  { id: 'days', path: 'days-calculator', name: 'Days counter', group: 'Daily tools', icon: 'calendar-days', blurb: 'Days left to exam, EMI or any date' },
  { id: 'percent', path: 'percentage-calculator', name: 'Percentage calculator', group: 'Daily tools', icon: 'percent', blurb: 'Marks %, discount, % increase' },
  { id: 'currency', path: 'currency-converter', name: 'Currency converter', group: 'Converters', icon: 'banknote', blurb: 'Dollar, dirham, riyal ↔ rupee, live' },
  { id: 'land', path: 'land-area-converter', name: 'Land area & price', group: 'Converters', icon: 'ruler', blurb: 'Acre, gunta, cent, ankanam, gajam' },
  { id: 'length', path: 'length-converter', name: 'Length converter', group: 'Converters', icon: 'ruler', blurb: 'km, miles, feet, inches' },
  { id: 'weight', path: 'weight-converter', name: 'Weight converter', group: 'Converters', icon: 'scale', blurb: 'kg, pounds, tola, quintal' },
  { id: 'temperature', path: 'temperature-converter', name: 'Temperature converter', group: 'Converters', icon: 'thermometer', blurb: '°C ↔ °F ↔ Kelvin' },
  { id: 'count', path: 'number-converter', name: 'Lakh, crore & dozen', group: 'Converters', icon: 'hash', blurb: 'Lakh ↔ million, dozen, gross' },
  { id: 'volume', path: 'volume-converter', name: 'Volume converter', group: 'Converters', icon: 'cup-soda', blurb: 'Litres, ml, gallons' },
  { id: 'speed', path: 'speed-converter', name: 'Speed converter', group: 'Converters', icon: 'gauge', blurb: 'km/h, mph, m/s' },
  { id: 'data', path: 'data-size-converter', name: 'Data size converter', group: 'Converters', icon: 'hard-drive', blurb: 'KB, MB, GB, Mbps' },
  { id: 'techterms', path: 'computer-abbreviations', name: 'Computer full forms', group: 'Language tools', icon: 'cpu', blurb: '120+ IT abbreviations + data maths' },
  { id: 'telugu', path: 'telugu-typing', name: 'Telugu typing', group: 'Language tools', icon: 'languages', blurb: 'Type English, get తెలుగు' },
];
