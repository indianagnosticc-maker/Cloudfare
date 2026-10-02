export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'Unknown';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
    const region = request.headers.get('x-vercel-ip-country-region') || 'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const body = await request.json().catch(() => ({}));
    const searchType = body.searchType || 'Unknown';
    const searchedNumber = body.searchedNumber || 'Not provided';
    const screenInfo = body.screen || 'Unknown';
    const language = body.language || 'Unknown';
    const platform = body.platform || 'Unknown';
    const timezone = body.timezone || 'Unknown';
    const referrer = body.referrer || 'Direct';

    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });

    const message = `
🚨 *NEW SEARCH ALERT* 🚨

🔍 *Type:* ${searchType}
🔍 *Searched:* \`${searchedNumber}\`

━━━━━━━━━━━━━━━━━━━━
🌐 *IP & Location*
━━━━━━━━━━━━━━━━━━━━
📡 *IP:* \`${ip}\`
🌍 *Country:* ${country}
🏙️ *City:* ${city}
📍 *Region:* ${region}

━━━━━━━━━━━━━━━━━━━━
💻 *Device Info*
━━━━━━━━━━━━━━━━━━━━
🖥️ *Screen:* ${screenInfo}
🗣️ *Language:* ${language}
🧩 *Platform:* ${platform}
🕐 *Timezone:* ${timezone}

━━━━━━━━━━━━━━━━━━━━
🔗 *Other*
━━━━━━━━━━━━━━━━━━━━
↩️ *Referrer:* ${referrer}
🕐 *Time:* ${timestamp}
`;

    const tgResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      }
    );

    const tgResult = await tgResponse.json();

    return new Response(
      JSON.stringify({ success: true, telegram_sent: tgResult.ok }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers }
    );
  }
}
