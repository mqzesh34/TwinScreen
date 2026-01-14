const express = require('express');
const router = express.Router();
const { writeJson, readJson, USERS_FILE, CONFIG_FILE } = require('../utils/db');
const webPush = require('web-push');

router.get('/status', async (req, res) => {
    try {
        const config = await readJson(CONFIG_FILE);
        res.json({ 
            isInstalled: config.isInstalled || false,
            appName: config.appName || "TwinScreen",
            config: {
                PORT: config.PORT,
                JWT_SECRET: config.JWT_SECRET,
                VAPID_EMAIL: config.VAPID_EMAIL,
                VAPID_PUBLIC_KEY: config.VAPID_PUBLIC_KEY,
                VAPID_PRIVATE_KEY: config.VAPID_PRIVATE_KEY
            }
        });
    } catch (err) {
        res.json({ isInstalled: false, appName: "TwinScreen" });
    }
});

router.get('/generate-keys', (req, res) => {
    const vapidKeys = webPush.generateVAPIDKeys();
    res.json(vapidKeys);
});

router.post('/', async (req, res) => {
    try {
        const config = await readJson(CONFIG_FILE);

        if (config.isInstalled) {
            return res.status(403).json({ error: "Sistem zaten kurulu." });
        }

        const { 
            adminName, 
            adminKey, 
            appName, 
            users,
            advancedConfig 
        } = req.body;

        if (!adminName || !adminKey) {
            return res.status(400).json({ error: "Yönetici bilgileri eksik." });
        }

        const allUsers = [];
        const usedKeys = new Set();

        allUsers.push({
            id: Date.now(),
            name: adminName,
            key: adminKey,
            role: 'admin'
        });
        usedKeys.add(adminKey);

        if (users && Array.isArray(users)) {
            for (let i = 0; i < users.length; i++) {
                const u = users[i];
                if (u.name && u.key) {
                    if (usedKeys.has(u.key)) {
                        return res.status(400).json({ 
                            error: `"${u.key}" anahtarı zaten admin veya başka bir kullanıcı tarafında kullanılıyor. Her anahtar benzersiz olmalıdır.` 
                        });
                    }
                    allUsers.push({
                        id: Date.now() + i + 1,
                        name: u.name,
                        key: u.key,
                        role: 'user'
                    });
                    usedKeys.add(u.key);
                }
            }
        }

        await writeJson(USERS_FILE, allUsers);

        config.isInstalled = true;
        config.appName = appName || "TwinScreen";
        
        if (advancedConfig) {
            if (advancedConfig.PORT) config.PORT = parseInt(advancedConfig.PORT);
            if (advancedConfig.JWT_SECRET) config.JWT_SECRET = advancedConfig.JWT_SECRET;
            if (advancedConfig.VAPID_EMAIL) config.VAPID_EMAIL = advancedConfig.VAPID_EMAIL;
            if (advancedConfig.VAPID_PUBLIC_KEY) config.VAPID_PUBLIC_KEY = advancedConfig.VAPID_PUBLIC_KEY;
            if (advancedConfig.VAPID_PRIVATE_KEY) config.VAPID_PRIVATE_KEY = advancedConfig.VAPID_PRIVATE_KEY;
        }

        await writeJson(CONFIG_FILE, config);

        res.json({ message: "Kurulum başarıyla tamamlandı. Sunucu yeniden başlatılıyor..." });

        setTimeout(() => {
            process.exit(0);
        }, 1000);
    } catch (err) {
        console.error("Kurulum hatası:", err);
        res.status(500).json({ error: "Kurulum sırasında bir hata oluştu." });
    }
});

module.exports = router;
