export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = req.query.q || req.query.query;

  if (!query) {
    return res.status(400).json({ success: false, error: 'Query required' });
  }

  try {
    const cleanQuery = query.replace('@', '').trim();
    const isNumericId = /^\d+$/.test(cleanQuery);

    // ID ho ya username, dono ke liye same URL
    const API_URL = `https://rtf-api-server.onrender.com/api?types=telegram&key=RTFSERVER&spell=rtfgamming&q=${encodeURIComponent(cleanQuery)}`;

    const response = await fetch(API_URL, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Response log kar (debugging ke liye Vercel logs me dikhega)
    console.log('[TG-OSINT] Query:', cleanQuery, '| Type:', isNumericId ? 'ID' : 'USERNAME');
    console.log('[TG-OSINT] Response:', JSON.stringify(data).slice(0, 500));

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
