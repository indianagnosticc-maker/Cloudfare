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

  const paramsToTry = ['username', 'user', 'id', 'query', 'q', 'tg', 'userid', 'telegram'];

  for (const param of paramsToTry) {
    try {
      const url = `${BASE}&${param}=${encodeURIComponent(cleanQuery)}`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) continue;

      const data = await response.json();
      if (!data) continue;

      let records = [];
      if (Array.isArray(data)) records = data;
      else if (data.data && Array.isArray(data.data)) records = data.data;
      else if (data.result && Array.isArray(data.result)) records = data.result;
      else if (data.user && typeof data.user === 'object') records = [data.user];
      else if (data.data && typeof data.data === 'object') records = [data.data];
      else records = [data];

      const validRecord = records.find(r => {
        if (!r || typeof r !== 'object') return false;
        const hasId = r.id || r.user_id || r.userId;
        const hasUsername = r.username || r.user_name;
        const hasName = r.first_name || r.firstName || r.name;
        return hasId || hasUsername || hasName;
      });

      if (validRecord) {
        const cleaned = {};
        for (const [k, v] of Object.entries(validRecord)) {
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            cleaned[k] = v;
          }
        }
        return res.status(200).json(cleaned);
      }
    } catch (err) {
      // Ignore and try next param
    }
  }

  return res.status(200).json({ 
    success: false, 
    error: 'No Telegram data returned by API for this query', 
    query: cleanQuery 
  });
}
