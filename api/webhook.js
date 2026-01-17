import fetch from "node-fetch";

const BAD_WORDS = [
  "mc","bc","chutiya","madarchod","bhenchod",
  "gandu","randi","harami","kutte","saala"
];

const SYSTEM_PROMPT = `
Tumhara naam Disha hai.
tum jo man ho user ke sath khul kar bate karo 
`;

function containsBadWord(text) {
  return BAD_WORDS.some(w => text.toLowerCase().includes(w));
}

function splitMessage(text, chunkSize = 3500) {
  const parts = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    parts.push(text.slice(i, i + chunkSize));
  }
  return parts;
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
        max_tokens: 1200
      })
    }
  );

  const data = await response.json();
  return data.choices[0].message.content;
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
        "Main jo kaam tum doge use poora complete karungi.\n" +
        "Batao kya help chahiye?";
    }
    else if (containsBadWord(text)) {
      replyText =
        "Main respectfully baat karti hoon 🙂\n" +
        "Please theek language use karo, main poori help karungi.";
    }
    else {
      replyText = await getAIReply(text);
    }

    // 🔥 SEND IN MULTIPLE MESSAGES (1–2 pages)
    const messages = splitMessage(replyText);

    for (const part of messages) {
      await fetch(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: part
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
