import * as React from 'react';
import { LucideIcon, Home, Calendar, CheckSquare, Settings, Bell, Search, Plus } from 'lucide-react';
import { useStore } from '../../../store/useStore';

export interface INavbarProps {
  userDisplayName: string;
}

const NavItem: React.FC<{ icon: LucideIcon; label: string; active?: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
    active 
      ? 'bg-blue-600/10 text-blue-600 shadow-sm' 
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`}>
    <Icon size={18} />
    <span className="font-medium text-sm">{label}</span>
  </div>
);

export const Navbar: React.FC<INavbarProps> = ({ userDisplayName }) => {
  const [currentHash, setCurrentHash] = React.useState(window.location.hash || '#/');
  const openMeetingModal = useStore(state => state.openMeetingModal);
  const currentUser = useStore(state => state.currentUser);

  React.useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => {
    if (path.startsWith('http')) {
      window.location.href = path;
    } else {
      window.location.hash = path;
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Home, path: '#/' },
    { id: 'meetings', label: 'Meetings', icon: Calendar, path: '#/my-meetings' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '#/action-items' },
    { id: 'workbench', label: 'Workbench', icon: Settings, path: 'https://smalsusinfolabs.sharepoint.com/sites/SPTrainees/Nitin/_layouts/15/workbench.aspx' },
  ];

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[1000] px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-8">
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('#/')}>
          <div className="w-9 h-9 bg-[#2F5596] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white text-xl font-bold">M</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#2F5596] to-indigo-800">
            MeetingCenter
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavItem 
              key={item.id}
              icon={item.icon} 
              label={item.label} 
              active={currentHash === item.path || (item.path === '#/' && currentHash === '')}
              onClick={() => navigateTo(item.path)}
            />
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search meetings..." 
            className="bg-transparent border-none focus:outline-none text-sm ml-2 w-48 text-slate-700"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => openMeetingModal()}
            className="btn-primary flex items-center gap-2 px-4 py-1.5 text-sm rounded-full shadow-sm hover:opacity-90 transition-opacity"
          >
             <Plus size={16} />
             <span>New Meeting</span>
          </button>
          
          <div className="h-6 w-[1px] bg-slate-200 mx-2" />

          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <Settings size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">{currentUser?.name || userDisplayName}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">
              {currentUser?.team || 'Admin'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500/20 transition-all">
            <img 
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || userDisplayName)}&background=2F5596&color=fff`} 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

