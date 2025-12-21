const axios = require("axios");
const https = require("https");

module.exports.config = {
  name: "server",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Minecraft server status using Requests plugin",
  commandCategory: "info",
  usages: "/server",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    // 🔗 API SETTINGS
    const API_URL = "http://bcs2.ph1-mczie.fun:4174/server";
    const API_KEY = "PUT_YOUR_API_KEY_HERE";

    // 🔐 FIX SSL / CERT / TIMEOUT
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    // 📡 REQUEST
    const res = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "User-Agent": "MC-Bot/1.0"
      },
      timeout: 10000,
      httpsAgent: agent
    });

    // ❌ INVALID RESPONSE
    if (!res.data || !res.data.data) {
      return api.sendMessage(
        "❌ Walang data na nakuha mula sa Minecraft server.",
        event.threadID,
        event.messageID
      );
    }

    const data = res.data.data;

    // 🧾 SERVER INFO
    const serverName = data.motd
      ? data.motd.replace(/§.|&./g, "")
      : data.name;

    const version = data.version;

    // 👥 PLAYERS
    const online = data.players.playerCount.online;
    const max = data.players.playerCount.max;

    // ⚡ TPS
    const tps1 = data.health.tps.oneMinute.toFixed(2);
    const tps5 = data.health.tps.fiveMinutes.toFixed(2);
    const tps15 = data.health.tps.fifteenMinutes.toFixed(2);

    // 🧠 MEMORY (MB)
    const memUsed =
      (data.health.memory.maxMemory - data.health.memory.freeMemory) / 1024 / 1024;
    const memMax =
      data.health.memory.maxMemory / 1024 / 1024;

    // 🌍 DIMENSIONS
    const nether = data.dimension.allowNether ? "✅" : "❌";
    const end = data.dimension.allowEnd ? "✅" : "❌";

    // 📩 MESSAGE
    const message =
`🎮 Minecraft Server Status

📛 ${serverName}
🧩 Version: ${version}

👥 Players: ${online}/${max}

⚡ TPS
• 1m: ${tps1}
• 5m: ${tps5}
• 15m: ${tps15}

🧠 RAM: ${memUsed.toFixed(0)}MB / ${memMax.toFixed(0)}MB

🌍 Nether: ${nether}
🌋 End: ${end}
`;

    return api.sendMessage(message, event.threadID, event.messageID);

  } catch (err) {
    // 🧪 FULL DEBUG
    console.log("==== REQUESTS API ERROR ====");
    console.log("CODE:", err.code);
    console.log("MESSAGE:", err.message);
    console.log("RESPONSE:", err.response?.data);
    console.log("============================");

    return api.sendMessage(
      "❌ Hindi makakonek sa Minecraft server API.\nCheck console logs.",
      event.threadID,
      event.messageID
    );
  }
};
