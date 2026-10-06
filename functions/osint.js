export default async function handler(req, res) {
  const q = req.query.q || "";
  if (!q) return res.status(400).json({ error: "missing q" });
  try {
    const r = await fetch("https://info.apikendra.cc/search/any?q=" + encodeURIComponent(q), {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    });
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
