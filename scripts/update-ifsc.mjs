// Builds the static IFSC search data from Razorpay's open IFSC dataset (MIT, sourced from RBI).
// Runs before every build (npm "prebuild"); skips work when public/data/ifsc already has this version.
// To update: change VERSION to the latest tag on https://github.com/razorpay/ifsc/releases and build.
//
// Output (public/data/ifsc/, not in git, not in the app bundle — fetched only when a visitor searches):
//   banks.json                 [[code, name, branches], …]  biggest banks first
//   <BANK>/index.json          [[State, slug, branches, [districts…]], …]
//   <BANK>/<state-slug>.json   [[IFSC, branch, district, city, address, micr, flags], …]  flags: 1 NEFT · 2 RTGS · 4 IMPS · 8 UPI
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = 'v2.0.62';
const OUT = join('public', 'data', 'ifsc');
const MARK = join(OUT, 'version.txt');
/** Bump when the processing below changes, so the data is rebuilt even for the same dataset version. */
const BUILD = `${VERSION}+ts2`;

// Many Telangana branches are still filed under "Andhra Pradesh" (data from before the 2014 split).
// A branch in one of these districts/cities, or with Telangana/Hyderabad in its address, is moved to Telangana.
const TS_PLACES = /\b(hyderabad|secunderabad|ranga ?redd[yi]|r ?r dist|medchal|malkajgiri|warangal|hanamkonda|hanumakonda|karim ?nagar|nizam ?abad|khammam|nal ?gonda|maha?b?boo?b ?nagar|meh?boo?b ?nagar|mahbubnagar|medak|adilabad|sangareddy|siddipet|suryapet|jagtial|jagityal|jangaon|jangoan|bhupalpally|bhupalpalle|gadwal|kamareddy|asifabad|mahabubabad|mancherial|mulugu|nagarkurnool|narayanpet|nirmal|peddapalli|peddapally|sircilla|vikarabad|wanaparthy|yadadri|bhongir|bhuvanagiri|kothagudem|bhadradri|bhadrachalam|ramagundam|miryalaguda|zaheerabad|patancheru|shamshabad|ghatkesar|kukatpally|uppal|gachibowli|madhapur)\b/;

if (existsSync(MARK) && readFileSync(MARK, 'utf8').trim() === BUILD) {
  console.log(`update-ifsc: ${BUILD} already built`);
  process.exit(0);
}

try {
  console.log(`update-ifsc: downloading ${VERSION}…`);
  const [csv, names] = await Promise.all([
    get(`https://github.com/razorpay/ifsc/releases/download/${VERSION}/IFSC.csv`).then((r) => r.text()),
    get(`https://raw.githubusercontent.com/razorpay/ifsc/${VERSION}/src/banknames.json`).then((r) => r.json()),
  ]);
  const rows = parseCsv(csv);
  const head = rows.shift();
  const col = Object.fromEntries(head.map((h, i) => [h, i]));

  /** bank → state → rows */
  const banks = new Map();
  let moved = 0;
  for (const r of rows) {
    const ifsc = (r[col.IFSC] ?? '').trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) continue;
    const code = ifsc.slice(0, 4);
    let state = title(r[col.STATE] || 'Other');
    if (/^Telengana$/.test(state)) state = 'Telangana';
    if (state === 'Andhra Pradesh') {
      const where = `${r[col.DISTRICT]} ${r[col.CITY]} ${r[col.CENTRE]}`.toLowerCase();
      const addr = (r[col.ADDRESS] ?? '').toLowerCase();
      if (TS_PLACES.test(where) || /telangana|hyderabad|secunderabad/.test(addr)) (state = 'Telangana'), moved++;
    }
    const yes = (k) => (r[col[k]] ?? '').toLowerCase() === 'true';
    const flags = (yes('NEFT') ? 1 : 0) | (yes('RTGS') ? 2 : 0) | (yes('IMPS') ? 4 : 0) | (yes('UPI') ? 8 : 0);
    const row = [ifsc, clean(r[col.BRANCH]), title(r[col.DISTRICT] || r[col.CITY] || ''), title(r[col.CITY] || ''), clean(r[col.ADDRESS]), (r[col.MICR] ?? '').trim(), flags];
    if (!banks.has(code)) banks.set(code, new Map());
    const states = banks.get(code);
    if (!states.has(state)) states.set(state, []);
    states.get(state).push(row);
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const bankList = [];
  let files = 0;
  for (const [code, states] of banks) {
    const dir = join(OUT, code);
    mkdirSync(dir);
    const index = [];
    let total = 0;
    for (const [state, list] of [...states].sort(([a], [b]) => a.localeCompare(b))) {
      list.sort((a, b) => a[2].localeCompare(b[2]) || a[1].localeCompare(b[1]));
      const slug = state.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
      writeFileSync(join(dir, `${slug}.json`), JSON.stringify(list));
      files++;
      index.push([state, slug, list.length, [...new Set(list.map((r) => r[2]).filter(Boolean))]]);
      total += list.length;
    }
    writeFileSync(join(dir, 'index.json'), JSON.stringify(index));
    bankList.push([code, names[code] || code, total]);
  }
  bankList.sort((a, b) => b[2] - a[2] || a[1].localeCompare(b[1]));
  writeFileSync(join(OUT, 'banks.json'), JSON.stringify(bankList));
  writeFileSync(MARK, BUILD + '\n');
  console.log(`update-ifsc: ${rows.length} branches, ${bankList.length} banks, ${files} files, ${moved} moved AP → Telangana`);
} catch (e) {
  // Never block the site build — the branch search shows "temporarily unavailable" instead
  console.warn(`update-ifsc: skipped (${e.message})`);
}

async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r;
}

function clean(s = '') {
  return s.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
}

/** "ANDHRA PRADESH" → "Andhra Pradesh" (keeps short words like "of" small) */
function title(s = '') {
  return clean(s)
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Of|And|The)\b/g, (m) => m.toLowerCase());
}

/** Small RFC-4180 CSV parser (quoted fields, commas and newlines inside quotes). */
function parseCsv(text) {
  const out = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') (field += '"'), i++;
        else q = false;
      } else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') row.push(field), (field = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field), out.push(row), (row = []), (field = '');
    } else field += ch;
  }
  if (field || row.length) row.push(field), out.push(row);
  return out.filter((r) => r.length > 1);
}
