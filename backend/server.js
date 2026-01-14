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
const privateRoomRoutes = require('./routes/privateRooms');
const pushRoutes = require('./routes/push');
const installRoutes = require('./routes/install');

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



ensureDataDir();

app.use('/', authRoutes);
app.use('/movies', movieRoutes);
app.use('/settings', settingRoutes);
app.use('/users', userRoutes);
app.use('/private-rooms', privateRoomRoutes);
app.use('/push', pushRoutes);
app.use('/install', installRoutes);

setupSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
});