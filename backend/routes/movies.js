const express = require('express');
const router = express.Router();
const { readJson, writeJson, MOVIES_FILE } = require('../utils/db');
const auth = require('../middleware/auth');
const pushUtils = require('../utils/push');
const { SOCKET_EVENTS } = require('../utils/constants');

router.get('/', auth, async (req, res) => {
    const movies = await readJson(MOVIES_FILE);
    res.json(movies);
});

router.post('/', auth, async (req, res) => {
    const { title, poster_url, preview_url } = req.body;
    const { isPlaylistUrl, extractPlaylistId, getPlaylistVideos } = require('../utils/youtube');
    
    try {
        let movies = await readJson(MOVIES_FILE);
        const io = req.app.get('io');
        
        if (isPlaylistUrl(preview_url)) {
            const playlistId = extractPlaylistId(preview_url);
            
            if (!playlistId) {
                return res.status(400).json({ error: "Geçersiz playlist URL'si" });
            }
            
            const playlistVideos = await getPlaylistVideos(playlistId);
            
            if (!playlistVideos || playlistVideos.length === 0) {
                return res.status(404).json({ error: "Playlist'te video bulunamadı" });
            }

            if (req.body.clear_existing === true) {
                if (req.user.role === 'admin') {
                    movies = [];
                } else {
                    console.warn(`User ${req.user.name} tried to clear movies but is not admin.`);
                }
            }
            
            const addedMovies = [];
            for (const video of playlistVideos) {
                const newMovie = {
                    id: Date.now() + Math.random(),
                    title: video.title,
                    poster_url: video.thumbnail,
                    preview_url: `https://www.youtube.com/watch?v=${video.videoId}`,
                    added_by: req.user.name,
                    added_at: new Date().toISOString()
                };
                movies.unshift(newMovie);
                addedMovies.push(newMovie);
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            await writeJson(MOVIES_FILE, movies);
            io.emit(SOCKET_EVENTS.MOVIES_UPDATED, movies);
            
            pushUtils.sendToAll({
                title: 'Yeni Playlist! 🎬',
                body: `${req.user.name}, ${playlistVideos.length} yeni video ekledi!`,
                url: '/'
            }).catch(e => console.error("Push Error:", e));
            
            return res.json({ 
                message: `${playlistVideos.length} video eklendi`, 
                movies: addedMovies,
                isPlaylist: true 
            });
        } else {
            const newMovie = {
                id: Date.now(),
                title,
                poster_url,
                preview_url,
                added_by: req.user.name,
                added_at: new Date().toISOString()
            };

            movies.unshift(newMovie);
            await writeJson(MOVIES_FILE, movies);
            
            io.emit(SOCKET_EVENTS.MOVIES_UPDATED, movies);
            
            pushUtils.sendToAll({
                title: 'Yeni Film! 🎬',
                body: `${req.user.name}, "${title}" filmini ekledi!`,
                url: '/'
            }).catch(e => console.error("Push Error (Single):", e));
            
            return res.json({ message: "Film eklendi", movie: newMovie });
        }
    } catch (error) {
        console.error('Film ekleme hatası:', error);
        return res.status(500).json({ error: error.message || "Film eklenirken bir hata oluştu" });
    }
});

router.delete('/', auth, async (req, res) => {
    try {
        let movies = await readJson(MOVIES_FILE);
        const userMovies = movies.filter(m => m.added_by === req.user.name);
        
        if (userMovies.length === 0) {
            return res.status(404).json({ error: "Silecek film bulunamadı" });
        }

        const remainingMovies = movies.filter(m => m.added_by !== req.user.name);
        await writeJson(MOVIES_FILE, remainingMovies);
        
        const io = req.app.get('io');
        io.emit(SOCKET_EVENTS.MOVIES_UPDATED, remainingMovies);
        
        res.json({ message: "Eklediğiniz tüm filmler silindi", count: userMovies.length });
    } catch (error) {
        res.status(500).json({ error: "Silme işlemi başarısız" });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const idToDelete = parseInt(req.params.id);
    let movies = await readJson(MOVIES_FILE);
    
    const movieToDelete = movies.find(m => m.id === idToDelete);
    if (!movieToDelete) return res.status(404).json({ error: "Film bulunamadı" });

    if (req.user.role !== 'admin' && movieToDelete.added_by !== req.user.name) {
        return res.status(403).json({ error: "Bu filmi silme yetkiniz yok!" });
    }

    const initialLength = movies.length;
    movies = movies.filter(movie => movie.id !== idToDelete);

    if (movies.length === initialLength) return res.status(404).json({ error: "Bulunamadı" });

    await writeJson(MOVIES_FILE, movies);
    
    const io = req.app.get('io');
    io.emit(SOCKET_EVENTS.MOVIES_UPDATED, movies);
    res.json({ message: "Film silindi", id: idToDelete });
});

module.exports = router;
