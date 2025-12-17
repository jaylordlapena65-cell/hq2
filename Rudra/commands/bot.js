const axios = require("axios");

module.exports.config = {
  name: "sim",
  version: "1.0.4",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Auto AI response when bot is mentioned (no filter)",
  commandCategory: "no-prefix",
  usages: "",
  cooldowns: 0
};

module.exports.run = async function () {};

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

    // 🧹 CLEAN PROMPT
    const prompt = cleanPrompt(event.body);
    if (!prompt) return;

    const res = await axios.get(
      "https://urangkapolka.vercel.app/api/simsimi",
      {
        params: {
          query: prompt
        }
      }
    );

    if (!res.data || !res.data.result || !res.data.result.reply) return;

    return api.sendMessage(
      res.data.result.reply,
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.log("SIM ERROR:", err.message);
  }
};
