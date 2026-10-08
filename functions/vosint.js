// functions/vosint.js  →  route: /vosint
// Upstream: apihub-livid.vercel.app

const API_KEY = "naxupdate_49447fc17415907058";
const UPSTREAM = "https://apihub-livid.vercel.app/api/vehicle";

export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("q")
           || url.searchParams.get("number")
           || url.searchParams.get("vehicle")
           || url.searchParams.get("veh")
           || "";

  const vehicle = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (vehicle.length < 8 || vehicle.length > 12) {
    return new Response(JSON.stringify({ error: "invalid vehicle number" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const target = `${UPSTREAM}?key=${encodeURIComponent(API_KEY)}&veh=${encodeURIComponent(vehicle)}`;

  try {
    const r = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    const txt = await r.text();

    return new Response(txt, {
      status: r.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: "upstream failed",
      message: String(e.message || e),
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
