const { SOCKET_EVENTS } = require('../utils/constants');
const { getRoomState, updateRoomState } = require('./playbackManager');
const { addNotification } = require('./notificationManager');
const { readJson, PRIVATE_ROOMS_FILE } = require('../utils/db');
const jwt = require('jsonwebtoken');
const config = require('../data/config.json');

const roomHeartbeats = {};

const checkRoomActivity = async (io, roomId) => {
    if (!roomId || roomId === "public") return;

    // Use a slight delay to allow socket join/leave operations to propagate
    // But since we are calling this *after* join/leave sync, immediate check might be okay if using the adapter correctly.
    // However, for disconnect, sometimes it takes a tick. 
    // Let's trust the adapter state at the moment of call.

    const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    const isSessionActive = count >= 2;

    const updates = { usersActive: isSessionActive };
    
    // If session is not active, force pause
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
                    // Check activity for old room
                    await checkRoomActivity(io, oldRoom);
                }

                socket.join(roomId);
                socket.videoRoom = roomId;

                // Check activity for new room (includes this user now)
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

                // 1. Notify inside the room (fallback, rarely useful if we want to avoid duplicates, but kept for legacy/public rooms)
                // Actually, if we are stricter, we might want to skip this if ANYONE is in the room? 
                // But the requirement is about specific partner toast.
                
                // 2. Notify the specific partner globally
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
                                // Find connected socket for the target user
                                const targetSocket = Array.from(io.sockets.sockets.values())
                                    .find(s => s.userData && s.userData.name === targetUser);
                                
                                if (targetSocket) {
                                    // Check if user is ALREADY in the room
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

                // Only flush to DB notification if not already in room (optional, but cleaner)
                // But let's keep it simply adding to history for now unless requested otherwise.
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
                
                // Get the current persisted state to use as sync point
                const currentState = await getRoomState(roomId);
                const syncTime = currentState.time || 0;
                
                io.to(roomId).emit(SOCKET_EVENTS.COUNTDOWN, { targetTime: syncTime, user: socket.userData.name });
                // Countdown indicates intent to play, set isPlaying to true so late joiners sync correctly
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
                
                // Clean up old entries
                const now = Date.now();
                for (const [user, uData] of Object.entries(roomHeartbeats[roomId])) {
                    if (now - uData.lastUpdate > 5000) {
                        delete roomHeartbeats[roomId][user];
                    }
                }

                // Clean up empty rooms to prevent memory leaks
                if (Object.keys(roomHeartbeats[roomId]).length === 0) {
                    delete roomHeartbeats[roomId];
                    return;
                }
                
                const users = Object.values(roomHeartbeats[roomId]);
                
                // Determine Sync Status
                // 1. Check if all users have the same playing state
                const allPlaying = users.every(u => u.isPlaying);
                const allPaused = users.every(u => !u.isPlaying);
                const isStateConsistent = allPlaying || allPaused;

                let isSynced = true;

                if (!isStateConsistent) {
                    // If some are playing and some are paused, they are NOT synced
                    isSynced = false;
                } else {
                    // Check time consistency
                    const times = users.map(u => {
                        // If playing, predict current time based on lag. If paused, use static time.
                        return u.isPlaying ? u.time + (now - u.lastUpdate) / 1000 : u.time;
                    });
                    
                    if (times.length >= 1) { // Changed to 1 to allow saving even with single user
                        const maxTime = Math.max(...times);
                        const minTime = Math.min(...times);
                        
                        // Tolerance: 2 seconds for active playback
                        if ((maxTime - minTime) > 2.0 && times.length >= 2) {
                            isSynced = false;
                        }

                        // Periodic Persistence (every 5 seconds)
                        const lastSaved = roomHeartbeats[roomId].lastSaved || 0;
                        if (isPlaying && (now - lastSaved > 5000)) {
                             const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                             // Update JSON to keep it fresh
                             // We use await but don't block the response critical path significantly
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
                         console.log(`⚠️ Sync Mismatch! Diff: ${(maxTime - minTime).toFixed(1)}s, Correcting to: ${avgTime}s`);
                         
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

            socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
                if (socket.userData) {
                    console.log(`🔴 [LEFT] ${socket.userData.name}`);
                }
                
                if (socket.videoRoom) {
                    const roomId = socket.videoRoom;
                    // Don't modify room state here directly for pause, let checkRoomActivity handle logic if needed
                    // But typically pause on leave is good.
                    // Actually checkRoomActivity handles isPlaying = false if activity drops.
                    
                    // We still emit pause locally just in case? Or rely on checkRoomActivity.
                    // checkRoomActivity emits VIDEO_SYNC which sends the whole state (including isPlaying).
                    
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
