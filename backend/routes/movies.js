const express = require('express');
const router = express.Router();
const { MOVIES_FILE, readJson, writeJson } = require('../utils/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    const movies = await readJson(MOVIES_FILE);
    res.json(movies);
});

router.post('/', auth, async (req, res) => {
    const { title, poster_url, preview_url } = req.body;
    const movies = await readJson(MOVIES_FILE);

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
    req.app.get('io').emit('movies_updated', movies);
    res.json({ message: "Film eklendi", movie: newMovie });
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
    req.app.get('io').emit('movies_updated', movies);
    res.json({ message: "Film silindi", id: idToDelete });
});

module.exports = router;
