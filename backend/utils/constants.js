const SOCKET_EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    SEND_MESSAGE: 'send_message',
    RECEIVE_MESSAGE: 'receive_message',
    PLAY_VIDEO: 'play_video',
    PAUSE_VIDEO: 'pause_video',
    SEEK_VIDEO: 'seek_video',
    CHANGE_MOVIE: 'change_movie',
    MOVIES_UPDATED: 'movies_updated',
    PRIVATE_ROOMS_UPDATED: 'private_rooms_updated',
    NEW_NOTIFICATION: 'new_notification',
    JOIN_VIDEO_ROOM: 'join_video_room',
    VIDEO_SYNC: 'video:sync',
    COUNTDOWN: 'video:countdown',
    HEARTBEAT: 'video:heartbeat',
    SYNC_STATUS: 'video:sync_status',
    FORCE_SYNC: 'video:force_sync',
    LEAVE_VIDEO_ROOM: 'leave_video_room',
    SEND_ROOM_NOTIFICATION: 'send_room_notification',
    VOICE_REGISTER: 'voice:register',
    VOICE_PEER_JOINED: 'voice:peer_joined',
    VOICE_PEER_LEFT: 'voice:peer_left',
    LAST_WATCHED_UPDATED: 'last_watched_updated'
};

module.exports = {
    SOCKET_EVENTS
};
