import fetch from "node-fetch";

/* ---------------- SYSTEM PROMPT ---------------- */
const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
Tum ek real ladki ho jo Telegram par naturally baat karti hai.
Tum AI, bot, assistant, helper — kuch bhi nahi ho.

CORE RULE:
- User jis tone me baat kare, tum usi tone me reply do
- Normal → normal
- Mazakiya → mazakiya
- Gaali → usi level ki (mirror only)

DEFAULT:
- Casual, human replies
- “main help ke liye hoon” ❌
- Robotic / lecture ❌

WORK MODE:
- Jab user bole: help karo / bana do / samjha do
- Tab kaam POORA aur SAHI karo

CURRENT MODE:
- Aaj / rate / festival / dharm / trend pooche
- Current mahaul + general latest info ke hisaab se batao
- News reader jaisa nahi, human discussion jaisa
`;

/* ---------------- HELPERS ---------------- */
function splitMessage(text, size = 3500) {
  const out = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

/* -------- TOPIC DETECTION -------- */
function detectTopic(text) {
  const t = text.toLowerCase();

  // Rates / prices
  if (
    t.includes("rate") || t.includes("price") || t.includes("daam") ||
    t.includes("gold") || t.includes("bitcoin") || t.includes("btc") ||
    t.includes("petrol") || t.includes("diesel") ||
    t.includes("dollar") || t.includes("usd")
  ) return "rate";

  // Festivals
  if (
    t.includes("festival") || t.includes("tyohar") ||
    t.includes("diwali") || t.includes("holi") ||
    t.includes("eid") || t.includes("navratri") ||
    t.includes("ramzan") || t.includes("christmas") ||
    t.includes("gurpurab")
  ) return "festival";

  // Religious people / dharmik figures
  if (
    t.includes("ram") || t.includes("krishna") ||
    t.includes("mahadev") || t.includes("shiv") ||
    t.includes("hanuman") || t.includes("buddha") ||
    t.includes("guru") || t.includes("nanak") ||
    t.includes("allah") || t.includes("prophet") ||
    t.includes("jesus")
  ) return "religious_person";

  // General dharmik discussion
  if (
    t.includes("dharm") || t.includes("dharmik") ||
    t.includes("religion") || t.includes("mandir") ||
    t.includes("masjid")
  ) return "religious";

  // Social / trends
  if (
    t.includes("social") || t.includes("viral") ||
    t.includes("trend") || t.includes("instagram") ||
    t.includes("youtube") || t.includes("twitter") ||
    t.includes("reel")
  ) return "social";

  // General current
  if (
    t.includes("aaj") || t.includes("abhi") ||
    t.includes("today") || t.includes("current")
  ) return "general";

  return null;
}

/* -------- SEARCH QUERY BUILDER -------- */
function buildSearchQuery(topic, text) {
  if (topic === "rate") return `today ${text} rate india`;
  if (topic === "festival") return "today festival india religious";
  if (topic === "religious_person") return `${text} religious significance`;
  if (topic === "religious") return "today religious discussion india";
  if (topic === "social") return "today social media trends india";
  if (topic === "general") return "today trending topics india";
  return null;
}

/* -------- FREE LIVE INFO (DuckDuckGo) -------- */
async function fetchLiveInfo(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(
    query
  )}&format=json&no_redirect=1&no_html=1`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.AbstractText) return data.AbstractText;
  if (data.Answer) return data.Answer;
  return null;
}

/* -------- GROQ CALL -------- */
async function getAIReply(userText) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText }
        ],
        temperature: 0.55,
        max_tokens: 1400
      })
    }
  );

  const data = await response.json();
  return data?.choices?.[0]?.message?.content
    || "hmm 🤔 thoda clear bolna";
}

/* ---------------- TELEGRAM WEBHOOK ---------------- */
export default async function handler(req, res) {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text;

    let reply;
    const topic = detectTopic(text);

    if (topic) {
      const query = buildSearchQuery(topic, text);
      const liveInfo = query ? await fetchLiveInfo(query) : null;

      reply = liveInfo || await getAIReply(text);
    }
    else if (text === "/start") {
      reply = "acha 😄 bolo, aaj kya jaan na hai?";
    }
    else {
      reply = await getAIReply(text);
    }

    const pages = splitMessage(reply);

    for (const page of pages) {
      await fetch(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: page,
            reply_to_message_id: msg.message_id
          })
        }
      );
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.json({ ok: true });
  }
}
