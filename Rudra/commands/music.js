const axios = require("axios");

module.exports.config = {
  name: "music",
  version: "1.0.5",
  hasPermission: 0,
  credits: "Jaylord La Peña + ChatGPT",
  description: "Play music using KojaXD API (5-minute cooldown per user)",
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
      "❌ Please provide a song title.\nExample: /music Multo",
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

    if (!res.data || res.data.status !== true || !res.data.data) {
      return api.sendMessage("⚠️ No results found.", threadID, messageID);
    }

    const music = res.data.data;

    if (!music.audio) {
      return api.sendMessage("⚠️ Audio not available.", threadID, messageID);
    }

    // ✅ SEARCH QUERY AS TITLE
    api.sendMessage(
      {
        body: `🎶 ${query}`,
        attachment: await getStreamFromURL(music.audio)
      },
      threadID
    );

    userCooldowns[senderID] = now;

  } catch (err) {
    console.error("Music Error:", err);
    api.sendMessage("⚠️ Failed to fetch music.", threadID, messageID);
  }
};

async function getStreamFromURL(url) {
  const res = await axios.get(url, { responseType: "stream" });
  return res.data;
}
