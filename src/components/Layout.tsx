import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, Home, Plus, Settings, ChevronLeft, ChevronRight, Menu, X, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import MeetingModal from './MeetingModal';
import DocumentPreview from './DocumentPreview';

import NotificationsPopover from './NotificationsPopover';

export default function Layout() {
  const currentUser = useStore(state => state.currentUser);
  const safeUser = currentUser || { name: 'Guest User', email: 'guest@example.com', avatar: '' };
  const openMeetingModal = useStore(state => state.openMeetingModal);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const addNotification = useStore(state => state.addNotification);
  const meetings = useStore(state => state.meetings);
  const actionItems = useStore(state => state.actionItems);
  const notifications = useStore(state => state.notifications);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Notification logic
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      
      // Check for upcoming meetings (next 15 mins)
      meetings.forEach(meeting => {
        const meetingStart = new Date(meeting.startDateTime);
        const timeDiff = meetingStart.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeDiff / 1000 / 60);
        
        if (minutesUntil > 0 && minutesUntil <= 15) {
          meeting.participants.forEach(p => {
            const notifId = `upcoming-${meeting.id}-${p.user.id}`;
            if (!notifications.some(n => n.id === notifId)) {
              addNotification({
                userId: p.user.id,
                message: `Upcoming meeting: ${meeting.title} starts in ${minutesUntil} minutes.`,
                type: 'Meeting',
                read: false,
                createdAt: new Date().toISOString(),
                link: `/meetings/${meeting.id}`
              });
            }
          });
        }
      });

      // Check for pending tasks due today
      actionItems.forEach(item => {
        if (item.status !== 'Task Created' && item.status !== 'Dismissed' && item.dueDate) {
          const dueDate = new Date(item.dueDate);
          if (dueDate.toDateString() === now.toDateString()) {
            const notifId = `due-${item.id}-${item.assignedTo.id}`;
            if (!notifications.some(n => n.id === notifId)) {
              addNotification({
                userId: item.assignedTo.id,
                message: `Task due today: ${item.description}`,
                type: 'Task',
                read: false,
                createdAt: new Date().toISOString(),
                link: `/action-items`
              });
            }
          }
        }
      });
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [meetings, actionItems, notifications, addNotification]);

  const navItems = [
    { to: '/', icon: Home, label: 'Overview' },
    { to: '/my-meetings', icon: Calendar, label: 'My Meetings' },
    { to: '/action-items', icon: CheckSquare, label: 'Action Items' },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo Area */}
      <div className="h-20 flex items-center px-5 shrink-0">
        <div className={clsx("flex items-center gap-3 text-blue-600 font-bold tracking-tight transition-all duration-300", isCollapsed ? "justify-center w-full" : "")}>
          <div className="w-10 h-10 bg-[#2F5596] p-2 rounded-md flex items-center justify-center shadow-md shrink-0">
            <span className="text-white text-xl leading-none">M</span>
          </div>
          {!isCollapsed && <span className="text-2xl  whitespace-nowrap overflow-hidden">MMT</span>}
        </div>
      </div>
      
      {/* Action Button */}
      <div
      className={clsx(
            "pb-6 shrink-0",
            isCollapsed ? "" : "px-4"
          )}
      
      >
        <button
          onClick={() => {
            openMeetingModal();
            setIsMobileOpen(false);
          }}
          className={clsx(
            "btn-primary flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5",
            isCollapsed ? "w-12 h-12 p-0 mx-auto" : "w-full px-4 py-3"
          )}
          title="New Meeting"
        >
          <Plus size={20} className={clsx(isCollapsed ? "" : "shrink-0")} />
          {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">New Meeting</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              "group flex items-center gap-3 rounded-[4px] font-medium transition-all duration-200 relative !no-underline",
              isCollapsed ? "justify-center p-3" : "px-4 py-3",
              isActive 
                ? "bg-[#2F5596] !text-white shadow-md" 
                : "!text-[#333333] hover:bg-[#F0F0F0] hover:!text-blue-600"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={20} 
                  className={clsx(
                    "shrink-0  transition-colors",
                    isActive ? "text-white" : "text-[#918D8D] group-hover:text-blue-600"
                  )} 
                />
                {!isCollapsed && (
                  <span className={clsx(
                    "whitespace-nowrap overflow-hidden",
                    isActive ? "text-white" : "text-[#333333]"
                  )}>{item.label}</span>
                )}
                {/* Active indicator dot for collapsed state */}
                {isCollapsed && isActive && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="p-4 shrink-0 mt-auto">
        <div className={clsx(
          "relative overflow-hidden rounded-[4px] transition-all duration-300",
          isCollapsed ? "p-2" : "p-3",
          "bg-[#F0F0F0] border border-[#918D8D] shadow-sm hover:shadow-md group cursor-pointer"
        )}>
          <div className={clsx(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <div className="relative shrink-0">
              <img 
                src={safeUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeUser.name)}&background=2F5596&color=fff`} 
                alt={safeUser.name} 
                className={clsx(
                  "avatar-img border-2 border-white shadow-sm transition-all",
                  isCollapsed ? "w-10 h-10" : "w-10 h-10"
                )} 
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#008314] border-2 border-white rounded-full"></div>
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#333333] truncate">{safeUser.name}</p>
                <p className="text-xs text-[#918D8D] truncate font-medium">{safeUser.email}</p>
              </div>
            )}

            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => useStore.getState().setCurrentUser(null)}
                  className="text-[#918D8D] hover:text-red-600 transition-colors p-1.5 hover:bg-white rounded-[4px] opacity-0 group-hover:opacity-100"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
                <button className="text-[#918D8D] hover:text-[#2F5596] transition-colors p-1.5 hover:bg-white rounded-[4px] opacity-0 group-hover:opacity-100">
                  <Settings size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#F0F0F0] text-[#333333] font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={clsx(
          "relative hidden md:flex flex-col bg-white border-r border-[var(--BorderGrey)] z-20 transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white border border-[var(--BorderGrey)] rounded-full p-1 text-[#918D8D] hover:text-blue-600 hover:border-blue-600 hover:shadow-sm transition-all z-30"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#333333]/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-6 right-4 p-2 text-[#918D8D] hover:text-[#333333] hover:bg-[#F0F0F0] rounded-lg"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-screen">
        {/* Header */}
        <div className="h-16 bg-white border-b border-[var(--BorderGrey)] flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-[#333333] hover:bg-[#F0F0F0] rounded-lg mr-2"
            >
              <Menu size={24} />
            </button>
            <div className="md:hidden font-bold text-[#2F5596] flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2F5596] p-2 rounded-md flex items-center justify-center shadow-sm">
                <span className="text-white text-sm leading-none">M</span>
              </div>
              MMT
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <NotificationsPopover />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
      
      <MeetingModal />
      <DocumentPreview />
    </div>
  );
}
