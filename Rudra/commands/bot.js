const axios = require("axios");

module.exports.config = {
  name: "sim",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Auto AI response when bot is mentioned (clean input + filtered output)",
  commandCategory: "no-prefix",
  usages: "",
  cooldowns: 0
};

module.exports.run = async function () {};

// ❌ BAD WORDS (for AI response)
const bannedWords = ["amp", "weh", "bobo", "tanga"];

// 🧹 FILTER AI RESPONSE
function filterResponse(text) {
  let result = text;
  bannedWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(regex, "*".repeat(word.length));
  });
  return result;
}

// 🧹 REMOVE BOT WORD FROM PROMPT
function cleanPrompt(text) {
  return text
    .replace(/\bbot\b/gi, "")
    .replace(/\bassistant\b/gi, "")
    .trim();
}

// 👇 AUTO LISTENER
module.exports.handleEvent = async function ({ api, event, Users }) {
  try {
    if (!event.body) return;

    // ❌ wag mag reply sa sarili
    if (event.senderID === api.getCurrentUserID()) return;

    const message = event.body.toLowerCase();

    // ✅ trigger words
    const triggers = ["bot", "assistant"];
    if (!triggers.some(word => message.includes(word))) return;

    const name = await Users.getNameUser(event.senderID);

    // 🧹 CLEAN PROMPT (tanggal "bot")
    const prompt = cleanPrompt(event.body);

    if (!prompt) return; // pag "bot" lang ang message

    const res = await axios.get(
      "https://norch-project.gleeze.com/api/sim",
      {
        params: {
          prompt: prompt,
          uid: event.senderID,
          name: name
        }
      }
    );

    if (!res.data || !res.data.reply) return;

    // 🧹 FILTER AI RESPONSE
    const cleanReply = filterResponse(res.data.reply);

    return api.sendMessage(
      cleanReply,
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.log("SIM ERROR:", err.message);
  }
};
