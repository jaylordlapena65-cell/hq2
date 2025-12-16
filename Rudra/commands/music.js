const axios = require("axios");

module.exports.config = {
  name: "music",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Jaylord La Peña + ChatGPT",
  description: "Play music using KojaXD API (5-minute cooldown per user)",
  commandCategory: "music",
  usages: "/music <song>",
  cooldowns: 5
};

const COOLDOWN_MS = 5 * 60 * 1000;
let userCooldowns = {};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const query = args.join(" ");
  const now = Date.now();

  // ⏳ 5 MINUTES PER USER
  if (userCooldowns[senderID] && now - userCooldowns[senderID] < COOLDOWN_MS) {
    const remaining = Math.ceil(
      (COOLDOWN_MS - (now - userCooldowns[senderID])) / 60000
    );
    return api.sendMessage(
      `⏳ Please wait ${remaining} minute(s) before using /music again.`,
      threadID,
      messageID
    );
  }

  if (!query) {
    return api.sendMessage(
      "❌ Please provide a song title.\nExample: /music multo",
      threadID,
      messageID
    );
  }

  try {
    // 🎧 DIRECT AUDIO STREAM (NO JSON)
    const audioStream = await axios.get(
      "https://api.kojaxd.dpdns.org/play/youtube",
      {
        params: {
          apikey: "Koja",
          query
        },
        responseType: "stream" // 🔥 IMPORTANT
      }
    );

    api.sendMessage(
      {
        body: `🎶 ${query}`,
        attachment: audioStream.data
      },
      threadID
    );

    // start cooldown AFTER success
    userCooldowns[senderID] = now;

  } catch (err) {
    console.error("Music Error:", err.message);
    api.sendMessage(
      "⚠️ Failed to fetch music. Try again later.",
      threadID,
      messageID
    );
  }
};
