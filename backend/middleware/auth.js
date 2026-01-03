const jwt = require('jsonwebtoken');
const { USERS_FILE, readJson } = require('../utils/db');
const config = require('../data/config.json');

const auth = async (req, res, next) => {
    let token = req.headers['authorization']?.split(' ')[1] || req.headers['x-api-key'];
    
    if (!token) {
        return res.status(401).json({ error: "Erişim engellendi! Geçerli bir anahtar gereklidir." });
    }
    try {
        let userKey;
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            userKey = decoded.key;
        } catch (e) {
            userKey = token;
        }

        const users = await readJson(USERS_FILE);
        const user = users.find(u => u.key === userKey);

        if (!user) {
            return res.status(403).json({ error: "Geçersiz yetki!" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Oturum geçersiz!" });
    }
};

module.exports = auth;
