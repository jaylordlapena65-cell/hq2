const axios = require("axios");

module.exports.config = {
  name: "sim",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Auto AI response when bot is mentioned",
  commandCategory: "no-prefix",
  usages: "",
  cooldowns: 0
};

module.exports.run = async function () {};

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

    const res = await axios.get(
      "https://norch-project.gleeze.com/api/sim",
      {
        params: {
          prompt: event.body,
          uid: event.senderID,
          name: name
        }
      }
    );

    if (!res.data || !res.data.reply) return;

    return api.sendMessage(
      res.data.reply,
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.log("SIM ERROR:", err.message);
  }
};
