import { Bell, Clock, X } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import ModalWrapper from "./ModalWrapper";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
}: NotificationsModalProps) {
  const { notifications, unreadCount, clearAllNotifications } =
    useNotifications();

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      position="top"
      showCloseButton={false}
      className="bg-[#121212] rounded-3xl max-w-md"
    >
      <div className="sticky top-0 bg-[#121212]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Bell size={20} className="text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Bildirimler</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-white/40">
                {unreadCount} okunmamış bildirim
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
        >
          <X size={20} />
        </button>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <Bell size={48} className="mx-auto text-white mb-4" />
            <p className="text-white/40 text-sm">Henüz bildirim bulunmuyor</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer ${
                  !notification.read ? "bg-purple-500/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0 animate-pulse" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-bold text-sm mb-1 ${
                        !notification.read ? "text-white" : "text-white/70"
                      }`}
                    >
                      {notification.title}
                    </h4>
                    <p className="text-white/40 text-xs mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 text-white text-[10px]">
                      {notification.sender && (
                        <span className="font-bold text-white/50">
                          {notification.sender}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{notification.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="sticky bottom-0 bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 px-6 py-3">
          <button
            onClick={clearAllNotifications}
            className="w-full text-center text-xs text-red-500 hover:text-red-400 transition-colors font-bold flex items-center justify-center gap-2"
          >
            <span className="opacity-50 hover:opacity-100 transition-opacity">
              Tüm Bildirimleri Temizle
            </span>
          </button>
        </div>
      )}
    </ModalWrapper>
  );
}
