const { getData, setData } = require("../../database.js");

module.exports.config = {
  name: "ip",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Show Minecraft server IP (Firebase only)",
  commandCategory: "info",
  usages: "/ip | /ip add <message>",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {

  // 🔧 ADD MODE
  if (args[0] === "add") {
    const newMessage = args.slice(1).join(" ");

    if (!newMessage) {
      return api.sendMessage(
        "❌ Usage: /ip add <message>",
        event.threadID,
        event.messageID
      );
    }

    await setData("/ipMessage", {
      text: newMessage,
      updatedBy: event.senderID,
      updatedAt: Date.now()
    });

    return api.sendMessage(
      "✅ IP message saved to Firebase.",
      event.threadID,
      event.messageID
    );
  }

  // 📡 SHOW IP (Firebase ONLY)
  const ipData = await getData("/ipMessage");

  if (!ipData || !ipData.text) {
    return api.sendMessage(
      "⚠️ Walang IP message na naka-save sa database.",
      event.threadID,
      event.messageID
    );
  }

  return api.sendMessage(
    ipData.text,
    event.threadID,
    event.messageID
  );
};
