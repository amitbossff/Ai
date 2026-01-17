import fetch from "node-fetch";

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

/* ---------------- GROQ CALL ---------------- */
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
        temperature: 0.25,
        max_tokens: 1400
      })
    }
  );

  const data = await response.json();

  return data?.choices?.[0]?.message?.content
    || "hmm 🤔 thoda ruk, phir se bolna";
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
      reply = "Heyy 😊 bolo, kya chal raha hai?";
    } else {
      reply = await getAIReply(text);
    }

    const pages = splitMessage(reply);

    // 🔥 ALWAYS REPLY TO USER MESSAGE
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
