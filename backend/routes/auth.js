const express = require('express');
const router = express.Router();
const { USERS_FILE, readJson } = require('../utils/db');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../data/config.json');

router.post('/login', async (req, res) => {
    const { key } = req.body;
    const users = await readJson(USERS_FILE);
    const user = users.find(u => u.key === key);

    if (user) {
        const token = jwt.sign({ key: user.key, name: user.name, role: user.role }, config.JWT_SECRET);
        res.json({ 
            success: true, 
            token,
            name: user.name, 
            role: user.role,
            message: `Hoş geldin ${user.name}` 
        });
    } else {
        res.status(401).json({ success: false, error: "Hatalı anahtar!" });
    }
});

router.get('/validate-key', auth, async (req, res) => {
    const token = jwt.sign({ key: req.user.key, name: req.user.name, role: req.user.role }, config.JWT_SECRET);
    res.json({ 
        success: true, 
        token,
        name: req.user.name, 
        role: req.user.role 
    });
});

module.exports = router;
