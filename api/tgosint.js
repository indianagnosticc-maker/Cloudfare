export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = req.query.q || req.query.query;

  if (!query) {
    return res.status(400).json({ success: false, error: 'Query required' });
  }

  const cleanQuery = String(query).replace('@', '').trim();
  const BASE = 'https://rtf-api-server.onrender.com/api?types=telegram&key=RTFSERVER&spell=rtfgamming';

  // Server metadata keys — inhe real data nahi maanenge
  const SERVER_KEYS = new Set([
    'spell', 'used_count', 'server_time_ist', 'server_time',
    'dm_for_buy', 'developer', 'number', 'country', 'country_code',
    'success', 'status', 'message', 'error', 'credit', 'credits'
  ]);

  const paramsToTry = ['username', 'user', 'id', 'query', 'q', 'tg', 'userid', 'telegram'];

  for (const param of paramsToTry) {
    try {
      const url = `${BASE}&${param}=${encodeURIComponent(cleanQuery)}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (!data || typeof data !== 'object') continue;

      // Real data hai ya sirf server metadata?
      const keys = Object.keys(data);
      const realKeys = keys.filter(k => !SERVER_KEYS.has(k));

      // Agar real keys mile aur unme actual user info hai
      const hasRealData = realKeys.length > 0 && realKeys.some(k => {
        const v = data[k];
        return v !== null && v !== undefined && String(v).trim() !== '';
      });

      if (hasRealData) {
        // Ek clean response bhej, metadata strip kar
        const cleaned = {};
        for (const k of realKeys) cleaned[k] = data[k];
        return res.status(200).json(cleaned);
      }
    } catch (err) {
      // next param try karo
    }
  }

  // Sab params try kiye, koi real data nahi mila
  return res.status(200).json({
    success: false,
    error: 'No Telegram data returned by API for this query',
    query: cleanQuery
  });
}
