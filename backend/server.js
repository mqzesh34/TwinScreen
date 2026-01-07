const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { ensureDataDir } = require('./utils/db');
const config = require('./data/config.json');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const settingRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const privateRoomRoutes = require('./routes/privateRooms');

const setupSocketHandlers = require('./services/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUT"]
    }
});

const PORT = config.PORT;

app.use(cors());
app.use(express.json());
app.set('io', io);

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
app.use('/notifications', notificationRoutes);
app.use('/private-rooms', privateRoomRoutes);

setupSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
});