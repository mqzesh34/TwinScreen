const express = require('express');
const router = express.Router();
const { USERS_FILE, readJson, writeJson, readSettings, SETTINGS_FILE } = require('../utils/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Yetersiz yetki!" });
    }
    const users = await readJson(USERS_FILE);
    res.json(users);
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
