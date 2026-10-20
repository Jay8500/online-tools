// Temporary probe: can an edge location reach api.data.gov.in? (Netlify's US functions get ECONNREFUSED.)
export default async () => {
  const key = Netlify.env.get('DATA_GOV_IN_API_KEY')?.trim();
  const started = Date.now();
  let result = '';
  try {
    const r = await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${key}&format=json&limit=1`, { signal: AbortSignal.timeout(8000) });
    result = `status ${r.status}`;
  } catch (e) {
    result = `failed: ${e instanceof Error ? e.name + ' ' + e.message.replace(/api-key=[^&\s]+/g, 'api-key=***') : 'unknown'}`.slice(0, 160);
  }
  return Response.json({ region: Deno.env.get('DENO_REGION') ?? 'unknown', hasKey: !!key, result, ms: Date.now() - started }, { headers: { 'cache-control': 'no-store' } });
};
export const config = { path: '/api/mandi-probe' };
