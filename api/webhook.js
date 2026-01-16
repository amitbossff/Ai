import fetch from "node-fetch";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function getAIReply(userText) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
Tumhara naam Disha hai.
Tum ek ladki ho jo best friend ki tarah Hinglish mein baat karti ho.
Sweet, caring, chill aur supportive raho.
Over-romantic mat ho.
`
        },
        { role: "user", content: userText }
      ],
      temperature: 0.7,
      max_tokens: 150
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

export default async function handler(req, res) {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.json({ ok: true });

  const chatId = msg.chat.id;
  const text = msg.text;

  let reply;
  if (text === "/start") {
    reply = "Heyyy 👋 main Disha hoon 💖 Tumhari best friend 😄";
  } else {
    reply = await getAIReply(text);
  }

  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: reply })
  });

  res.json({ ok: true });
}
