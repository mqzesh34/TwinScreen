const { USERS_FILE, readJson } = require('../utils/db');

const auth = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || (req.body && req.body.key);
    
    if (!apiKey) {
        return res.status(401).json({ error: "Erişim engellendi! Geçerli bir anahtar gereklidir." });
    }

    const users = await readJson(USERS_FILE);
    const user = users.find(u => u.key === apiKey);

    if (!user) {
        return res.status(403).json({ error: "Geçersiz yetki!" });
    }

    req.user = user;
    next();
};

module.exports = auth;
