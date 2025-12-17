const axios = require("axios");

module.exports.config = {
  name: "server",
  version: "1.1.0",
  hasPermission: 0,
  credits: "ChatGPT",
  description: "Check Minecraft server status (MCZIE Panel)",
  commandCategory: "minecraft",
  usages: "/server",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  const PANEL_URL = process.env.PANEL_URL;
  const API_KEY = process.env.PANEL_API_KEY;
  const SERVER_ID = process.env.SERVER_ID;

  if (!PANEL_URL || !API_KEY || !SERVER_ID) {
    return api.sendMessage(
      "❌ Kulang ang PANEL_URL / PANEL_API_KEY / SERVER_ID sa Render.",
      threadID,
      messageID
    );
  }

  try {
    // 🔹 SERVER INFO
    const info = await axios.get(
      `${PANEL_URL}/api/client/servers/${SERVER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    // 🔹 SERVER RESOURCES (ONLINE, RAM, CPU)
    const resources = await axios.get(
      `${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const server = info.data.attributes;
    const stats = resources.data.attributes;

    const status = stats.current_state;
    const emoji = status === "running" ? "🟢" : "🔴";

    const ram = (stats.resources.memory_bytes / 1024 / 1024).toFixed(0);
    const ramLimit = (stats.limits.memory / 1024).toFixed(0);

    const cpu = stats.resources.cpu_absolute.toFixed(1);

    const uptime = Math.floor(stats.resources.uptime / 1000);

    const message =
`${emoji} SERVER STATUS

📛 Name: ${server.name}
⚙️ Status: ${status.toUpperCase()}

🧠 RAM: ${ram}MB / ${ramLimit}MB
🔥 CPU: ${cpu}%
⏱️ Uptime: ${uptime}s
`;

    return api.sendMessage(message, threadID, messageID);

  } catch (err) {
    console.log("SERVER ERROR:", err.response?.data || err.message);
    return api.sendMessage(
      "❌ Hindi maka-connect sa panel API.\nSiguraduhin tama ang API KEY at SERVER ID.",
      threadID,
      messageID
    );
  }
};
