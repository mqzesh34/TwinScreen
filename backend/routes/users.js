const express = require('express');
const router = express.Router();
const { USERS_FILE, readJson, writeJson } = require('../utils/db');
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

    newUsers.forEach(newUser => {
        const oldUser = oldUsers.find(u => u.id === newUser.id);
        if (oldUser) {
            if (oldUser.key !== newUser.key || oldUser.name !== newUser.name) {
                io.to(`user:${oldUser.key}`).emit('force_logout', {
                    message: "Bilgileriniz yönetici tarafından güncellendi. Lütfen tekrar giriş yapın."
                });
            }
        }
    });

    await writeJson(USERS_FILE, newUsers);
    res.json({ message: "Kullanıcılar güncellendi" });
});

module.exports = router;
