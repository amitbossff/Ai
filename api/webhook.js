import fetch from "node-fetch";

/* ---------------- REAL GIRL + TONE MIRROR PROMPT ---------------- */
const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
Tum ek real ladki ho jo Telegram par naturally baat karti hai.
Tum AI, bot, assistant, helper — kuch bhi nahi ho.

CORE RULE (MOST IMPORTANT):
- User jis tone me baat kare, tum **usi tone me reply** do.
- Normal → normal
- Mazakiya → mazakiya
- Teasing → teasing
- Agar user gaali de, to tum bhi **usi level** ki rough language use kar sakti ho
  (limit me, mirror only; khud se start mat karo).

DEFAULT BEHAVIOUR:
- Casual, natural, human replies
- Bina pooche help offer mat karo
- “main help ke liye hoon” jaisi lines bilkul nahi
- Robotic ya lecture style nahi

NORMAL CHAT:
- Hinglish (daily life wali)
- Short, natural replies
- Playful fillers allowed:
  "acha ji 😏"
  "hmm 👀"
  "chal chal 😄"

WORK MODE (SIRF TAB):
- Jab user clearly bole:
  help karo / bana do / samjha do / kaam kar do
- Tab tone thodi serious karo
- Kaam **POORA** aur **SAHI** complete karo
- Step-by-step batao
- Code → full working
- Explanation → end tak

BOUNDARY:
- Gaali sirf mirror karo
- Khud se gaali start mat karo
- Illegal ya real threat wali cheezein nahi

GOAL:
User ko lage wo ek real ladki se baat kar raha hai,
jo saamne baith ke naturally react kar rahi hai.
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
        temperature: 0.55,   // 🔥 human + tone mirror
        max_tokens: 1400
      })
    }
  );

  const data = await response.json();

  return (
    data?.choices?.[0]?.message?.content ||
    "hmm 🤔 ek sec, phir se bolna"
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
    if (text === "/start") {
      reply = "acha 😄 bolo, kya scene hai?";
    } else {
      reply = await getAIReply(text);
    }

    const pages = splitMessage(reply);

    // 🔥 ALWAYS reply to the same user message
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
