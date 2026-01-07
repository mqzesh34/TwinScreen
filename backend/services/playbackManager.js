const fs = require('fs');
const { PLAYBACK_STATE_FILE } = require('../utils/db');

const readState = () => {
    try {
        const data = fs.readFileSync(PLAYBACK_STATE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("[PlaybackManager] Read Error:", err.message);
        return {};
    }
};

const writeState = (data) => {
    try {
        fs.writeFileSync(PLAYBACK_STATE_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("[PlaybackManager] Write Error:", err.message);
    }
};

const getRoomState = async (roomId, defaultVideoId = "") => {
    const allStates = readState();
    
    if (!allStates[roomId]) {
        allStates[roomId] = {
            videoId: defaultVideoId,
            time: 0,
            isPlaying: false,
            lastUpdated: Date.now()
        };
        writeState(allStates);
    }

    const state = allStates[roomId];
    
    if (state.isPlaying) {
        const now = Date.now();
        const elapsedSeconds = (now - state.lastUpdated) / 1000;
        state.time += elapsedSeconds;
        state.lastUpdated = now;
    }

    return state;
};

const updateRoomState = async (roomId, partialState) => {
    const allStates = readState();
    const currentState = allStates[roomId] || { videoId: "", time: 0, isPlaying: false };
    
    if (partialState.time !== undefined) {
         partialState.time = Math.round(partialState.time);
    }

    allStates[roomId] = {
        ...currentState,
        ...partialState,
        lastUpdated: Date.now()
    };

    writeState(allStates);
};

module.exports = {
    getRoomState,
    updateRoomState
};
