import fetch from "node-fetch";
import OpenAI from "openai";

const BOT_USERNAME = "YourBotUsername"; // <-- yahan apna bot username daalo

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
    const chatType = msg.chat.type; // private | group | supergroup
    const text = msg.text;

    let shouldReply = false;
    let cleanText = text;

    // ✅ Private chat → always reply
    if (chatType === "private") {
      shouldReply = true;
    }

    // ✅ Group / Supergroup logic
    if (chatType === "group" || chatType === "supergroup") {
      // Case 1: Bot mentioned
      if (text.includes(`@${BOT_USERNAME}`)) {
        shouldReply = true;
        cleanText = text.replace(`@${BOT_USERNAME}`, "").trim();
      }

      // Case 2: Reply to bot message
      if (
        msg.reply_to_message &&
        msg.reply_to_message.from &&
        msg.reply_to_message.from.username === BOT_USERNAME
      ) {
        shouldReply = true;
      }
    }

    // ❌ Agar reply nahi karna → exit
    if (!shouldReply) {
      return res.json({ ok: true });
    }

    let reply;
    if (cleanText === "/start") {
      reply =
        "Heyy 👋 main yahin hoon 😊\n" +
        "Tum jo bhi kaam ya question doge, main use poora aur sahi tarike se karungi.\n" +
        "Batao, kya help chahiye?";
    } else {
      reply = await getAIReply(cleanText);
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
            reply_to_message_id:
              chatType !== "private" ? msg.message_id : undefined
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
