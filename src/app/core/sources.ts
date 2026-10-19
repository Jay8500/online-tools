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
  'travel-planner': [
    { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
    { name: 'openrouteservice', url: 'https://openrouteservice.org/' },
  ],
};
