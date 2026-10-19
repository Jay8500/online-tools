import { Faq } from './seo.service';
import { TOOL_LINKS, ToolKind, ToolLinkLite } from './tool-links';

export type Disclaimer = 'files' | 'health' | 'invoice' | 'upi' | 'language' | 'land' | 'units' | 'gold' | 'weather' | 'travel';

export interface ToolPageInfo extends ToolLinkLite {
  h1: string;
  title: string;
  description: string;
  intro: string;
  steps: string[];
  faqs: Faq[];
  disclaimer: Disclaimer;
}

const FILE_FAQ: Faq = {
  q: 'Are my files uploaded?',
  a: 'No. The PDF is opened and processed inside your browser on your own phone or computer. Nothing is sent to any server, so it is safe for Aadhaar, bank statements and certificates.',
};

const CONTENT: Record<ToolKind, Omit<ToolPageInfo, keyof ToolLinkLite>> = {
  'pdf-merge': {
    h1: 'Merge PDF Files',
    title: 'Merge PDF Online Free — Combine PDFs, No Upload',
    description: 'Combine several PDF files into one, in any order. Free, fast and private — files never leave your phone or computer.',
    intro: 'Join PDFs into one file — certificates, mark sheets, statements — in the order you choose.',
    steps: ['Tap “Choose PDFs” and pick two or more files (or drag them in).', 'Use the arrows to put them in the right order.', 'Tap “Merge” — the combined PDF downloads instantly.'],
    faqs: [FILE_FAQ, { q: 'Is there a limit?', a: 'Up to 50 files and 100 MB per file. Very large files depend on your device’s memory.' }, { q: 'Can I merge password-protected PDFs?', a: 'Not directly. Open the PDF, use Print → Save as PDF to create an unlocked copy, then merge.' }],
    disclaimer: 'files',
  },
  'pdf-split': {
    h1: 'Split PDF — Extract or Remove Pages',
    title: 'Split PDF Online Free — Extract or Delete Pages',
    description: 'Extract pages from a PDF, delete unwanted pages, or split every page into its own file. Free and private, no upload.',
    intro: 'Keep only the pages you need, remove blank pages, or split every page into a separate PDF.',
    steps: ['Choose your PDF.', 'Pick “Keep pages”, “Remove pages” or “Every page”.', 'Type page numbers like 1-3, 5, 8- (8- means 8 to the end).', 'Tap the button to download.'],
    faqs: [FILE_FAQ, { q: 'How do I write page ranges?', a: 'Use commas and dashes: “1-3, 5” means pages 1, 2, 3 and 5. “8-” means page 8 to the last page.' }, { q: 'Does splitting reduce quality?', a: 'No. Pages are copied exactly; text and images stay the same.' }],
    disclaimer: 'files',
  },
  'pdf-compress': {
    h1: 'Compress PDF',
    title: 'Compress PDF Online Free — Reduce PDF Size, No Upload',
    description: 'Reduce PDF file size for email, WhatsApp and government portals that limit uploads to 200 KB, 500 KB or 1 MB. Free and private.',
    intro: 'Make a PDF small enough for portals and email — scanned PDFs often shrink by 70–90%.',
    steps: ['Choose your PDF.', 'Pick a level — “Recommended” suits scanned documents.', 'Tap “Compress PDF” and compare the sizes.', 'Download the smaller file. If it’s still too big, try “Strong”.'],
    faqs: [
      FILE_FAQ,
      { q: 'Why is my text no longer selectable?', a: 'The Recommended and Strong levels redraw every page as an image — that is what makes scans much smaller. Use Light if you need selectable text.' },
      { q: 'How do I get a PDF under 200 KB for a form?', a: 'Use Strong. If it’s still too big, split the PDF and upload only the pages the form asks for.' },
    ],
    disclaimer: 'files',
  },
  'image-to-pdf': {
    h1: 'JPG to PDF Converter',
    title: 'JPG to PDF Online Free — Photos & Scans to PDF',
    description: 'Convert JPG, PNG or phone photos into one PDF — A4 pages, any order. Perfect for documents and assignments. Free, no upload.',
    intro: 'Turn photos of documents into one neat PDF — A4 pages, in the order you want.',
    steps: ['Choose your photos or scans (you can pick many at once).', 'Arrange them with the arrows.', 'Choose page size and margin.', 'Tap “Create PDF”.'],
    faqs: [FILE_FAQ, { q: 'Will the PDF be large?', a: 'Photos are resized to at most 2000 px and saved as JPEG, so a 10-page document is usually 1–3 MB. Use Compress PDF to make it smaller.' }, { q: 'Can I add iPhone HEIC photos?', a: 'Not yet — share them as JPG first (or set Camera → Formats → Most Compatible).' }],
    disclaimer: 'files',
  },
  'pdf-to-image': {
    h1: 'PDF to JPG Converter',
    title: 'PDF to JPG Online Free — Each Page as an Image',
    description: 'Convert every page of a PDF into a JPG or PNG image — for WhatsApp, Instagram or upload forms that need images. Free and private.',
    intro: 'Save each PDF page as an image — useful when a form only accepts JPG.',
    steps: ['Choose your PDF.', 'Pick JPG or PNG and the quality.', 'Tap “Convert to images”.', 'Tap any page to download it.'],
    faqs: [FILE_FAQ, { q: 'Which quality should I choose?', a: '150 dpi is clear on phones and for most forms. Choose 200 dpi if you will print the images.' }, { q: 'JPG or PNG?', a: 'JPG files are smaller and fine for photos and scans. PNG keeps small text sharper but is larger.' }],
    disclaimer: 'files',
  },
  'upi-qr': {
    h1: 'UPI QR Code Generator',
    title: 'UPI QR Code Generator Free — Payment QR & Shop Poster',
    description: 'Create a UPI payment QR code for your shop or business — works with GPay, PhonePe, Paytm and BHIM. Free printable poster, no signup.',
    intro: 'Make a payment QR for your UPI ID and print a shop poster — free, no signup.',
    steps: ['Enter your UPI ID (from your UPI app’s profile).', 'Enter the name customers should see.', 'Optionally fix an amount or add a note.', 'Download the QR or the printable poster — and test it with ₹1 first.'],
    faqs: [
      { q: 'Does this work with all UPI apps?', a: 'Yes. It creates a standard UPI payment link (upi://pay) that GPay, PhonePe, Paytm, BHIM and bank apps can scan.' },
      { q: 'Is there any fee?', a: 'No. The QR is free and money goes straight to your bank account through UPI. We never see or touch the payment.' },
      { q: 'Is my UPI ID stored?', a: 'No. The QR is created in your browser; your UPI ID is not sent to us.' },
      { q: 'Should I use my bank’s merchant QR instead?', a: 'For a registered business, a merchant QR from your bank or app gives payment alerts and reports. This QR is ideal for small shops, freelancers and personal collections.' },
    ],
    disclaimer: 'upi',
  },
  'gst-invoice': {
    h1: 'GST Invoice Maker',
    title: 'GST Invoice Generator Free — Print Tax Invoice PDF',
    description: 'Make a GST tax invoice with GSTIN check, HSN/SAC, CGST/SGST or IGST and amount in words. Print or save as PDF. Free, no signup.',
    intro: 'Create a clean GST tax invoice in minutes and save it as PDF — no account needed.',
    steps: [
      'Fill in your business details once — they are remembered on this device.',
      'Add the customer and place of supply (CGST+SGST or IGST is chosen automatically).',
      'Add items with HSN/SAC, quantity, rate and GST rate.',
      'Tap “Print / Save PDF” and choose “Save as PDF” in the print window.',
    ],
    faqs: [
      { q: 'When is IGST charged instead of CGST + SGST?', a: 'When your state and the place of supply are different (inter-state). For the same state, the tax is split equally into CGST and SGST.' },
      { q: 'Is my data saved online?', a: 'No. The invoice is kept only in your browser on this device so you can continue later. Nothing is uploaded.' },
      { q: 'Is this valid for e-invoicing?', a: 'Businesses above the e-invoice turnover limit must also report invoices on the IRP portal to get an IRN and QR. This tool makes a normal tax invoice; check with your CA for e-invoicing.' },
    ],
    disclaimer: 'invoice',
  },
  bmi: {
    h1: 'BMI Calculator for Indians',
    title: 'BMI Calculator India — Asian BMI Chart & Healthy Weight',
    description: 'Calculate your BMI with Indian (Asian) cut-offs — normal 18.5–22.9 — and see the healthy weight range for your height. Height in feet or cm.',
    intro: 'Body Mass Index with the lower cut-offs recommended for Indians.',
    steps: ['Enter your height (feet/inches or cm).', 'Enter your weight in kg.', 'Read your BMI and category on the Indian scale.', 'See the healthy weight range for your height.'],
    faqs: [
      { q: 'Why are Indian BMI ranges lower?', a: 'Indians tend to have more body fat and a higher risk of diabetes and heart disease at the same BMI. So Indian guidelines treat 23–24.9 as overweight and 25+ as obese, instead of the WHO’s 25 and 30.' },
      { q: 'Is BMI accurate for everyone?', a: 'No. It doesn’t account for muscle, age or body shape. Athletes may show a high BMI while being healthy. Waist size is a useful extra check.' },
    ],
    disclaimer: 'health',
  },
  calorie: {
    h1: 'Calorie Calculator (BMR & TDEE)',
    title: 'Calorie Calculator — BMR & Daily Calories to Lose Weight',
    description: 'Find your BMR and how many calories you need a day to maintain, lose or gain weight. Uses the Mifflin–St Jeor formula.',
    intro: 'Estimate the calories you burn each day and a sensible target for weight loss.',
    steps: ['Choose male or female and enter your age.', 'Enter height and weight.', 'Pick how active you are.', 'Use the maintain / lose / gain figures as a starting point.'],
    faqs: [
      { q: 'What is BMR?', a: 'Basal Metabolic Rate — the calories your body uses at complete rest. Your daily need (TDEE) is BMR multiplied by an activity factor.' },
      { q: 'How fast should I lose weight?', a: 'About 0.25–0.5 kg a week is considered safe for most adults. Faster loss usually needs medical supervision.' },
    ],
    disclaimer: 'health',
  },
  'ideal-weight': {
    h1: 'Ideal Weight Calculator',
    title: 'Ideal Weight Calculator by Height — Indian BMI Range',
    description: 'Find the healthy weight range for your height using Indian BMI guidelines (18.5–22.9), plus the Devine formula. Feet or cm.',
    intro: 'What should you weigh for your height? See a healthy range, not just one number.',
    steps: ['Choose male or female.', 'Enter your height in feet/inches or cm.', 'Read the healthy weight range.'],
    faqs: [{ q: 'Why a range and not one number?', a: 'Healthy weight depends on muscle, bone structure and age. Any weight within the range is considered healthy for that height.' }],
    disclaimer: 'health',
  },
  'due-date': {
    h1: 'Pregnancy Due Date Calculator',
    title: 'Pregnancy Due Date Calculator — Week by Week',
    description: 'Calculate your baby’s due date from your last period, see how many weeks pregnant you are and key scan dates. Adjusts for cycle length.',
    intro: 'Estimate your due date and how far along you are, from the first day of your last period.',
    steps: ['Pick the first day of your last menstrual period.', 'Change the cycle length if it isn’t 28 days.', 'See your due date, current week and key scan dates.'],
    faqs: [
      { q: 'How is the due date calculated?', a: 'Using Naegele’s rule: 280 days (40 weeks) after the first day of your last period, adjusted for cycle length. Only about 1 in 20 babies arrive on the exact date.' },
      { q: 'My scan gave a different date — which is right?', a: 'Follow your doctor. An early ultrasound is more accurate than a period-based estimate.' },
    ],
    disclaimer: 'health',
  },
  gold: {
    h1: 'Gold & Silver Price Calculator',
    title: 'Gold Price Calculator — Jewellery Price with Making Charges & GST',
    description: 'Calculate the price of gold or silver jewellery from today’s rate: weight in grams, tola or sovereign (pavan), 24K/22K/18K, wastage, making charges and 3% GST.',
    intro: 'Know what a gold or silver ornament should cost before you go to the shop — using today’s rate from your jeweller.',
    steps: [
      'Choose Gold or Silver.',
      'Type today’s rate from your jeweller and choose what it is for (e.g. 22K per 10 grams).',
      'Enter the weight (grams, tola or sovereign/pavan) and the purity of the ornament.',
      'Add wastage (VA) and making charges as quoted — the total includes 3% GST.',
    ],
    faqs: [
      { q: 'Why do I enter the rate myself?', a: 'Gold rates differ between cities and jewellers and change during the day. Using the rate your shop shows makes the estimate match your bill.' },
      { q: 'How is GST charged on jewellery?', a: 'GST of 3% applies to the value of the jewellery including making charges.' },
      { q: 'What is a sovereign or pavan?', a: 'A sovereign (pavan) is 8 grams of gold — a common unit in Tamil Nadu, Kerala and Andhra Pradesh. A tola is 11.66 grams.' },
      { q: 'What is wastage (VA)?', a: 'Value addition or wastage is an extra percentage of gold some jewellers charge for the metal lost while making the ornament — common in South India. Ask your jeweller for their figure.' },
    ],
    disclaimer: 'gold',
  },
  travel: {
    h1: 'Travel Planner — Route, Stops & Travel Time',
    title: 'Travel Planner India — Distance, Route, Stops & Time by Car, Bus, Train, Flight',
    description: 'Plan a journey between Indian cities: road route with towns along the way, distance and travel time by car, bike, bus, walking or cycling, plus train and flight estimates with IRCTC, TGSRTC and APSRTC links.',
    intro: 'Enter where you start and where you’re going, pick how you travel, and see the distance, time and the places you pass.',
    steps: [
      'Type the starting place and destination (pick from the list or type any town).',
      'Choose car, bike, bus, walk, cycle, train or flight.',
      'Tap “Show journey” — road modes show the route, towns along the way and turn-by-turn directions.',
      'For trains, buses and flights, use the official links for real timings and tickets.',
    ],
    faqs: [
      { q: 'Why don’t you show exact train and bus timings?', a: 'Indian Railways, TGSRTC and APSRTC don’t offer free public timetable data, so we link straight to IRCTC/NTES and the RTC websites for the real schedule instead of guessing.' },
      { q: 'How accurate are the road times?', a: 'Road routes come from OpenStreetMap. Times assume normal driving without breaks; buses and bikes are adjusted slower. Traffic, ghats and road works can add time.' },
      { q: 'Is my trip stored?', a: 'No. The place names are sent to the route service to work out the journey and are not stored by us.' },
    ],
    disclaimer: 'travel',
  },
  weather: {
    h1: 'Weather Today & 5-Day Forecast',
    title: 'Weather Today — Hyderabad, Vijayawada, Vizag & Any Indian City',
    description: 'Current temperature, feels-like, humidity, wind, sunrise and sunset plus the next 24 hours and 5-day forecast for Hyderabad, Andhra Pradesh, Telangana and any Indian city.',
    intro: 'Today’s weather and the next 5 days for any Indian city — or use your location.',
    steps: ['Tap a city or type yours.', 'Or tap the location button to use where you are (your browser asks first).', 'See current weather, the next 24 hours and the 5-day forecast.'],
    faqs: [
      { q: 'Where does the weather data come from?', a: 'From OpenWeather, which combines weather models with station and satellite data. It updates every few minutes; we refresh each city every 20 minutes.' },
      { q: 'Is my location stored?', a: 'No. If you use your location, only a rounded position (about 1 km) is sent to get the weather; we don’t store it.' },
      { q: 'Where can I see official warnings?', a: 'For cyclones, heavy rain and heatwaves, follow India Meteorological Department (IMD) alerts at mausam.imd.gov.in.' },
    ],
    disclaimer: 'weather',
  },
  land: {
    h1: 'Land Area Converter & Price Calculator (Telangana & AP)',
    title: 'Land Area Converter — Acre, Gunta, Cent, Ankanam, Sq Yards (Telangana, AP)',
    description: 'Convert acres, guntas, cents, ankanams, square yards (gajam) and sq ft for Hyderabad, Telangana and Andhra Pradesh. Plot size and land price calculator.',
    intro: 'Convert land measures used in Hyderabad, Telangana and Andhra Pradesh, work out a plot’s area from its length and width, and estimate its price.',
    steps: ['Choose “I know the area” and pick the unit (e.g. 10 guntas), or choose “Plot length × width” (e.g. 30 × 40 ft).', 'See the area in every unit at once — acres, guntas, cents, ankanams, square yards, sq ft.', 'Optionally enter the rate (e.g. ₹45,000 per sq yard) to see the total land value.'],
    faqs: [
      { q: 'How many guntas are in an acre?', a: '1 acre = 40 guntas (kuntas). One gunta is 121 square yards or 1,089 square feet.' },
      { q: 'How many cents are in an acre?', a: '1 acre = 100 cents. One cent is 48.4 square yards or 435.6 square feet — cents are common in Andhra Pradesh, Kerala and Tamil Nadu.' },
      { q: 'What is an ankanam?', a: 'An ankanam is used in coastal Andhra Pradesh for house sites: 1 ankanam = 72 sq ft = 8 square yards.' },
      { q: 'How many square yards is a 30 × 40 plot?', a: '30 × 40 feet = 1,200 sq ft = 133.33 square yards (gajam).' },
    ],
    disclaimer: 'land',
  },
  length: {
    h1: 'Length Converter — km, Miles, Feet, Inches',
    title: 'Length Converter — 1 km = How Many Miles, Feet to cm, Inches',
    description: 'Convert kilometres, miles, metres, feet, inches and yards instantly. 1 km = 0.621 miles, 1 foot = 30.48 cm. Free and works offline.',
    intro: 'Convert any length — 1 km = 1,000 m = 0.621 miles.',
    steps: ['Type a number.', 'Pick the unit you have and the unit you want.', 'Read the answer, or see it in every unit at once.'],
    faqs: [
      { q: '1 km is how many miles?', a: '1 kilometre = 0.6214 miles, and 1 mile = 1.609 kilometres.' },
      { q: 'How many cm is 5 feet 6 inches?', a: '5 ft 6 in = 66 inches = 167.64 cm.' },
    ],
    disclaimer: 'units',
  },
  weight: {
    h1: 'Weight Converter — kg, Pounds, Tola, Quintal',
    title: 'Weight Converter — kg to Pounds, Tola to Grams, Quintal',
    description: 'Convert kilograms, grams, pounds, tola, quintal, tonne, ounces and carats. 1 tola = 11.66 g, 1 kg = 2.2 lb. Free.',
    intro: 'Convert weights used in India and abroad — including tola (gold) and quintal (crops).',
    steps: ['Type a number.', 'Pick the units.', 'Read the answer and the full table.'],
    faqs: [
      { q: '1 tola is how many grams?', a: '1 tola = 11.6638 grams. Jewellers often round it to 11.66 g; some use 10 g as a “market tola”, so confirm with your jeweller.' },
      { q: '1 quintal is how many kg?', a: '1 quintal = 100 kg, and 10 quintals = 1 tonne.' },
    ],
    disclaimer: 'units',
  },
  volume: {
    h1: 'Volume Converter — Litres, ml, Gallons',
    title: 'Volume Converter — Litres to Gallons, ml, Cubic Feet',
    description: 'Convert litres, millilitres, cubic metres, cubic feet, US and UK gallons, cups and spoons. Free and instant.',
    intro: 'Convert liquids and volumes — litres, gallons, cubic feet and kitchen measures.',
    steps: ['Type a number.', 'Pick the units.', 'Read the answer.'],
    faqs: [{ q: '1 gallon is how many litres?', a: 'A US gallon is 3.785 litres; a UK (imperial) gallon is 4.546 litres.' }],
    disclaimer: 'units',
  },
  temperature: {
    h1: 'Temperature Converter — Celsius to Fahrenheit',
    title: 'Celsius to Fahrenheit Converter — °C to °F, Body Temperature',
    description: 'Convert Celsius, Fahrenheit and Kelvin. 37 °C = 98.6 °F. Free, instant, works offline.',
    intro: 'Convert °C, °F and K — handy for fever readings, weather and cooking.',
    steps: ['Type the temperature.', 'Pick °C, °F or K.', 'Read the converted value.'],
    faqs: [
      { q: 'What is 37 °C in Fahrenheit?', a: '37 °C = 98.6 °F, normal body temperature. A fever is usually 100.4 °F (38 °C) or higher.' },
      { q: 'What is the formula?', a: '°F = °C × 9 ÷ 5 + 32, and °C = (°F − 32) × 5 ÷ 9.' },
    ],
    disclaimer: 'units',
  },
  speed: {
    h1: 'Speed Converter — km/h, mph, m/s',
    title: 'Speed Converter — km/h to mph, m/s, Knots',
    description: 'Convert speeds between km/h, miles per hour, metres per second and knots. Free and instant.',
    intro: 'Convert speeds — 100 km/h = 62.1 mph.',
    steps: ['Type a speed.', 'Pick the units.', 'Read the answer.'],
    faqs: [{ q: '100 km/h is how many mph?', a: '100 km/h = 62.14 miles per hour = 27.78 metres per second.' }],
    disclaimer: 'units',
  },
  data: {
    h1: 'Data Size Converter — KB, MB, GB',
    title: 'KB to MB Converter — Data Size, GB, Mbps',
    description: 'Convert bytes, KB, MB, GB and TB (1 MB = 1,024 KB), and internet speed in Mbps to MB per second. Free.',
    intro: 'Convert file sizes the way exam portals and Windows count them (1 MB = 1,024 KB).',
    steps: ['Type a size.', 'Pick the units.', 'Read the answer.'],
    faqs: [
      { q: 'How many KB is 1 MB?', a: 'Most portals and Windows use 1 MB = 1,024 KB. Some storage makers use 1,000, which is why a “64 GB” phone shows less space.' },
      { q: 'Is 100 Mbps the same as 100 MB per second?', a: 'No. Internet speed is in megabits; 100 Mbps ≈ 11.9 MB per second.' },
    ],
    disclaimer: 'units',
  },
  count: {
    h1: 'Lakh, Crore, Million & Dozen Converter',
    title: 'Lakh to Million Converter — Crore, Billion, Dozen, Gross',
    description: 'Convert lakh and crore to million and billion, and count in dozens, scores and gross. 1 crore = 10 million, 1 dozen = 12.',
    intro: 'Switch between Indian and international numbers, and everyday counting units like dozen and gross.',
    steps: ['Type a number.', 'Pick lakh, crore, million, dozen…', 'Read the answer in every unit.'],
    faqs: [
      { q: '1 crore is how many million?', a: '1 crore = 10 million = 100 lakh. 10 lakh = 1 million, and 100 crore = 1 billion.' },
      { q: '1 dozen means how many?', a: '1 dozen = 12. A score is 20, and a gross is 144 (12 dozen).' },
    ],
    disclaimer: 'units',
  },
  telugu: {
    h1: 'Telugu Typing — English to Telugu',
    title: 'Telugu Typing Online — Type English, Get తెలుగు',
    description: 'Type Telugu easily using English letters: amma → అమ్మ, telugu → తెలుగు. Copy or share to WhatsApp. Free, works offline, no app.',
    intro: 'Type in English letters and get Telugu script instantly — copy it anywhere.',
    steps: ['Type the word as it sounds in English letters (e.g. “nEnu”).', 'Use capitals for harder sounds: T ట, D డ, N ణ, L ళ, E ఏ, O ఓ.', 'Tap Copy or WhatsApp to use the Telugu text.'],
    faqs: [
      { q: 'Does it translate English to Telugu?', a: 'No — it is phonetic typing. Type the Telugu words as they sound, e.g. “mIru elA unnAru” gives మీరు ఎలా ఉన్నారు. Typing English words like “how are you” just spells them in Telugu letters.' },
      { q: 'How do I type ం (sunna)?', a: 'Type M, e.g. “aMdaru” → అందరు. A word ending in m after a vowel becomes ం automatically: “pustakam” → పుస్తకం.' },
      { q: 'How do I type conjuncts like క్ష or శ్రీ?', a: 'Just type the letters together: “x” or “ksh” → క్ష, “SrI” → శ్రీ, “amma” → అమ్మ.' },
      { q: 'Is my text saved?', a: 'Only on this device, so you don’t lose it if you close the page. It is never uploaded.' },
    ],
    disclaimer: 'language',
  },
};

export const TOOL_PAGES: ToolPageInfo[] = TOOL_LINKS.map((l) => ({ ...l, ...CONTENT[l.id] }));

export function toolPage(id: string): ToolPageInfo | undefined {
  return TOOL_PAGES.find((t) => t.id === id);
}

export const DISCLAIMERS: Record<Disclaimer, string> = {
  files: 'Files are processed on your device and never uploaded. Keep a copy of your original file.',
  health: 'Health tools are not medical advice. Talk to a doctor before changing your diet, exercise or treatment.',
  invoice: 'This tool helps you format an invoice; it is not tax advice. Check GST rates, HSN codes and e-invoicing rules with your CA.',
  upi: 'Always test the QR by paying ₹1 with your own UPI app before printing. We never handle your money.',
  land: 'Conversions use standard definitions (1 acre = 40 guntas = 100 cents). Always confirm the area in your sale deed, pahani/1-B or registration documents. Prices exclude stamp duty and registration.',
  gold: 'Estimates only. Rates change during the day and differ between jewellers; wastage and making charges vary by design. Confirm the final bill at the shop.',
  travel: 'Times are estimates. Check IRCTC/NTES, TGSRTC/APSRTC or the airline for real timetables, and follow traffic and safety advisories.',
  weather: 'Forecasts can change. For cyclone, heavy-rain and heatwave warnings follow IMD (mausam.imd.gov.in) and local authorities.',
  units: 'Conversions use standard international definitions and run on your device.',
  language: 'Typing happens on your device. Spellings follow a phonetic scheme — check important text before sending.',
};
