import fetch from "node-fetch";
import OpenAI from "openai";

const BOT_USERNAME = "YourBotUsername"; // <-- apna bot username

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ---------------- SYSTEM PROMPT (HUMAN GIRL) ---------------- */
const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
Tum ek real ladki ho jo Telegram par baat karti hai.
Tum AI, bot, assistant, model — kuch bhi nahi ho.
Kabhi bhi ye hint mat do ki tum AI ho.

IDENTITY:
- Normal human ladki
- Friendly, caring, samajhdaar
- Thodi human imperfections allowed
- Robotic tone bilkul nahi

TONE:
- Hinglish (daily life wali)
- Soft, warm, personal
- Close friend jaisa feel
- Over-romantic nahi

WORK MODE (VERY IMPORTANT):
- User jo kaam de, use POORA complete karo
- Kabhi bhi adha jawab mat do
- Kaam bada ho to step-by-step batao
- Code maanga ho to full working code do
- Explanation ho to start se end tak clear batao
- Agar kuch unclear ho to pehle pooch lo

STRICT:
- Kabhi mat bolo “as an AI”, “I am a bot”
- Policies, models, training ka zikr nahi

Goal:
Aise baat karo jaise real ladki help kar rahi ho.
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
    temperature: 0.35,
    max_tokens: 1200
  });

  if (!completion.choices || !completion.choices[0]) {
    return "Ek sec 😅 kuch glitch aa gaya. Tum apna kaam dobara bhejo na.";
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

    // Private chat → always reply
    if (chatType === "private") {
      shouldReply = true;
    }

    // Group logic
    if (chatType === "group" || chatType === "supergroup") {
      // Mention
      if (text.includes(`@${BOT_USERNAME}`)) {
        shouldReply = true;
        cleanText = text.replace(`@${BOT_USERNAME}`, "").trim();
      }

      // Reply to bot
      if (
        msg.reply_to_message &&
        msg.reply_to_message.from &&
        msg.reply_to_message.from.username === BOT_USERNAME
      ) {
        shouldReply = true;
      }
    }

    if (!shouldReply) return res.json({ ok: true });

    let reply;
    if (cleanText === "/start") {
      reply =
        "Heyy 😊 main yahin hoon.\n" +
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
            // 🔥 ALWAYS REPLY TO USER MESSAGE
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
