import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

interface Notification {
  id: number;
  title: string;
  message: string;
  sender?: string;
  senderKey?: string;
  time: string;
  read: boolean;
  timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket } = useSocket();
  const { userKey, userProfile, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const decodedKey = userProfile?.key || null;

  useEffect(() => {
    if (!userKey) return;

    fetch("/notifications", {
      headers: { Authorization: `Bearer ${userKey}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [userKey]);

  useEffect(() => {
    if (!socket) return;

    socket.on("new_notification", (notification: Notification) => {
      if (decodedKey && notification.senderKey === decodedKey) {
        return;
      }
      setNotifications((prev) => [notification, ...prev]);
    });

    socket.on("notifications_updated", (updatedList: Notification[]) => {
      setNotifications(updatedList);
    });

    socket.on("force_logout", (data: any) => {
      toast.error(data.message || "Oturumunuz sonlandırıldı.");
      logout();
    });

    return () => {
      socket.off("new_notification");
      socket.off("notifications_updated");
      socket.off("force_logout");
    };
  }, [socket]);

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);

    try {
      await fetch("/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
    } catch (err) {
      console.error("Bildirimler okundu işaretlenemedi");
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);

    try {
      await fetch("/notifications/clear", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
    } catch (err) {
      console.error("Bildirimler silinemedi");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        clearAllNotifications,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
