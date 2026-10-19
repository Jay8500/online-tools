/**
 * Site-wide settings. IDs left empty switch the feature off (no script is loaded),
 * so the site works before AdSense / GA4 accounts exist.
 */
export const SITE = {
  name: 'SpreadApps Tools',
  url: 'https://tools.spreadapps.in',
  owner: 'SpreadApps',
  /** Person behind the brand (no company registered yet). */
  operator: 'Lakkoju Jaya Krishna',
  location: 'Hyderabad, Telangana, India',
  email: 'contact@spreadapps.in',
  /** GA4 measurement ID, e.g. 'G-ABC123XYZ' (loaded only after analytics consent). */
  ga4Id: 'G-DXSGQK0JV0',
  /** AdSense publisher ID, e.g. 'ca-pub-1234567890123456'. */
  adsenseClient: 'ca-pub-1803903263399664',
  /** Ad unit slot IDs from AdSense → Ads → By ad unit. */
  adSlots: { top: '', inContent: '', sidebar: '' } as Record<string, string>,
  /**
   * When AdSense "Privacy & messaging" (Google-certified CMP) is switched on, set this to true
   * so our own banner stops showing — Google's message then asks for consent.
   */
  useGoogleCmp: false,
  /** Public "used N times" counter (Netlify Function + Blobs). Shown only above this number. */
  counterMinToShow: 25,
} as const;
