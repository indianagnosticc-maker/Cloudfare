export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get("q") || "";
  if (!q) {
    return new Response(JSON.stringify({ error: "missing q" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const r = await fetch("https://info.apikendra.cc/search/any?q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    });
    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
