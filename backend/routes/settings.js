const express = require('express');
const router = express.Router();
const { SETTINGS_FILE, readSettings, writeJson } = require('../utils/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    const allSettings = await readSettings();
    const userSettings = allSettings[req.user.key] || { notifications: false };
    if (userSettings.notifications === undefined) userSettings.notifications = false;
    res.status(200).json(userSettings);
});

router.post('/', auth, async (req, res) => {
    const { notifications } = req.body;
    const allSettings = await readSettings();
    
    // Preserve existing settings if any, but override notifications
    // Actually simplicity is better: just store what we care about now
    // But safely we should probably keep other potential keys if they existed? 
    // The previous code was: allSettings[req.user.key] = { platform, notifications };
    // This overwrote everything for that user key. So I will keep that behavior but without platform.
    
    allSettings[req.user.key] = { notifications };
    
    await writeJson(SETTINGS_FILE, allSettings);
    res.status(200).json({ message: "Ayarlar güncellendi" });
});

module.exports = router;
