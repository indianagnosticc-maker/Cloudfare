const PARAM_NAMES = [
  "number","vehicle","reg","rc","regno","registration",
  "vno","vehicle_number","vehicleNumber","vehicle_no",
  "reg_number","regNumber","plate","plate_number",
  "car","carno","car_number","q","query","search",
  "vehical","vehicalno"
];

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const raw = req.query.number || req.query.q || req.query.vehicle || "";
  const vehicle = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (vehicle.length < 8 || vehicle.length > 12) {
    return res.status(400).json({ error: "invalid vehicle number" });
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
    "Accept": "application/json"
  };

  // ✅ NEW API URL — replaced with rajfflivebot.onrender.com
  const url = `http://rajfflivebot.onrender.com/pub/rajfflive/vnum?vnum=${encodeURIComponent(vehicle)}`;

  try {
    const r = await fetch(url, { headers });
    const txt = await r.text();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");

    if (r.status === 200) {
      return res.status(200).send(txt);
    }
    return res.status(r.status).send(txt);
  } catch (e) {
    return res.status(500).json({
      error: "upstream failed",
      message: String(e.message || e)
    });
  }
}
