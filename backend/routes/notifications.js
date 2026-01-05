const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotifications, markAllRead, clearNotifications } = require('../utils/notificationManager');

router.get('/', auth, (req, res) => {
    res.json(getNotifications(req.user.key));
});

router.post('/read-all', auth, (req, res) => {
    const updated = markAllRead();
    res.json({ success: true });
});

router.delete('/clear', auth, (req, res) => {
    clearNotifications(req.user.key);
    res.json({ success: true });
});

module.exports = router;
