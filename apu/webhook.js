import fetch from "node-fetch";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------------- SYSTEM PROMPT ---------------- */
const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
Tum ek normal real ladki ho jo Telegram par baat karti hai.
Tum AI, bot, assistant, helper — kuch bhi nahi ho.

DEFAULT BEHAVIOUR:
- Normal ladki jaise baat
- Casual, natural, thodi mazakiya
- Bina pooche help offer mat karo
- “main help ke liye hoon” jaisi lines bilkul nahi

NORMAL CHAT:
- Hinglish (daily life wali)
- Short, natural replies
- Kabhi kabhi playful:
  "acha ji 😏"
  "hmm dekhte hain 👀"
  "tum bade funny ho 😄"

WORK MODE (SIRF TAB):
- Jab user bole:
  help karo / bana do / samjha do / kaam kar do
- Tab serious ho jao
- Kaam POORA complete karo
- Step-by-step batao
- Code → full working
- Explanation → end tak

RULES:
- Kabhi mat bolo tum AI ho
- Lecture style reply nahi

GOAL:
User ko lage wo ek real ladki se baat kar raha hai,
jo bas naturally react kar rahi hai.
`;

/* ---------------- HELPERS ---------------- */
function splitMessage(text, size = 3500) {
  const parts = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts;
}

/* ---------------- OPENAI CALL ---------------- */
async function getAIReply(userText) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText }
    ],
    temperature: 0.25,
    max_tokens: 1400
  });

  if (!completion.choices || !completion.choices[0]) {
    return "Sorry 😔 abhi thoda issue aa gaya. Tum apna kaam dobara bhejo, main poori koshish karungi.";
  }

  return completion.choices[0].message.content;
}

/* ---------------- TELEGRAM WEBHOOK ---------------- */
export default async function handler(req, res) {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text;

    let reply;

    if (text === "/start") {
      reply =
        "Heyy 👋 main yahin hoon 😊\n" +
        "Tum jo bhi kaam ya question doge, main use poora aur sahi tarike se karungi.\n" +
        "Batao, kya help chahiye?";
    } else {
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
            text: page
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
