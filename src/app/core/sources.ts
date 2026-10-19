/** Third-party data used by live tools — shown (with links) on cards and tool pages. Some licences require this credit. */
export interface Source {
  name: string;
  url: string;
}

export const SOURCES: Record<string, Source[]> = {
  'gold-price-calculator': [
    { name: 'gold-api.com', url: 'https://gold-api.com/' },
    { name: 'ExchangeRate-API', url: 'https://www.exchangerate-api.com/' },
  ],
  weather: [{ name: 'OpenWeather', url: 'https://openweathermap.org/' }],
  'hyderabad-metro-fare': [
    { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
    { name: 'HMRL fare chart', url: 'https://www.ltmetro.com/' },
  ],
  'petrol-diesel-price': [
    { name: 'IOCL', url: 'https://iocl.com/petrol-diesel-price' },
    { name: 'Business Today', url: 'https://www.businesstoday.in/' },
    { name: 'Goodreturns', url: 'https://www.goodreturns.in/petrol-price.html' },
  ],
  'vegetable-prices-today': [
    { name: 'data.gov.in (Agmarknet)', url: 'https://data.gov.in/' },
    { name: 'NECC', url: 'https://www.e2necc.com/' },
  ],
  'holiday-calendar': [
    { name: 'DoPT', url: 'https://dopt.gov.in/' },
    { name: 'Telangana GAD', url: 'https://www.telangana.gov.in/' },
    { name: 'AP GAD', url: 'https://goir.ap.gov.in/' },
  ],
  'traffic-challan-fines': [
    { name: 'Motor Vehicles Act (India Code)', url: 'https://www.indiacode.nic.in/handle/123456789/1798' },
    { name: 'Parivahan e-Challan', url: 'https://echallan.parivahan.gov.in/' },
  ],
  'currency-converter': [{ name: 'ExchangeRate-API', url: 'https://www.exchangerate-api.com/' }],
  'mobile-recharge-plans': [
    { name: 'Jio', url: 'https://www.jio.com/selfcare/plans/mobility/prepaid-plans-list/' },
    { name: 'Airtel', url: 'https://www.airtel.in/recharge-online' },
    { name: 'Vi', url: 'https://www.myvi.in/prepaid/online-mobile-recharge' },
    { name: 'BSNL', url: 'https://www.bsnl.co.in/' },
  ],
  'ott-subscription-prices': [
    { name: 'Official app websites', url: 'https://help.netflix.com/en/node/24926' },
  ],
  'police-station-near-me': [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' }],
  'petrol-bunk-near-me': [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' }],
  'cinemas-near-me': [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' }],
  'travel-planner': [
    { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
    { name: 'openrouteservice', url: 'https://openrouteservice.org/' },
  ],
};
