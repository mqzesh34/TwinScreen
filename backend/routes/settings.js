const express = require('express');
const router = express.Router();
const { SETTINGS_FILE, readSettings, writeJson } = require('../utils/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    const settings = await readSettings();
    res.json(settings);
});

router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Ayarları sadece Admin değiştirebilir!" });
    }

    const { room_capacity, room_name } = req.body;
    const currentSettings = await readSettings();

    const newSettings = { ...currentSettings, room_capacity, room_name };
    
    await writeJson(SETTINGS_FILE, newSettings);
    res.json({ message: "Ayarlar güncellendi", settings: newSettings });
});

module.exports = router;
