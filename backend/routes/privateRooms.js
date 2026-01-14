const express = require('express');
const router = express.Router();
const { readJson, writeJson, PRIVATE_ROOMS_FILE, MOVIES_FILE, USERS_FILE, PLAYBACK_STATE_FILE } = require('../utils/db');
const { SOCKET_EVENTS } = require('../utils/constants');
const auth = require('../middleware/auth');

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

router.get('/last-watched', auth, async (req, res) => {
    try {
        const rooms = await readJson(PRIVATE_ROOMS_FILE) || [];
        const playback = await readJson(PLAYBACK_STATE_FILE) || {};
        const movies = await readJson(MOVIES_FILE) || [];

        const userRooms = rooms.filter(r => r.invitedUser === req.user.name || r.creator === req.user.name);
        if (userRooms.length === 0) return res.json(null);

        let lastRoom = null;
        let lastTime = -1;

        userRooms.forEach(room => {
            const state = playback[`private_${room.id}`];
            if (state && state.lastUpdated > lastTime) {
                lastTime = state.lastUpdated;
                lastRoom = { ...room, playback: state };
            }
        });

        if (!lastRoom) return res.json(null);

        const movie = movies.find(m => m.id === lastRoom.movieId);
        if (movie) lastRoom.poster_url = movie.poster_url;

        res.json(lastRoom);
    } catch (err) {
        res.status(500).json({ error: "Veri çekilemedi" });
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
        io.emit(SOCKET_EVENTS.PRIVATE_ROOMS_UPDATED);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Oda oluşturulamadı" });
    }
});

router.delete('/', auth, async (req, res) => {
    try {
        const rooms = await readJson(PRIVATE_ROOMS_FILE) || [];
        
        const userRooms = rooms.filter(r => r.invitedUser === req.user.name || r.creator === req.user.name);
        
        if (userRooms.length === 0) {
            return res.status(404).json({ error: "Silecek oda bulunamadı" });
        }

        const remainingRooms = rooms.filter(r => r.invitedUser !== req.user.name && r.creator !== req.user.name);

        await writeJson(PRIVATE_ROOMS_FILE, remainingRooms);
        res.json({ message: `${userRooms.length} oda silindi` });

        const io = req.app.get('io');
        io.emit(SOCKET_EVENTS.PRIVATE_ROOMS_UPDATED);

    } catch (err) {
        res.status(500).json({ error: "Silme işlemi başarısız" });
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
        io.emit(SOCKET_EVENTS.PRIVATE_ROOMS_UPDATED);

    } catch (err) {
        res.status(500).json({ error: "Silme işlemi başarısız" });
    }
});

module.exports = router;
