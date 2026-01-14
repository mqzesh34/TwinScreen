const express = require('express');
const router = express.Router();
const { USERS_FILE, readJson } = require('../utils/db');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../data/config.json');

router.post('/login', async (req, res) => {
    try {
        const { key } = req.body;
        const users = await readJson(USERS_FILE);
        const user = users.find(u => u.key === key);

        if (user) {
            if (!config.JWT_SECRET) {
                throw new Error("JWT_SECRET yapılandırılmamış!");
            }

            const token = jwt.sign({ key: user.key, name: user.name, role: user.role }, config.JWT_SECRET);
            res.json({ 
                success: true, 
                token,
                key: user.key,
                name: user.name, 
                role: user.role,
                message: `Hoş geldin ${user.name}` 
            });
        } else {
            res.status(401).json({ success: false, error: "Hatalı anahtar!" });
        }
    } catch (err) {
        console.error("Login hatası:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/validate-key', auth, async (req, res) => {
    try {
        const token = jwt.sign({ key: req.user.key, name: req.user.name, role: req.user.role }, config.JWT_SECRET);
        res.json({ 
            success: true, 
            token,
            key: req.user.key,
            name: req.user.name, 
            role: req.user.role 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
