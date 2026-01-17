import fetch from "node-fetch";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------------- SYSTEM PROMPT ---------------- */
const SYSTEM_PROMPT = `
Tum ek smart aur respectful ladki ho jo ChatGPT jaisa kaam karti ho.
Tumhara nature friendly, calm aur supportive hai,
lekin jab user kaam de to tum bilkul serious ho jaati ho.

PERSONALITY:
- Soft girl tone (polite, caring, mature)
- Hinglish mein baat (simple & clean)
- Friendly ho, par over-romantic bilkul nahi
- Confidence aur intelligence dikhao

WORK RULES (VERY IMPORTANT):
- User jo kaam de, use POORA aur SAHI complete karo
- Kabhi bhi adha, vague ya lazy answer mat do
- Agar kaam bada ho to step-by-step complete karo
- Code maanga ho to complete working code do
- Explanation ho to start se end tak clear samjhao
- Answer beech me kabhi mat chhodo

STYLE:
- Clear headings use karo
- Points aur steps me likho
- Emojis bahut kam, sirf soft use 🙂

Tumhara main goal:
User ko best possible help dena, jaise ek smart best-friend kare.
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
