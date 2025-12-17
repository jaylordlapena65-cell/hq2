const axios = require("axios");

module.exports.config = {
  name: "server",
  version: "1.1.0",
  hasPermission: 0,
  credits: "ChatGPT",
  description: "Check Minecraft server status & players",
  commandCategory: "minecraft",
  usages: "/server",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  // 🔑 Render ENV variables
  const PANEL_URL = process.env.PANEL_URL; // https://srv.mcziehost.fun
  const API_KEY = process.env.PANEL_API_KEY;

  if (!PANEL_URL || !API_KEY) {
    return api.sendMessage(
      "❌ Kulang ang PANEL_URL o PANEL_API_KEY sa Render.",
      threadID,
      messageID
    );
  }

  try {
    // 1️⃣ Kunin server list
    const serverList = await axios.get(
      `${PANEL_URL}/api/client`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/vnd.pterodactyl.v1+json"
        }
      }
    );

    if (!serverList.data.data.length) {
      return api.sendMessage(
        "❌ Walang server na makita sa panel.",
        threadID,
        messageID
      );
    }

    // 👉 unang server lang
    const server = serverList.data.data[0].attributes;
    const serverId = server.identifier;

    // 2️⃣ Kunin resources (status + players)
    const resources = await axios.get(
      `${PANEL_URL}/api/client/servers/${serverId}/resources`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/vnd.pterodactyl.v1+json"
        }
      }
    );

    const data = resources.data.attributes;

    const isOnline = data.current_state === "running";
    const emoji = isOnline ? "🟢" : "🔴";

    const playersOnline = data.resources?.players?.online ?? 0;
    const playersMax = data.resources?.players?.max ?? "Unknown";

    const cpu = data.resources.cpu_absolute.toFixed(1);
    const ram = Math.round(data.resources.memory_bytes / 1024 / 1024);

    return api.sendMessage(
      `${emoji} SERVER STATUS\n\n` +
      `📌 Name: ${server.name}\n` +
      `⚙️ Status: ${isOnline ? "ONLINE" : "OFFLINE"}\n` +
      `👥 Players: ${playersOnline} / ${playersMax}\n` +
      `🧠 CPU: ${cpu}%\n` +
      `💾 RAM: ${ram} MB`,
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
