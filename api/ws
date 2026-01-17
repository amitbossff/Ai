import fetch from "node-fetch";
import OpenAI from "openai";

const BOT_USERNAME = "YourBotUsername"; // <-- EXACT bot username (without @)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------------- REAL GIRL SYSTEM PROMPT ---------------- */
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
  const out = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}

/* ---------------- OPENAI CALL ---------------- */
async function getAIReply(userText) {
  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText }
    ],
    temperature: 0.5,
    max_tokens: 1200
  });

  return res.choices?.[0]?.message?.content
    || "hmm 🤔 thoda ruk, phir se bolna";
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
      // Case 1: Mention
      if (text.includes(`@${BOT_USERNAME}`)) {
        shouldReply = true;
        cleanText = text.replace(`@${BOT_USERNAME}`, "").trim();
      }

      // Case 2: Reply to bot
      if (
        msg.reply_to_message &&
        msg.reply_to_message.from &&
        msg.reply_to_message.from.username === BOT_USERNAME
      ) {
        shouldReply = true;
      }
    }

    // ❌ Agar trigger nahi hua → ignore
    if (!shouldReply) return res.json({ ok: true });

    const replyText = await getAIReply(cleanText);
    const pages = splitMessage(replyText);

    for (const page of pages) {
      await fetch(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: page,
            // 🔥 ALWAYS reply to user message
            reply_to_message_id: msg.message_id
          })
        }
      );
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.json({ ok: true });
  }
}
