const webpush = require("web-push");
const path = require("path");
const fs = require("fs");

const CONFIG_FILE = path.join(__dirname, "../data/config.json");
const SUBSCRIPTIONS_FILE = path.join(__dirname, "../data/subscriptions.json");

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));

if (config.VAPID_EMAIL && config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY && config.VAPID_PUBLIC_KEY !== "change") {
  try {
    webpush.setVapidDetails(
      config.VAPID_EMAIL,
      config.VAPID_PUBLIC_KEY,
      config.VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.error("❌ Failed to set VAPID details:", err.message);
  }
} else {
  console.warn(
    "⚠️ Push notification config is missing or invalid. VAPID details not set."
  );
}

// Helper: JSON dosyasını oku/yaz
const readSubscriptions = () => {
  try {
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
};

const writeSubscriptions = (subs) => {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
};

// Yeni abonelik ekle
const addSubscription = (subscription, userName) => {
  const subs = readSubscriptions();
  // Varsa güncelle, yoksa ekle (endpoint ile kontrol)
  const existingIndex = subs.findIndex(
    (s) => s.endpoint === subscription.endpoint
  );

  const subData = { ...subscription, userName };

  if (existingIndex !== -1) {
    subs[existingIndex] = subData;
  } else {
    subs.push(subData);
  }

  writeSubscriptions(subs);
  return true;
};

// Abonelik sil
const removeSubscription = (endpoint) => {
  let subs = readSubscriptions();
  const intialLength = subs.length;
  subs = subs.filter((s) => s.endpoint !== endpoint);

  if (subs.length !== intialLength) {
    writeSubscriptions(subs);
    return true;
  }
  return false;
};

// Herkese bildirim gönder
const sendToAll = async (payload) => {
  const subs = readSubscriptions();
  await sendNotifications(subs, payload);
};

// Belirli bir kullanıcıya bildirim gönder
const sendToUser = async (userName, payload) => {
  const subs = readSubscriptions().filter(s => s.userName === userName);
  if (subs.length === 0) return false;
  await sendNotifications(subs, payload);
  return true;
};

// Helper: Bildirimleri toplu gönder
const sendNotifications = async (subs, payload) => {
  const notificationPayload = JSON.stringify(payload);

  const promises = subs.map((sub) =>
    webpush.sendNotification(sub, notificationPayload).catch((error) => {
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log("Abonelik geçersiz, siliniyor:", sub.endpoint);
        return { delete: true, endpoint: sub.endpoint };
      }
      console.error("Bildirim hatası:", error);
      return null;
    })
  );

  const results = await Promise.all(promises);
  
  const toDelete = results.filter((r) => r && r.delete).map((r) => r.endpoint);
  if (toDelete.length > 0) {
    const allSubs = readSubscriptions();
    const newSubs = allSubs.filter((s) => !toDelete.includes(s.endpoint));
    writeSubscriptions(newSubs);
  }
};

module.exports = {
  addSubscription,
  removeSubscription,
  sendToAll,
  sendToUser,
  getPublicKey: () => config.VAPID_PUBLIC_KEY,
};
