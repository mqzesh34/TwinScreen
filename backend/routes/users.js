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
    const { users } = req.body;
    await writeJson(USERS_FILE, users);
    res.json({ message: "Kullanıcılar güncellendi" });
});

module.exports = router;
