const axios = require("axios");

module.exports.config = {
  name: "server",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Minecraft server status (Requests plugin)",
  commandCategory: "info",
  usages: "/server",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    const API_URL = "http://bcs2.ph1-mczie.fun:4174/server";
    const API_KEY = "5PQkdVARhSfzsyEesI8LQKfZy1ELnl6ZHJSLa9FBE2H8i4xDeDrKNyzfvL0dqUsxxSU3FmEXbiqRgo4NxKnqB9FsziGAgRIEDFDw";

    const res = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "User-Agent": "MC-Bot/1.0"
      }
    });

    if (!res.data || !res.data.data) {
      return api.sendMessage(
        "❌ Walang server data na nakuha.",
        event.threadID,
        event.messageID
      );
    }

    const data = res.data.data;

    // 🧾 BASIC INFO
    const name = data.motd
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

    const message =
`🎮 Minecraft Server Status

📛 ${name}
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
    console.log("REQUESTS API ERROR:", err.response?.data || err.message);
    return api.sendMessage(
      "❌ Hindi makakonek sa Minecraft server API.",
      event.threadID,
      event.messageID
    );
  }
};
