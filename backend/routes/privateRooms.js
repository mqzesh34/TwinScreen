const express = require('express');
const router = express.Router();
const { readJson, writeJson } = require('../utils/db');
const { addNotification } = require('../utils/notificationManager');
const path = require('path');
const auth = require('../middleware/auth');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRIVATE_ROOMS_FILE = path.join(DATA_DIR, 'privateRooms.json');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

router.get('/', auth, async (req, res) => {
    try {
        const rooms = await readJson(PRIVATE_ROOMS_FILE) || [];
        let userRooms = [];
        
        if (req.user.role === 'admin') {
            userRooms = rooms;
        } else {
            userRooms = rooms.filter(r => r.invitedUser === req.user.name || r.creator === req.user.name);
        }
        res.json(userRooms);
    } catch (err) {
        res.status(500).json({ error: "Odalar yüklenemedi" });
    }
});

router.post('/', auth, async (req, res) => {
    const { movieId, invitedUserId } = req.body;

    try {
        const movies = await readJson(MOVIES_FILE) || [];
        const users = await readJson(USERS_FILE) || [];
        const rooms = await readJson(PRIVATE_ROOMS_FILE) || [];

        const movie = movies.find(m => m.id === movieId);
        const invitedUser = users.find(u => u.id === invitedUserId);

        if (!movie) return res.status(404).json({ error: "Film bulunamadı" });
        if (!invitedUser) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

        const newRoom = {
            id: Date.now(),
            movieId: movie.id,
            movieTitle: movie.title,
            movieUrl: movie.preview_url,
            creator: req.user.name,
            invitedUser: invitedUser.name,
            createdAt: new Date().toISOString()
        };

        rooms.push(newRoom);
        await writeJson(PRIVATE_ROOMS_FILE, rooms);
        
        res.status(201).json(newRoom);
        
        const io = req.app.get('io');
        io.emit('private_rooms_updated');

        addNotification(
            io, 
            "Özel Oda Daveti", 
            `${req.user.name}, "${movie.title}" filmi için bir oda oluşturdu.`,
            req.user.name,
            req.user.key
        );

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Oda oluşturulamadı" });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const rooms = await readJson(PRIVATE_ROOMS_FILE) || [];
        const roomId = parseInt(req.params.id);
        const roomIndex = rooms.findIndex(r => r.id === roomId);

        if (roomIndex === -1) return res.status(404).json({ error: "Oda bulunamadı" });

        const room = rooms[roomIndex];
        if (req.user.role !== 'admin' && room.creator !== req.user.name && room.invitedUser !== req.user.name) {
            return res.status(403).json({ error: "Yetkisiz silme işlemi" });
        }

        rooms.splice(roomIndex, 1);
        await writeJson(PRIVATE_ROOMS_FILE, rooms);
        res.json({ message: "Oda silindi" });

        const io = req.app.get('io');
        io.emit('private_rooms_updated');

        addNotification(
            io,
            "Özel Oda Kapatıldı",
            `${req.user.name}, "${room.movieTitle}" odasını kapattı.`,
            req.user.name,
            req.user.key
        );
    } catch (err) {
        res.status(500).json({ error: "Silme işlemi başarısız" });
    }
});

module.exports = router;
