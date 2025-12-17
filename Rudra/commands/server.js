const axios = require("axios");

module.exports.config = {
  name: "server",
  version: "1.0.0",
  hasPermission: 0,
  credits: "ChatGPT",
  description: "Check Minecraft server status",
  commandCategory: "minecraft",
  usages: "/server",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  // 🔑 galing sa Render Environment Variables
  const PANEL_URL = process.env.PANEL_URL;
  const API_KEY = process.env.PANEL_API_KEY;

  if (!PANEL_URL || !API_KEY) {
    return api.sendMessage(
      "❌ Kulang ang PANEL_URL o PANEL_API_KEY sa Render.",
      threadID,
      messageID
    );
  }

  try {
    // 📡 tawag sa Pterodactyl API
    const res = await axios.get(
      `${PANEL_URL}/api/client`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json"
        }
      }
    );

    const servers = res.data.data;
    if (!servers || !servers.length) {
      return api.sendMessage(
        "❌ Walang server na makita sa panel.",
        threadID,
        messageID
      );
    }

    // 👉 first server lang
    const server = servers[0].attributes;

    const status = server.status || "offline";
    const emoji = status === "running" ? "🟢" : "🔴";

    return api.sendMessage(
      `${emoji} SERVER STATUS\n\n` +
      `📌 Name: ${server.name}\n` +
      `⚙️ Status: ${status.toUpperCase()}`,
      threadID,
      messageID
    );

  } catch (err) {
    console.log("SERVER ERROR:", err.response?.data || err.message);
    return api.sendMessage(
      "❌ Hindi maka-connect sa panel API.",
      threadID,
      messageID
    );
  }
};
