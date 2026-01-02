const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function readJson(file) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch { return []; }
}

async function readSettings() {
    try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch { 
        return { room_capacity: 2, room_name: "Sinema Odası" };
    }
}

async function writeJson(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function ensureDataDir() {
    try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR); }
}

module.exports = {
    USERS_FILE,
    MOVIES_FILE,
    SETTINGS_FILE,
    readJson,
    readSettings,
    writeJson,
    ensureDataDir
};
