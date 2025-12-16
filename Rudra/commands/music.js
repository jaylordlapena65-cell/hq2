const axios = require("axios");

module.exports.config = {
  name: "music",
  version: "1.0.3",
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

  // ⏳ Cooldown check
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
    // 🎧 KojaXD API request
    const res = await axios.get(
      `https://api.kojaxd.dpdns.org/play/youtube`,
      {
        params: {
          apikey: "Koja",
          query: query
        }
      }
    );

    console.log("KojaXD API Response:", res.data);

    if (!res.data || !res.data.status || !res.data.result) {
      return api.sendMessage("⚠️ No results found.", threadID, messageID);
    }

    const music = res.data.result;

    if (!music.audio) {
      return api.sendMessage("⚠️ Audio not available for this song.", threadID, messageID);
    }

    const infoMsg =
`🎧 Now Playing:
${music.title}

👤 Artist: ${music.author}
⏱ Duration: ${music.duration}
👀 Views: ${music.views?.toLocaleString() || "N/A"}
📺 YouTube: ${music.url}

🎵 Downloading audio, please wait...`;

    api.sendMessage(
      {
        body: infoMsg,
        attachment: await getStreamFromURL(music.thumbnail)
      },
      threadID,
      async () => {
        try {
          const audioStream = await axios.get(music.audio, {
            responseType: "stream"
          });

          api.sendMessage(
            {
              body: `🎶 ${music.title}`,
              attachment: audioStream.data
            },
            threadID
          );

          userCooldowns[senderID] = now;
        } catch (err) {
          console.error("Audio Stream Error:", err);
          api.sendMessage("❌ Failed to stream audio.", threadID);
        }
      }
    );

  } catch (err) {
    console.error("KojaXD API Error:", err);
    api.sendMessage("⚠️ Error fetching music. Try again later.", threadID, messageID);
  }
};

// 🖼 Thumbnail stream helper
async function getStreamFromURL(url) {
  const res = await axios.get(url, { responseType: "stream" });
  return res.data;
}
