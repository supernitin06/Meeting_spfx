import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Circle, ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const notifications = useStore(state => state.notifications);
  const markNotificationRead = useStore(state => state.markNotificationRead);
  const currentUser = useStore(state => state.currentUser);
  
  const userNotifications = notifications
    .filter(n => currentUser && n.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  const unreadCount = userNotifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#918D8D] hover:text-[#2F5596] hover:bg-[#F0F0F0] rounded-lg transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F98B36] rounded-full border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-[4px] shadow-xl border border-[#DDDDDD] z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-[#DDDDDD] flex items-center justify-between bg-white shrink-0">
            <h3 className="font-semibold text-[#333333] text-[15px]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium bg-white border border-[#DDDDDD] text-[#333333] px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {userNotifications.length > 0 ? (
              <div className="divide-y divide-[#DDDDDD]">
                {userNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={clsx(
                      "p-4 hover:bg-[#F0F0F0] transition-colors flex gap-3",
                      !notification.read ? "bg-white" : ""
                    )}
                  >
                    <div className="shrink-0 pt-0.5">
                      {!notification.read ? (
                        <Circle size={10} className="text-[#2F5596] fill-[#2F5596] mt-1.5" />
                      ) : (
                        <Check size={14} className="text-[#918D8D] mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        "text-sm",
                        !notification.read ? "text-[#333333] font-semibold" : "text-[#333333]"
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#918D8D] mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      {notification.link && (
                        <Link 
                          to={notification.link}
                          onClick={() => {
                            if (!notification.read) markNotificationRead(notification.id);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F5596] hover:underline mt-2"
                        >
                          View details <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        className="shrink-0 p-1 text-[#918D8D] hover:text-[#2F5596] hover:bg-[#DDDDDD] rounded transition-colors self-start"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#918D8D]">
                <Bell className="mx-auto h-8 w-8 text-[#DDDDDD] mb-3" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
