const { SOCKET_EVENTS } = require('../utils/constants');
const { getRoomState, updateRoomState } = require('./playbackManager');
const { addNotification } = require('./notificationManager');
const { readJson, PRIVATE_ROOMS_FILE } = require('../utils/db');
const jwt = require('jsonwebtoken');
const config = require('../data/config.json');

const roomHeartbeats = {};
const voicePeers = {};

const checkRoomActivity = async (io, roomId) => {
    if (!roomId || roomId === "public") return;
    const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    const isSessionActive = count >= 2;

    const updates = { usersActive: isSessionActive };
    
    if (!isSessionActive) {
        updates.isPlaying = false;
    }

    await updateRoomState(roomId, updates);
    const newState = await getRoomState(roomId);
    
    io.to(roomId).emit(SOCKET_EVENTS.VIDEO_SYNC, newState);
    return isSessionActive;
};

const setupSocketHandlers = (io) => {
    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
        const token = socket.handshake.auth.token;
        
        if (!token) return;

        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            const userKeyRoom = `user:${decoded.key}`;
            
            socket.userData = {
                name: decoded.name,
                key: decoded.key
            };

            socket.join(userKeyRoom);
            console.log(`🟢 [CONNECTED] ${socket.userData.name}`);

            socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (messageData) => {
                io.emit(SOCKET_EVENTS.RECEIVE_MESSAGE, messageData);
                await addNotification(io, "Yeni Mesaj", `${messageData.text}`, socket.userData.name, socket.userData.key);
            });

            socket.on(SOCKET_EVENTS.JOIN_VIDEO_ROOM, async (data) => {
                let roomId = "public";
                let initialVideoId = "";

                if (typeof data === 'string') {
                    roomId = data;
                } else if (typeof data === 'object') {
                    roomId = data.roomId;
                    if (data.initialVideoId) initialVideoId = data.initialVideoId;
                }

                if (socket.videoRoom && socket.videoRoom !== roomId) {
                    const oldRoom = socket.videoRoom;
                    socket.leave(oldRoom);
                    await checkRoomActivity(io, oldRoom);
                }

                socket.join(roomId);
                socket.videoRoom = roomId;

                await checkRoomActivity(io, roomId);
            });

            socket.on(SOCKET_EVENTS.LEAVE_VIDEO_ROOM, async () => {
                if (socket.videoRoom) {
                    const roomId = socket.videoRoom;
                    socket.leave(roomId);
                    socket.videoRoom = null;
                    
                    await checkRoomActivity(io, roomId);
                }
            });

            socket.on(SOCKET_EVENTS.SEND_ROOM_NOTIFICATION, async (data, callback) => {
                const roomId = typeof data === 'object' ? data.roomId : data;
                if (!roomId) return;

                const message = "Partnerin odaya katıldı ve seni bekliyor!";
                const senderName = socket.userData.name;
                let partnerInRoom = false;

                if (roomId.startsWith('private_')) {
                    try {
                        const privateRoomId = parseInt(roomId.split('_')[1]);
                        const rooms = await readJson(PRIVATE_ROOMS_FILE);
                        const room = rooms.find(r => r.id === privateRoomId);
                        
                        if (room) {
                            let targetUser = null;
                            if (room.creator === senderName) targetUser = room.invitedUser;
                            else if (room.invitedUser === senderName) targetUser = room.creator;
                            
                            if (targetUser) {
                                const targetSocket = Array.from(io.sockets.sockets.values())
                                    .find(s => s.userData && s.userData.name === targetUser);
                                
                                if (targetSocket) {
                                    if (targetSocket.videoRoom === roomId) {
                                        partnerInRoom = true;
                                    } else {
                                        targetSocket.emit('custom_toast', {
                                            message: `${senderName}: ${message}`,
                                            icon: '👋'
                                        });
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Room lookup failed:", err);
                    }
                }

                await addNotification(
                    io, 
                    "Oda Bildirimi", 
                    `${senderName} odaya katıldı.`, 
                    senderName, 
                    socket.userData.key
                );

                if (typeof callback === 'function') {
                    if (partnerInRoom) {
                        callback({ status: 'already_in_room' });
                    } else {
                        callback({ status: 'sent' });
                    }
                }
            });

            socket.on(SOCKET_EVENTS.PLAY_VIDEO, async (data) => {
                const { roomId, time } = data;
                if (!roomId) return;
                
                socket.to(roomId).emit(SOCKET_EVENTS.PLAY_VIDEO, { time, user: socket.userData.name });
                await updateRoomState(roomId, { isPlaying: true, time });
            });

            socket.on(SOCKET_EVENTS.PAUSE_VIDEO, async (data) => {
                const { roomId, time } = data;
                if (!roomId) return;

                socket.to(roomId).emit(SOCKET_EVENTS.PAUSE_VIDEO, { time, user: socket.userData.name });
                await updateRoomState(roomId, { isPlaying: false, time });
            });

            socket.on(SOCKET_EVENTS.SEEK_VIDEO, async (data) => {
                const { roomId, time } = data;
                if (!roomId) return;

                socket.to(roomId).emit(SOCKET_EVENTS.SEEK_VIDEO, { time, user: socket.userData.name });
                await updateRoomState(roomId, { time });
            });

            socket.on(SOCKET_EVENTS.COUNTDOWN, async (data) => {
                const { roomId } = data;
                if (!roomId) return;
                
                const currentState = await getRoomState(roomId);
                const syncTime = currentState.time || 0;
                
                io.to(roomId).emit(SOCKET_EVENTS.COUNTDOWN, { targetTime: syncTime, user: socket.userData.name });
                await updateRoomState(roomId, { time: syncTime, isPlaying: true });
            });

            socket.on(SOCKET_EVENTS.CHANGE_MOVIE, async (data) => {
                let roomId = "public";
                let videoId = data;

                if (typeof data === 'object') {
                    roomId = data.roomId;
                    videoId = data.videoId;
                }

                if (!roomId) return;

                io.to(roomId).emit(SOCKET_EVENTS.CHANGE_MOVIE, videoId);
                await updateRoomState(roomId, { videoId, time: 0, isPlaying: true });
            });

            socket.on(SOCKET_EVENTS.HEARTBEAT, async (data) => {
                const { roomId, time, isPlaying } = data;
                if (!roomId || !socket.userData) return;
                
                const userName = socket.userData.name;
                
                if (!roomHeartbeats[roomId]) {
                    roomHeartbeats[roomId] = {};
                }
                
                roomHeartbeats[roomId][userName] = { time, isPlaying, lastUpdate: Date.now() };
                
                const now = Date.now();
                for (const [user, uData] of Object.entries(roomHeartbeats[roomId])) {
                    if (now - uData.lastUpdate > 5000) {
                        delete roomHeartbeats[roomId][user];
                    }
                }

                if (Object.keys(roomHeartbeats[roomId]).length === 0) {
                    delete roomHeartbeats[roomId];
                    return;
                }
                
                const users = Object.values(roomHeartbeats[roomId]);
                
                const allPlaying = users.every(u => u.isPlaying);
                const allPaused = users.every(u => !u.isPlaying);
                const isStateConsistent = allPlaying || allPaused;

                let isSynced = true;

                if (!isStateConsistent) {
                    isSynced = false;
                } else {
                    const times = users.map(u => {
                        return u.isPlaying ? u.time + (now - u.lastUpdate) / 1000 : u.time;
                    });
                    
                    if (times.length >= 1) {
                        const maxTime = Math.max(...times);
                        const minTime = Math.min(...times);
                        
                        if ((maxTime - minTime) > 2.0 && times.length >= 2) {
                            isSynced = false;
                        }

                        const lastSaved = roomHeartbeats[roomId].lastSaved || 0;
                        if (isPlaying && (now - lastSaved > 5000)) {
                             const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                             await updateRoomState(roomId, { time: avgTime, isPlaying: true });
                             roomHeartbeats[roomId].lastSaved = now;
                        }
                    }
                }

                // Force Sync Logic
                if (allPlaying && !isSynced) {
                     const times = users.map(u => u.time + (now - u.lastUpdate) / 1000);
                     const maxTime = Math.max(...times);
                     const minTime = Math.min(...times);
                     
                     if ((maxTime - minTime) > 2.5) {
                         const avgTime = Math.round((minTime + maxTime) / 2);
                         
                         io.to(roomId).emit(SOCKET_EVENTS.FORCE_SYNC, { 
                            time: avgTime, 
                            isPlaying: true,
                            reason: `Senkronizasyon farkı: ${(maxTime - minTime).toFixed(1)}s` 
                         });
                         
                         await updateRoomState(roomId, { time: avgTime, isPlaying: true });
                     }
                }
                
                io.to(roomId).emit(SOCKET_EVENTS.SYNC_STATUS, { 
                    users: Object.entries(roomHeartbeats[roomId]).map(([name, uData]) => ({
                        name,
                        time: uData.time + (now - uData.lastUpdate) / 1000,
                        isPlaying: uData.isPlaying
                    })),
                    isSynced: isSynced && users.length > 0 
                });
            });

            socket.on(SOCKET_EVENTS.VOICE_REGISTER, (data) => {
                const { roomId, peerId } = data;
                if (!roomId || !peerId) return;

                if (!voicePeers[roomId]) {
                    voicePeers[roomId] = {};
                }

                const existingSocketIds = Object.keys(voicePeers[roomId]);
                for (const sid of existingSocketIds) {
                    if (!io.sockets.sockets.has(sid)) {
                        delete voicePeers[roomId][sid];
                    }
                }

                voicePeers[roomId][socket.id] = peerId;
                socket.voiceRoom = roomId;
                socket.peerId = peerId;

                socket.to(roomId).emit(SOCKET_EVENTS.VOICE_PEER_JOINED, { peerId });

                const existingPeers = Object.entries(voicePeers[roomId])
                    .filter(([sid]) => sid !== socket.id)
                    .map(([, pid]) => pid);

                if (existingPeers.length > 0) {
                    socket.emit(SOCKET_EVENTS.VOICE_PEER_JOINED, { peerId: existingPeers[0] });
                }
            });

            socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
                if (socket.userData) {
                    console.log(`🔴 [LEFT] ${socket.userData.name}`);
                }

                if (socket.voiceRoom && voicePeers[socket.voiceRoom]) {
                    delete voicePeers[socket.voiceRoom][socket.id];
                    socket.to(socket.voiceRoom).emit(SOCKET_EVENTS.VOICE_PEER_LEFT);
                    
                    if (Object.keys(voicePeers[socket.voiceRoom]).length === 0) {
                        delete voicePeers[socket.voiceRoom];
                    }
                }
                
                if (socket.videoRoom) {
                    const roomId = socket.videoRoom;
                    await checkRoomActivity(io, roomId);
                }
            });

        } catch (err) {
            console.log('⚠️ Invalid Token', err.message);
            socket.disconnect();
        }
    });
};

module.exports = setupSocketHandlers;
