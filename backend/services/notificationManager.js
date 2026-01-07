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
        // Read existing notifications
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

        // Add new notification to start
        notifications.unshift(newNotification);

        // Limit to 50
        if (notifications.length > 50) {
            notifications.pop();
        }

        // Write back to file
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
        const notifications = await readJson(NOTIFICATIONS_FILE); // Use internal read to get all (no filtering)
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
        // Keep only notifications sent by this user (or whatever logic was intended - 
        // original logic: return [] from function, but write remaining to file.
        // The original logic seemed to delete notifications NOT sent by user? 
        // "remaining = notifications.filter(n => n.senderKey === userKey);" 
        // This effectively deleted all notifications FOR other users or from system? 
        // Re-reading original:
        // "remaining = notifications.filter(n => n.senderKey === userKey);"
        // This keeps ONLY the notifications sent by the user. It deletes everything else.
        // That seems odd for "clearNotifications", usually it means clear MY view.
        // But adhering to original logic:
        
        const remaining = notifications.filter(n => n.senderKey === userKey);
        await writeJson(NOTIFICATIONS_FILE, remaining);
        
        return [];
    } catch(e) { 
        return []; 
    }
};

module.exports = { getNotifications, addNotification, markAllRead, clearNotifications };
