const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const DB_FILES = {
    USERS: path.join(DATA_DIR, 'users.json'),
    MOVIES: path.join(DATA_DIR, 'movies.json'),
    SETTINGS: path.join(DATA_DIR, 'settings.json'),
    CONFIG: path.join(DATA_DIR, 'config.json'),
    PRIVATE_ROOMS: path.join(DATA_DIR, 'privateRooms.json'),
    PLAYBACK_STATE: path.join(DATA_DIR, 'playbackState.json')
};

const DEFAULT_CONTENTS = {
    [DB_FILES.USERS]: [],
    [DB_FILES.MOVIES]: [],
    [DB_FILES.SETTINGS]: {},

    [DB_FILES.PRIVATE_ROOMS]: [],
    [DB_FILES.PLAYBACK_STATE]: {
        public: {
            videoId: "",
            time: 0,
            isPlaying: false,
            lastUpdated: Date.now()
        }
    }
};

async function readJson(file) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch { 
        return Array.isArray(DEFAULT_CONTENTS[file]) ? [] : (DEFAULT_CONTENTS[file] || {}); 
    }
}

async function writeJson(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function ensureDataDir() {
    try {
        if (!fsSync.existsSync(DATA_DIR)) {
            await fs.mkdir(DATA_DIR, { recursive: true });
        }

        for (const [file, content] of Object.entries(DEFAULT_CONTENTS)) {
            if (!fsSync.existsSync(file)) {
                await writeJson(file, content);
            }
        }
    } catch (err) {
        console.error("[DB] Initialization Error:", err.message);
    }
}

async function readSettings() {
    return readJson(DB_FILES.SETTINGS);
}

module.exports = {
    ...DB_FILES,
    USERS_FILE: DB_FILES.USERS,
    MOVIES_FILE: DB_FILES.MOVIES,
    SETTINGS_FILE: DB_FILES.SETTINGS,
    CONFIG_FILE: DB_FILES.CONFIG,

    PRIVATE_ROOMS_FILE: DB_FILES.PRIVATE_ROOMS,
    PLAYBACK_STATE_FILE: DB_FILES.PLAYBACK_STATE,
    readJson,
    writeJson,
    ensureDataDir,
    readSettings,
    DATA_DIR
};
