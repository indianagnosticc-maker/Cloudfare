export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get query parameter (accept multiple param names)
  const query = req.query.q || req.query.query || req.query.id || req.query.username;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query required. Use ?q=username or ?q=123456789'
    });
  }

  // Clean the query
  const rawQuery = String(query).trim();
  const cleanQuery = rawQuery.replace(/^@/, '').trim(); // strip leading @

  if (!cleanQuery) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query'
    });
  }

  // Detect query type: numeric (user ID) or username
  const isNumericId = /^\d+$/.test(cleanQuery);
  const queryType = isNumericId ? 'id' : 'username';

  // Build candidate API URLs — try multiple formats so both @username and numeric ID work
  const BASE = 'https://tg2num-botadminshere.vercel.app/';
  const candidates = [];

  if (isNumericId) {
    // Numeric user ID
    candidates.push(`${BASE}?id=${encodeURIComponent(cleanQuery)}`);
    candidates.push(`${BASE}?user_id=${encodeURIComponent(cleanQuery)}`);
    candidates.push(`${BASE}?query=${encodeURIComponent(cleanQuery)}`);
  } else {
    // Username (with @ stripped)
    candidates.push(`${BASE}?id=${encodeURIComponent(cleanQuery)}`);
    candidates.push(`${BASE}?username=${encodeURIComponent(cleanQuery)}`);
    candidates.push(`${BASE}?user=${encodeURIComponent(cleanQuery)}`);
    candidates.push(`${BASE}?q=${encodeURIComponent(cleanQuery)}`);
    // Also try with @ prefix in case API expects it
    candidates.push(`${BASE}?id=${encodeURIComponent('@' + cleanQuery)}`);
    candidates.push(`${BASE}?username=${encodeURIComponent('@' + cleanQuery)}`);
  }

  let lastError = 'No data found';
  let lastRaw = null;

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = `API returned status ${response.status}`;
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          // Try to extract from HTML/text
          data = { message: text.substring(0, 800), _raw: true };
        }
      }

      if (!data) {
        lastError = 'Empty response';
        continue;
      }

      lastRaw = data;

      // Check if API returned an error explicitly
      if (data.error || data.success === false || data.status === 'error') {
        lastError = data.error || data.message || 'No data found';
        continue;
      }

      // Extract records from various structures
      let records = [];
      if (Array.isArray(data)) {
        records = data;
      } else if (data.data && Array.isArray(data.data)) {
        records = data.data;
      } else if (data.result && Array.isArray(data.result)) {
        records = data.result;
      } else if (data.user && typeof data.user === 'object') {
        records = [data.user];
      } else if (data.data && typeof data.data === 'object') {
        records = [data.data];
      } else if (data.result && typeof data.result === 'object') {
        records = [data.result];
      } else if (data.response && typeof data.response === 'object') {
        records = [data.response];
      } else if (typeof data === 'object') {
        const hasUserData =
          data.id || data.user_id || data.userId || data.uid ||
          data.username || data.user_name || data.handle ||
          data.first_name || data.firstName || data.name ||
          data.phone || data.mobile || data.number;
        if (hasUserData) records = [data];
      }

      // Find a valid record
      const validRecord = records.find(r => {
        if (!r || typeof r !== 'object') return false;
        const hasId = r.id || r.user_id || r.userId || r.uid;
        const hasUsername = r.username || r.user_name || r.handle;
        const hasName = r.first_name || r.firstName || r.name || r.fname;
        const hasPhone = r.phone || r.mobile || r.number;
        return hasId || hasUsername || hasName || hasPhone;
      });

      if (validRecord) {
        const cleaned = {};
        for (const [k, v] of Object.entries(validRecord)) {
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            cleaned[k] = v;
          }
        }

        // Make sure we also include the type and query in response for frontend clarity
        return res.status(200).json({
          success: true,
          query: cleanQuery,
          queryType,
          data: cleaned
        });
      }

      // If data has a message but no records, keep as lastError
      if (data.message && !records.length) {
        lastError = data.message;
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        lastError = 'Request timeout';
      } else {
        lastError = err.message || 'Request failed';
      }
      // Continue to next candidate
    }
  }

  // Nothing worked — return failure with helpful info
  return res.status(200).json({
    success: false,
    error: lastError || 'No Telegram data returned for this query',
    query: cleanQuery,
    queryType,
    hint: isNumericId
      ? 'Try a different User ID or username'
      : 'Try the username without @ or with @',
    raw: lastRaw && typeof lastRaw === 'object' ? Object.keys(lastRaw) : undefined
  });
}
