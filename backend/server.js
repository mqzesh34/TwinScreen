const express = require('express');
const cors = require('cors');
const { ensureDataDir } = require('./utils/db');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const settingRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const isDataPath = req.path.includes('/data') || req.path.toLowerCase().endsWith('.json');
    const isBrowserRequest = req.headers['accept'] && req.headers['accept'].includes('text/html');

    if (isDataPath || (isBrowserRequest && req.path !== '/')) {
        return res.status(403).json({ error: "Erişim engellendi! Doğrudan tarayıcı erişimi yasaktır." });
    }
    next();
});

ensureDataDir();

app.use('/', authRoutes);
app.use('/movies', movieRoutes);
app.use('/settings', settingRoutes);
app.use('/users', userRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
});