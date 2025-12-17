const axios = require("axios");

module.exports.config = {
  name: "server",
  version: "1.0.0",
  hasPermission: 0,
  credits: "ChatGPT",
  description: "Check Pterodactyl Client API connection",
  commandCategory: "minecraft",
  usages: "/server",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  // 🔧 CONFIG (pwede mo ilipat sa env kung gusto mo)
  const PANEL_URL = "https://srv.mcziehost.fun";
  const API_KEY = "ptlc_A1NKxUqf01Q0wJ4z8azwTcZbWGItRm2Uud0zuCKxNIT"; // ⚠️ palitan mo

  try {
    const res = await axios.get(
      `${PANEL_URL}/api/client`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        timeout: 15000
      }
    );

    if (!res.data || !res.data.data) {
      return api.sendMessage(
        "❌ Walang data na nakuha sa API.",
        threadID,
        messageID
      );
    }

    const servers = res.data.data;

    if (!servers.length) {
      return api.sendMessage(
        "⚠️ Connected sa API pero walang server sa account.",
        threadID,
        messageID
      );
    }

    let msg = `✅ API CONNECTED\n\n📦 Servers found: ${servers.length}\n\n`;

    servers.forEach((s, i) => {
      const a = s.attributes;
      msg +=
        `${i + 1}. ${a.name}\n` +
        `🆔 ID: ${a.identifier}\n\n`;
    });

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.log("API ERROR:", err.response?.data || err.message);

    return api.sendMessage(
      "❌ Hindi maka-connect sa Client API.\n" +
      "Possible causes:\n" +
      "- Mali ang API key\n" +
      "- Cloudflare blocking datacenter IP\n" +
      "- Client API disabled sa panel",
      threadID,
      messageID
    );
  }
};
