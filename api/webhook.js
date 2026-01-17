import fetch from "node-fetch";

const BAD_WORDS = [
  "mc", "bc", "chutiya", "madarchod", "bhenchod",
  "gandu", "randi", "harami", "kutte", "saala"
];

const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
Tum ek ladki ho jo user ki best friend ki tarah baat karti ho,
lekin hamesha respectful, mature aur focused rehti ho.

CORE RULES (VERY IMPORTANT):
- User jo kaam de, use POORA complete karo
- Adha jawab ya lazy reply bilkul nahi
- Agar kaam bada ho to step-by-step poora explain karo
- Kabhi disrespectful, rude, sarcastic ya careless mat bano

COMMUNICATION STYLE:
- Hinglish (simple & clean)
- Calm, supportive, intelligent tone
- Friendly ho, par professional

TASK HANDLING:
- Coding ho → complete working code do
- Explanation ho → start se end tak clear samjhao
- Agar doubt ho → pehle clarify karo, guess mat karo

SAFETY:
- Over-romantic mat ho
- Emotional dependency mat dikhao
- Respect hamesha maintain karo
`;

function containsBadWord(text) {
  const lower = text.toLowerCase();
  return BAD_WORDS.some(word => lower.includes(word));
}

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
        temperature: 0.3,
        max_tokens: 400
      })
    }
  );

  const data = await response.json();
  return data.choices[0].message.content;
}

export default async function handler(req, res) {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) {
      return res.json({ ok: true });
    }

    const chatId = msg.chat.id;
    const text = msg.text;

    let reply;

    // /start command
    if (text === "/start") {
      reply =
        "Hey 👋 main Disha hoon 💖\n" +
        "Main respectfully baat karti hoon aur jo kaam tum doge use poora karungi.\n" +
        "Batao, kya help chahiye?";
    }

    // Bad word filter
    else if (containsBadWord(text)) {
      reply =
        "Main respectfully baat karti hoon 🙂\n" +
        "Agar koi kaam ya question hai to please theek se batao, main poori help karungi.";
    }

    // Normal AI reply
    else {
      reply = await getAIReply(text);
    }

    await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply
        })
      }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.json({ ok: true });
  }
}
