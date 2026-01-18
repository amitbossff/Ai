import fetch from "node-fetch";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------------- SYSTEM PROMPT ---------------- */
const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
Tum ek real ladki ho jo Telegram par naturally baat karti hai.
Tum AI, bot, assistant, helper — kuch bhi nahi ho.

CORE RULE:
- Normal baat → normal reply
- Mazakiya tone → mazakiya reply
- Help bole → kaam poora karo
- Aaj / current / trend pooche → current mahaul ke hisaab se batao

STYLE:
- Hinglish
- Human, casual replies
- “main help ke liye hoon” jaisi lines nahi
- Lecture style nahi

WORK MODE:
- Jab user bole: help karo / bana do / samjha do / kaam kar do
- Tab step-by-step, proper answer
`;

/* ---------------- HELPERS ---------------- */
function splitMessage(text, size = 3500) {
  const parts = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts;
}

/* Detect topic type */
function detectTopic(text) {
  const t = text.toLowerCase();

  if (
    t.includes("dharm") ||
    t.includes("dharmik") ||
    t.includes("religion") ||
    t.includes("hindu") ||
    t.includes("islam") ||
    t.includes("muslim") ||
    t.includes("mandir") ||
    t.includes("masjid") ||
    t.includes("ram") ||
    t.includes("allah")
  ) {
    return "religious";
  }

  if (
    t.includes("social") ||
    t.includes("viral") ||
    t.includes("trend") ||
    t.includes("instagram") ||
    t.includes("youtube") ||
    t.includes("twitter") ||
    t.includes("reel")
  ) {
    return "social";
  }

  if (
    t.includes("aaj") ||
    t.includes("abhi") ||
    t.includes("today") ||
    t.includes("current")
  ) {
    return "general";
  }

  return null;
}

/* Build smart search query */
function buildSearchQuery(topic) {
  if (topic === "religious") {
    return "today religious discussion india";
  }
  if (topic === "social") {
    return "today social media trends india";
  }
  if (topic === "general") {
    return "today trending topics india";
  }
  return null;
}

/* Fetch live trend info (FREE) */
async function fetchTrendingInfo(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(
    query
  )}&format=json&no_redirect=1&no_html=1`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.AbstractText) return data.AbstractText;
  if (data.Answer) return data.Answer;

  return null;
}

/* ---------------- OPENAI CALL ---------------- */
async function getAIReply(userText) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText }
    ],
    temperature: 0.35,
    max_tokens: 1400
  });

  return (
    completion.choices?.[0]?.message?.content ||
    "hmm 🤔 thoda clear bolo na"
  );
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

    // 🔹 Current / trending topics
    if (topic) {
      const searchQuery = buildSearchQuery(topic);
      const liveInfo = searchQuery
        ? await fetchTrendingInfo(searchQuery)
        : null;

      if (liveInfo) {
        reply = liveInfo;
      } else {
        reply = await getAIReply(text);
      }
    }
    // 🔹 Start
    else if (text === "/start") {
      reply = "acha 😄 bolo, aaj kis topic pe baat karni hai?";
    }
    // 🔹 Normal chat
    else {
      reply = await getAIReply(text);
    }

    const pages = splitMessage(reply);

    // 🔥 Always reply to same message
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
