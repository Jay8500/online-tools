/**
 * Travel helpers: built-in Indian cities (approximate city-centre coordinates), straight-line distance,
 * typical travel-time estimates per mode, and deep links to official booking / map sites.
 * Estimates are clearly labelled; real timetables come from the linked services.
 */

export interface City {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  // Telangana
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.487 },
  { name: 'Secunderabad', state: 'Telangana', lat: 17.44, lon: 78.5 },
  { name: 'Warangal', state: 'Telangana', lat: 17.97, lon: 79.59 },
  { name: 'Karimnagar', state: 'Telangana', lat: 18.44, lon: 79.13 },
  { name: 'Nizamabad', state: 'Telangana', lat: 18.67, lon: 78.09 },
  { name: 'Khammam', state: 'Telangana', lat: 17.25, lon: 80.15 },
  { name: 'Nalgonda', state: 'Telangana', lat: 17.05, lon: 79.27 },
  { name: 'Mahabubnagar', state: 'Telangana', lat: 16.74, lon: 78.0 },
  { name: 'Adilabad', state: 'Telangana', lat: 19.66, lon: 78.53 },
  { name: 'Siddipet', state: 'Telangana', lat: 18.1, lon: 78.85 },
  // Andhra Pradesh
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.51, lon: 80.65 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.69, lon: 83.22 },
  { name: 'Guntur', state: 'Andhra Pradesh', lat: 16.31, lon: 80.44 },
  { name: 'Amaravati', state: 'Andhra Pradesh', lat: 16.51, lon: 80.52 },
  { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.63, lon: 79.42 },
  { name: 'Nellore', state: 'Andhra Pradesh', lat: 14.44, lon: 79.99 },
  { name: 'Kurnool', state: 'Andhra Pradesh', lat: 15.83, lon: 78.04 },
  { name: 'Kakinada', state: 'Andhra Pradesh', lat: 16.99, lon: 82.25 },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', lat: 17.0, lon: 81.8 },
  { name: 'Anantapur', state: 'Andhra Pradesh', lat: 14.68, lon: 77.6 },
  { name: 'Kadapa', state: 'Andhra Pradesh', lat: 14.47, lon: 78.82 },
  { name: 'Ongole', state: 'Andhra Pradesh', lat: 15.5, lon: 80.05 },
  { name: 'Eluru', state: 'Andhra Pradesh', lat: 16.71, lon: 81.1 },
  { name: 'Srikakulam', state: 'Andhra Pradesh', lat: 18.3, lon: 83.9 },
  { name: 'Vizianagaram', state: 'Andhra Pradesh', lat: 18.11, lon: 83.4 },
  { name: 'Chittoor', state: 'Andhra Pradesh', lat: 13.22, lon: 79.1 },
  { name: 'Bhimavaram', state: 'Andhra Pradesh', lat: 16.54, lon: 81.52 },
  { name: 'Machilipatnam', state: 'Andhra Pradesh', lat: 16.19, lon: 81.13 },
  { name: 'Srisailam', state: 'Andhra Pradesh', lat: 16.07, lon: 78.87 },
  { name: 'Puttaparthi', state: 'Andhra Pradesh', lat: 14.17, lon: 77.81 },
  // Rest of India
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.97, lon: 77.59 },
  { name: 'Mysuru', state: 'Karnataka', lat: 12.3, lon: 76.64 },
  { name: 'Mangaluru', state: 'Karnataka', lat: 12.91, lon: 74.86 },
  { name: 'Hubballi', state: 'Karnataka', lat: 15.36, lon: 75.12 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.08, lon: 80.27 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.02, lon: 76.96 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.93, lon: 78.12 },
  { name: 'Kochi', state: 'Kerala', lat: 9.93, lon: 76.27 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.52, lon: 76.94 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.08, lon: 72.88 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.52, lon: 73.86 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.15, lon: 79.09 },
  { name: 'Shirdi', state: 'Maharashtra', lat: 19.77, lon: 74.48 },
  { name: 'Panaji (Goa)', state: 'Goa', lat: 15.49, lon: 73.83 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.02, lon: 72.57 },
  { name: 'Delhi', state: 'Delhi', lat: 28.61, lon: 77.21 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.91, lon: 75.79 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.85, lon: 80.95 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.32, lon: 82.97 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.57, lon: 88.36 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.3, lon: 85.82 },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.25, lon: 81.63 },
  { name: 'Patna', state: 'Bihar', lat: 25.59, lon: 85.14 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.26, lon: 77.41 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.72, lon: 75.86 },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.73, lon: 76.78 },
  { name: 'Guwahati', state: 'Assam', lat: 26.14, lon: 91.74 },
];

export function findCity(name: string): City | undefined {
  const n = name.trim().toLowerCase();
  return CITIES.find((c) => c.name.toLowerCase() === n || c.name.toLowerCase().startsWith(n + ' '));
}

/** Great-circle distance in km. */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type TravelMode = 'car' | 'bike' | 'bus' | 'train' | 'flight' | 'walk' | 'cycle';

export const MODES: { id: TravelMode; label: string; icon: string }[] = [
  { id: 'car', label: 'Car', icon: '🚗' },
  { id: 'bike', label: 'Bike', icon: '🏍️' },
  { id: 'bus', label: 'Bus', icon: '🚌' },
  { id: 'train', label: 'Train', icon: '🚆' },
  { id: 'flight', label: 'Flight', icon: '✈️' },
  { id: 'walk', label: 'Walk', icon: '🚶' },
  { id: 'cycle', label: 'Cycle', icon: '🚲' },
];

/** Road and rail distances are longer than a straight line; these are typical Indian averages. */
const ROAD_FACTOR = 1.25;
const RAIL_FACTOR = 1.3;
const SPEED: Record<Exclude<TravelMode, 'flight'>, number> = { car: 55, bike: 45, bus: 40, train: 55, walk: 4.5, cycle: 14 };

export interface Estimate {
  mode: TravelMode;
  km: number;
  hours: number;
  note: string;
}

/** Typical door-to-door style estimate from the straight-line distance. */
export function estimate(mode: TravelMode, straightKm: number): Estimate {
  if (mode === 'flight') {
    const air = straightKm / 650 + 0.5; // cruise + climb/descent
    return { mode, km: Math.round(straightKm), hours: air, note: `about ${fmtHours(air)} in the air, plus ~2.5 h for airport check-in and travel` };
  }
  const km = straightKm * (mode === 'train' ? RAIL_FACTOR : ROAD_FACTOR);
  const hours = km / SPEED[mode];
  const note =
    mode === 'walk' ? `at about 4.5 km/h${hours > 8 ? `, roughly ${Math.ceil(hours / 8)} days walking 8 hours a day` : ''}` : mode === 'cycle' ? 'at about 14 km/h' : mode === 'train' ? 'typical express train average; superfast trains are quicker' : `average including traffic`;
  return { mode, km: Math.round(km), hours, note };
}

export function fmtHours(h: number): string {
  const total = Math.max(1, Math.round(h * 60));
  const d = Math.floor(total / 1440);
  const hh = Math.floor((total % 1440) / 60);
  const mm = total % 60;
  return [d ? `${d} d` : '', hh ? `${hh} h` : '', !d && mm ? `${mm} min` : ''].filter(Boolean).join(' ') || '1 min';
}

const GMAPS_MODE: Record<TravelMode, string> = { car: 'driving', bike: 'two-wheeler', bus: 'transit', train: 'transit', flight: 'driving', walk: 'walking', cycle: 'bicycling' };

/** Official / trusted places to get real timings and tickets for each mode. */
export function travelLinks(mode: TravelMode, from: string, to: string): { label: string; url: string }[] {
  const q = encodeURIComponent;
  const maps = { label: 'Open in Google Maps', url: `https://www.google.com/maps/dir/?api=1&origin=${q(from)}&destination=${q(to)}&travelmode=${GMAPS_MODE[mode]}` };
  switch (mode) {
    case 'train':
      return [
        { label: 'IRCTC — book trains', url: 'https://www.irctc.co.in/' },
        { label: 'NTES — train timings & live status', url: 'https://enquiry.indianrail.gov.in/mntes/' },
        { label: 'Google Maps — trains & buses', url: maps.url },
      ];
    case 'bus':
      return [
        { label: 'TGSRTC (Telangana) buses', url: 'https://www.tgsrtcbus.in/' },
        { label: 'APSRTC (Andhra Pradesh) buses', url: 'https://www.apsrtconline.in/' },
        { label: 'Google Maps — buses & trains', url: maps.url },
      ];
    case 'flight':
      return [{ label: 'Google Flights — compare flights', url: `https://www.google.com/travel/flights?q=${q(`Flights from ${from} to ${to}`)}` }];
    default:
      return [maps];
  }
}
