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
  'travel-planner': [
    { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
    { name: 'openrouteservice', url: 'https://openrouteservice.org/' },
  ],
};
