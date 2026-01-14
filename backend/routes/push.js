const express = require('express');
const router = express.Router();
const pushUtils = require('../utils/push');
const auth = require('../middleware/auth');

router.get('/key', (req, res) => {
    res.json({ publicKey: pushUtils.getPublicKey() });
});

router.post('/subscribe', auth, (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Geçersiz abonelik objesi' });
    }
    
    pushUtils.addSubscription(subscription, req.user.name);
    res.status(201).json({ message: 'Başarıyla abone olundu' });
});

router.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint gerekli' });
    }
    pushUtils.removeSubscription(endpoint);
    res.json({ message: 'Abonelik silindi' });
});

module.exports = router;
