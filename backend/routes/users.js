const express = require('express');
const router = express.Router();
const { USERS_FILE, readJson, writeJson, readSettings, SETTINGS_FILE } = require('../utils/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    const users = await readJson(USERS_FILE);
    
    if (req.user.role === 'admin') {
        res.json(users);
    } else {
        const publicUsers = users.map(({ id, name, role }) => ({ id, name, role }));
        res.json(publicUsers);
    }
});

router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Yetersiz yetki!" });
    }
    
    const { users: newUsers } = req.body;
    const oldUsers = await readJson(USERS_FILE);
    const io = req.app.get('io');
    const settings = await readSettings();
    let settingsUpdated = false;

    const usedKeys = new Set();
    for (const u of newUsers) {
        if (usedKeys.has(u.key)) {
            return res.status(400).json({ error: `"${u.key}" anahtarı birden fazla kullanıcıda tanımlanmış. Her anahtar benzersiz olmalıdır.` });
        }
        usedKeys.add(u.key);
    }

    newUsers.forEach(newUser => {
        const oldUser = oldUsers.find(u => u.id === newUser.id);
        if (oldUser) {
            if (oldUser.key !== newUser.key || oldUser.name !== newUser.name) {
                io.to(`user:${oldUser.key}`).emit('force_logout', {
                    message: "Bilgileriniz yönetici tarafından güncellendi. Lütfen tekrar giriş yapın."
                });

                if (oldUser.key !== newUser.key && settings[oldUser.key]) {
                    settings[newUser.key] = settings[oldUser.key];
                    delete settings[oldUser.key];
                    settingsUpdated = true;
                }
            }
        }
    });

    await writeJson(USERS_FILE, newUsers);
    
    if (settingsUpdated) {
        await writeJson(SETTINGS_FILE, settings);
    }
    
    res.json({ message: "Kullanıcılar güncellendi" });
});

module.exports = router;
