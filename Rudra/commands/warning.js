const { setData, getData } = require("../../database.js");

// CONFIG
const OWNER_UID = "61559999326713";
const MAX_DISPLAY_ADMINS = 5;
const WARN_LIMIT = 3;

// PROTECTED USERS
const PROTECTED_UIDS = [
  "61559999326713",
  "61554885397487",
  "61563731477181"
];

// BAD WORDS
const badwords = [
  "tanga","bobo","gago","puta","pakyu","inutil","ulol",
  "fuck","shit","asshole","bitch","dumb","stupid","motherfucker",
  "laplap","pota","inamo","tangina","tang ina","kantut","kantot",
  "jakol","jakul","jabol","supot","blow job","blowjob","puke","puki"
];

const racistWords = [
  "negro","nigger","chimp","nigga","baluga",
  "chink","indio","bakla","niga","bungal","beki","negra"
];

const allowedLinks = [
  "facebook.com","fb.com","facebook.com/groups","fb.com/groups",
  "tiktok.com","youtube.com","youtu.be","roblox.com"
];

const messages = {
  badword: [
    "Please maintain respect in this group.",
    "Offensive words are not tolerated here.",
    "Language matters. Kindly watch your words."
  ],
  racist: [
    "Racist or discriminatory remarks are strictly prohibited.",
    "Respect diversity. Avoid racist language."
  ],
  link: [
    "Unauthorized links are not allowed in this group.",
    "Please refrain from sharing suspicious links."
  ]
};

// HELPERS
const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

async function getUserName(uid, api) {
  try {
    const info = await api.getUserInfo(uid);
    return info?.[uid]?.name || `FB-User(${uid})`;
  } catch {
    return `FB-User(${uid})`;
  }
}

function formatWarning(name, type, note, count) {
  return `╭━[⚠️ WARNING]━╮
┃ 👤 User: ${name}
┃ 🚫 Violation: ${type}
┃ 📝 Note: ${note}
┃ ⚠️ Warnings: ${count}/${WARN_LIMIT}
╰━━━━━━━━━━━━━━╯`;
}

// 🔥 CORE FIX FUNCTION
async function addWarning(api, threadID, targetID, type, note, actorID, replyID) {
  const botID = api.getCurrentUserID();
  if (PROTECTED_UIDS.includes(targetID) || targetID === botID) {
    return api.sendMessage("🚫 Protected user.", threadID, replyID);
  }

  const dataPath = `warnings/${threadID}/${targetID}`;
  let warnings = await getData(dataPath);

  // ✅ FULL SAFETY INITIALIZATION
  if (!warnings || typeof warnings !== "object") {
    warnings = { count: 0, reasons: [] };
  }
  if (!Array.isArray(warnings.reasons)) {
    warnings.reasons = [];
  }

  warnings.count += 1;
  warnings.reasons.push({
    type,
    note,
    by: actorID || "auto",
    time: Date.now()
  });

  await setData(dataPath, warnings);

  const allPath = `warnings/${threadID}/_all`;
  let all = (await getData(allPath)) || [];
  if (!Array.isArray(all)) all = [];
  if (!all.includes(targetID)) {
    all.push(targetID);
    await setData(allPath, all);
  }

  const name = await getUserName(targetID, api);
  const warnMsg = formatWarning(name, type, note, warnings.count);
  await api.sendMessage(warnMsg, threadID, replyID);

  // 🚫 AUTO KICK
  if (warnings.count >= WARN_LIMIT) {
    try {
      await api.removeUserFromGroup(targetID, threadID);
      await api.sendMessage(
        `🚫 ${name} has been kicked (Reached ${WARN_LIMIT} warnings).`,
        threadID
      );

      await setData(dataPath, { count: 0, reasons: [] });
      await setData(allPath, all.filter(id => id !== targetID));
    } catch (e) {
      console.error("Kick failed:", e);
    }
  }
}

// CONFIG
module.exports.config = {
  name: "warning",
  version: "6.5.1",
  hasPermission: 1,
  credits: "Jaylord + ChatGPT",
  description: "Auto + manual warning system (fixed)",
  commandCategory: "system",
  usages: "/warning list | reset | @mention reason",
  cooldowns: 3
};

// 🧠 AUTO DETECTION
module.exports.handleEvent = async ({ api, event }) => {
  try {
    const { threadID, senderID, body, messageID } = event;
    if (!body) return;

    const botID = api.getCurrentUserID();
    if (PROTECTED_UIDS.includes(senderID) || senderID === botID) return;

    const text = body.toLowerCase();
    const words = text.replace(/[^\w\s]/g, "").split(/\s+/);

    if (badwords.some(w => words.includes(w))) {
      await addWarning(api, threadID, senderID, "Bad Language", pickRandom(messages.badword), null, messageID);
    }

    if (racistWords.some(w => words.includes(w))) {
      await addWarning(api, threadID, senderID, "Racist Term", pickRandom(messages.racist), null, messageID);
    }

    if (/https?:\/\/|www\./i.test(text)) {
      const allowed = allowedLinks.some(l => text.includes(l));
      if (!allowed) {
        await addWarning(api, threadID, senderID, "Unauthorized Link", pickRandom(messages.link), null, messageID);
      }
    }

  } catch (err) {
    console.error("handleEvent error:", err);
  }
};

// 💬 COMMAND
module.exports.run = async ({ api, event, args }) => {
  try {
    const { threadID, messageID, senderID, mentions } = event;
    const sub = args[0]?.toLowerCase();

    if (sub === "list") {
      const all = (await getData(`warnings/${threadID}/_all`)) || [];
      if (!all.length)
        return api.sendMessage("✅ No warnings in this GC.", threadID, messageID);

      let msg = "📋 Warning List:\n\n";
      for (const uid of all) {
        const data = await getData(`warnings/${threadID}/${uid}`);
        if (data?.count > 0) {
          const name = await getUserName(uid, api);
          msg += `• ${name}: ${data.count}\n`;
        }
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    if (mentions && Object.keys(mentions).length) {
      const targetID = Object.keys(mentions)[0];
      const reason = args.slice(1).join(" ").trim();
      if (!reason)
        return api.sendMessage("⚠️ Please add reason.", threadID, messageID);

      return addWarning(api, threadID, targetID, "Manual Warning", reason, senderID, messageID);
    }

    return api.sendMessage(
      "📘 Usage:\n• /warning @user reason\n• /warning list",
      threadID,
      messageID
    );

  } catch (err) {
    console.error("run error:", err);
  }
};
