const fs = require('fs');
const path = require('path');

const NOTIFICATIONS_FILE = path.join(__dirname, '../data/notifications.json');

const getNotifications = (userKey = null) => {
    try {
        if (!fs.existsSync(NOTIFICATIONS_FILE)) {
            fs.writeFileSync(NOTIFICATIONS_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
        let notifications = JSON.parse(data);

        if (userKey) {
            notifications = notifications.filter(n => n.senderKey !== userKey);
        }

        return notifications;
    } catch (err) {
        return [];
    }
};

const addNotification = (io, title, message, sender = "Sistem", senderKey = null) => {
    let notifications = [];
    try {
        if (fs.existsSync(NOTIFICATIONS_FILE)) {
            notifications = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8'));
        }
    } catch(e) {}
    
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

    try {
        fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
        
        if (io) {
            io.emit('new_notification', newNotification);
        }
        
        return newNotification;
    } catch (err) {
        console.error('Bildirim kaydedilemedi:', err);
        return null;
    }
};

const markAllRead = () => {
    const notifications = getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(updated, null, 2));
    return updated;
};

const clearNotifications = (userKey) => {
    let notifications = [];
    try {
        if (fs.existsSync(NOTIFICATIONS_FILE)) {
            notifications = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8'));
        }
    } catch(e) { return []; }

    const remaining = notifications.filter(n => n.senderKey === userKey);
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(remaining, null, 2));
    
    return [];
};

module.exports = { getNotifications, addNotification, markAllRead, clearNotifications };
