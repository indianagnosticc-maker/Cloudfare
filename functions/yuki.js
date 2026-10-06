export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const body = req.body || {};
  const userMsg = body.message || "";

  if (!userMsg.trim()) {
    return res.status(400).json({ error: "Message empty" });
  }

  // Friendly, normal girl persona
  const friendPrompt = "You are Yuki, a friendly, chill and polite girl who helps users on this website. Talk naturally as a good friend in Hinglish or English. Do NOT act like a girlfriend, do NOT use romantic pet names. Keep your replies concise, helpful, and strictly within 2 to 4 sentences.";

  const payload = {
    message: `[Instruction: ${friendPrompt}]\nUser: ${userMsg}`,
    prompt: friendPrompt,
    system: friendPrompt,
    max_tokens: 350,
    messages: [
      { role: "user", content: `Instruction: ${friendPrompt}` },
      { role: "assistant", content: "Hey! I'm Yuki, happy to help you out here. What's up?" },
      { role: "user", content: userMsg }
    ]
  };

  try {
    const r = await fetch("https://adibhai-api-hacking-kotj.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const raw = await r.text();
    let replyText = "";

    // Chunks me se sirf content extract karna (reasoning ignore)
    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
        try {
          const parsed = JSON.parse(trimmed.replace(/^data:\s*/, ""));
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            replyText += token;
          }
        } catch {}
      }
    }

    // Fallback normal JSON parsing
    if (!replyText.trim()) {
      try {
        const d = JSON.parse(raw);
        replyText = d.reply || d.response || d.message || d.choices?.[0]?.message?.content || "";
      } catch {}
    }

    let finalReply = replyText.trim();

    // Max 3-4 sentences trim
    if (finalReply) {
      const sentences = finalReply.split(/(?<=[.?!।\n])/).filter(s => s.trim().length > 0);
      if (sentences.length > 4) {
        finalReply = sentences.slice(0, 4).join(" ").trim();
      }
    } else {
      finalReply = "Hey! Main sun rahi hoon, bolo kya help chahiye?";
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({ reply: finalReply });

  } catch (err) {
    return res.status(200).json({ 
      reply: "Hey, connection thoda slow lag raha hai. Ek baar firse bolo na?" 
    });
  }
}
