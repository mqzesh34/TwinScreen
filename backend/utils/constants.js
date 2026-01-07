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
    NEW_NOTIFICATION: 'new_notification'
};

module.exports = {
    SOCKET_EVENTS
};
