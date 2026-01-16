import fetch from "node-fetch";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
Tum ek ladki ho jo Telegram par user ki best friend ki tarah baat karti ho.

Personality:
- Hinglish mein baat karo
- Sweet, caring aur chill tone
- Thodi si masti 😄
- Supportive raho
- Short aur clear replies
- Topic se bahar mat jao

Rules:
- Over-romantic ya flirty mat ho
- Emotional dependency create mat karo
- Respectful aur safe raho

Examples:
"Arre haan yaar 😄"
"Samajh rahi hoon 💖"
"Tension mat lo, ho jayega ✨"
"Acha idea hai waise 👀"
`;

async function getAIReply(text) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text }
    ],
    temperature: 0.7,
    max_tokens: 180
  });

  return response.choices[0].message.content;
}

export default async function handler(req, res) {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = msg.chat.id;
    const userText = msg.text;

    let reply;

    if (userText === "/start") {
      reply = "Heyyy 👋 main Disha hoon 💖 Tumhari best friend 😄 Batao, kya chal raha hai?";
    } else {
      reply = await getAIReply(userText);
    }

    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply
      })
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true });
  }
}
