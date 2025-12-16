const axios = require("axios");

module.exports.config = {
  name: "music",
  version: "1.0.6",
  hasPermission: 0,
  credits: "Jaylord La Peña + ChatGPT",
  description: "Play music using KojaXD API",
  commandCategory: "music",
  usages: "/music <song title>",
  cooldowns: 5
};

const COOLDOWN_MS = 5 * 60 * 1000;
let userCooldowns = {};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const query = args.join(" ");
  const now = Date.now();

  // ⏳ Cooldown
  if (userCooldowns[senderID] && now - userCooldowns[senderID] < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - userCooldowns[senderID])) / 60000);
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
    const res = await axios.get(
      "https://api.kojaxd.dpdns.org/play/youtube",
      {
        params: {
          apikey: "Koja",
          query
        }
      }
    );

    // 🔍 Debug (pwede mo alisin pag ok na)
    console.log("RAW API RESPONSE:\n", JSON.stringify(res.data, null, 2));

    // ✅ FLEXIBLE RESPONSE HANDLING
    const music =
      res.data?.data ||
      res.data?.result ||
      res.data;

    if (!music || !music.audio) {
      return api.sendMessage("⚠️ Music not found.", threadID, messageID);
    }

    // 🎶 SEND MUSIC (SEARCH = TITLE)
    const audioStream = await axios.get(music.audio, {
      responseType: "stream"
    });

    api.sendMessage(
      {
        body: `🎶 ${query}`,
        attachment: audioStream.data
      },
      threadID
    );

    userCooldowns[senderID] = now;

  } catch (err) {
    console.error("Music Error:", err.response?.data || err.message);
    api.sendMessage("⚠️ Error fetching music.", threadID, messageID);
  }
};
