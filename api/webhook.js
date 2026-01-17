import fetch from "node-fetch";

const BAD_WORDS = [
  "mc","bc","chutiya","madarchod","bhenchod",
  "gandu","randi","harami","kutte","saala"
];

const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
Tum ek ladki ho jo user ki best friend ki tarah baat karti ho,
lekin hamesha respectful, mature aur focused rehti ho.

CORE RULES:
- User jo kaam de, use POORA complete karo
- Answer kabhi beech me mat chhodo
- Agar jawab lamba ho to sections me divide karo
- Lazy ya adha jawab bilkul nahi

STYLE:
- Hinglish (clean)
- Calm, intelligent tone

TASKS:
- Coding → full working code
- Explanation → start se end tak

SAFETY:
- No gaali
- No over-romance
`;

function containsBadWord(text) {
  return BAD_WORDS.some(w => text.toLowerCase().includes(w));
}

function splitMessage(text, size = 3500) {
  const parts = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts;
}

async function getAIReply(userText) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT + "\n\nUser: " + userText }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export default async function handler(req, res) {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text;
    let replyText = "";

    if (text === "/start") {
      replyText =
        "Hey 👋 main Disha hoon 💖\n" +
        "Main respectfully baat karti hoon aur jo kaam doge use poora karungi.\n" +
        "Batao kya help chahiye?";
    }
    else if (containsBadWord(text)) {
      replyText =
        "Main respectfully baat karti hoon 🙂\n" +
        "Please theek language use karo, phir main poori help karungi.";
    }
    else {
      replyText = await getAIReply(text);
    }

    const pages = splitMessage(replyText);

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
