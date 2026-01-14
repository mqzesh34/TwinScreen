const extractVideoId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

const extractPlaylistId = (url) => {
    const patterns = [
        /[?&]list=([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]+)$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

const isPlaylistUrl = (url) => {
    return url.includes('list=') || url.includes('playlist');
};

const getPlaylistVideos = async (playlistId) => {
    try {
        const fetch = (await import('node-fetch')).default;
        
        const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        const response = await fetch(playlistUrl);
        const html = await response.text();
        
        const videoMatches = [...html.matchAll(/"videoId":"([^"]+)"/g)];
        const titleMatches = [...html.matchAll(/"title":{"runs":\[{"text":"([^"]+)"/g)];
        const thumbnailMatches = [...html.matchAll(/"thumbnail":{"thumbnails":\[{"url":"([^"]+)"/g)];
        
        const uniqueVideoIds = [...new Set(videoMatches.map(match => match[1]))];
        
        const videos = uniqueVideoIds.slice(0, 100).map((videoId, index) => ({
            videoId: videoId,
            title: titleMatches[index] ? titleMatches[index][1] : `Video ${index + 1}`,
            thumbnail: thumbnailMatches[index] ? thumbnailMatches[index][1] : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        }));
        
        if (videos.length === 0) {
            throw new Error('Playlist\'te video bulunamadı');
        }
        
        return videos;
    } catch (error) {
        console.error('Playlist videolarını alırken hata:', error.message);
        throw error;
    }
};

module.exports = {
    extractVideoId,
    extractPlaylistId,
    isPlaylistUrl,
    getPlaylistVideos
};
