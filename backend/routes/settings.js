const express = require('express');
const router = express.Router();
const { SETTINGS_FILE, readSettings, writeJson } = require('../utils/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    const allSettings = await readSettings();
    const userSettings = allSettings[req.user.key] || { platform: "none", notifications: true };
    if (userSettings.notifications === undefined) userSettings.notifications = true;
    res.status(200).json(userSettings);
});

router.post('/', auth, async (req, res) => {
    const { platform, notifications } = req.body;
    const allSettings = await readSettings();
    
    allSettings[req.user.key] = { platform, notifications };
    
    await writeJson(SETTINGS_FILE, allSettings);
    res.status(200).json({ message: "Ayarlar güncellendi" });
});

module.exports = router;
