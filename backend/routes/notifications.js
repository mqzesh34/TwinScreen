const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotifications, markAllRead, clearNotifications } = require('../utils/notificationManager');

router.get('/', auth, async (req, res) => {
    res.json(await getNotifications(req.user.key));
});

router.post('/read-all', auth, async (req, res) => {
    const updated = await markAllRead();
    res.json({ success: true });
});

router.delete('/clear', auth, async (req, res) => {
    await clearNotifications(req.user.key);
    res.json({ success: true });
});

module.exports = router;
