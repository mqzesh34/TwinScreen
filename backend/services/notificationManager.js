const { readJson, writeJson, NOTIFICATIONS_FILE } = require('../utils/db');
const { SOCKET_EVENTS } = require('../utils/constants');

const getNotifications = async (userKey = null) => {
    try {
        let notifications = await readJson(NOTIFICATIONS_FILE);
        
        if (userKey) {
            notifications = notifications.filter(n => n.senderKey !== userKey);
        }

        return notifications;
    } catch (err) {
        return [];
    }
};

const addNotification = async (io, title, message, sender = "Sistem", senderKey = null) => {
    try {
        const notifications = await readJson(NOTIFICATIONS_FILE);
        
        const now = new Date();
        const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        
        const newNotification = {
            id: Date.now(),
            title,
            message,
            sender,
            senderKey,
            time,
            read: false,
            timestamp: now.toISOString()
        };
        notifications.unshift(newNotification);
        if (notifications.length > 50) {
            notifications.pop();
        }
        await writeJson(NOTIFICATIONS_FILE, notifications);
        
        if (io) {
            io.emit(SOCKET_EVENTS.NEW_NOTIFICATION, newNotification);
        }
        
        return newNotification;
    } catch (err) {
        console.error('Bildirim kaydedilemedi:', err);
        return null;
    }
};

const markAllRead = async () => {
    try {
        const notifications = await readJson(NOTIFICATIONS_FILE);
        const updated = notifications.map(n => ({ ...n, read: true }));
        await writeJson(NOTIFICATIONS_FILE, updated);
        return updated;
    } catch (err) {
        console.error('Bildirimler okundu olarak işaretlenemedi:', err);
        return [];
    }
};

const clearNotifications = async (userKey) => {
    try {
        const notifications = await readJson(NOTIFICATIONS_FILE);
        
        const remaining = notifications.filter(n => n.senderKey === userKey);
        await writeJson(NOTIFICATIONS_FILE, remaining);
        
        return [];
    } catch(e) { 
        return []; 
    }
};

module.exports = { getNotifications, addNotification, markAllRead, clearNotifications };
