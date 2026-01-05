const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { ensureDataDir } = require('./utils/db');
const { addNotification } = require('./utils/notificationManager');
const config = require('./data/config.json');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const settingRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

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

io.on('connection', (socket) => {
    const token = socket.handshake.auth.token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            const userKeyRoom = `user:${decoded.key}`;
            
            socket.userData = {
                name: decoded.name,
                key: decoded.key
            };

            socket.join(userKeyRoom);
            console.log(`🟢 [KATILDI] ${socket.userData.name}`);

            socket.on("send_message", (messageData) => {
                io.emit("receive_message", messageData);
                addNotification(io, "Yeni Mesaj", `${messageData.text}`, socket.userData.name, socket.userData.key);
            });

            socket.on("play_video", (data) => {
                socket.broadcast.emit("play_video", data);
            });

            socket.on("pause_video", (data) => {
                socket.broadcast.emit("pause_video", data);
            });

            socket.on("seek_video", (data) => {
                socket.broadcast.emit("seek_video", data);
            });

            socket.on("change_movie", (movieTitle) => {
                io.emit("change_movie", movieTitle);
            });
        } catch (err) {
            console.log('⚠️ Geçersiz token');
        }
    }

    socket.on('disconnect', () => {
        if (socket.userData) {
            console.log(`🔴 [AYRILDI] ${socket.userData.name}`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
});