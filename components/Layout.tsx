
import React from 'react';
import { useApp } from '../services/store';
import { UserRole } from '../types';
import { SHOP_ITEMS } from '../constants';
import { 
  Home, BookOpen, Trophy, User, LogOut, 
  LayoutDashboard, Bell, Flame, ShoppingBag, Globe
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, notifications, setViewedProfileId, currentPage, setPage, language, setLanguage } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;

  const studentNav = [
    { id: 'social', icon: <Home size={24} />, label: 'Akış' },
    { id: 'exam-setup', icon: <BookOpen size={24} />, label: 'Sınavlar' },
    { id: 'leaderboard', icon: <Trophy size={24} />, label: 'Liderler' },
    { id: 'shop', icon: <ShoppingBag size={24} />, label: 'Mağaza' },
    { id: 'profile', icon: <User size={24} />, label: 'Profil' },
  ];

  const teacherNav = [
    { id: 'teacher-dash', icon: <LayoutDashboard size={24} />, label: 'Panelim' },
    { id: 'social', icon: <Home size={24} />, label: 'Akış' },
    { id: 'exam-setup', icon: <BookOpen size={24} />, label: 'Market' },
    { id: 'profile', icon: <User size={24} />, label: 'Profil' },
  ];

  const adminNav = [
    { id: 'admin-dash', icon: <LayoutDashboard size={24} />, label: 'Panel' },
    { id: 'social', icon: <Home size={24} />, label: 'Akış' },
  ];

  let navItems = studentNav;
  if (user?.role === UserRole.ADMIN) navItems = adminNav;
  if (user?.role === UserRole.TEACHER) navItems = teacherNav;

  const handleNavClick = (pageId: string) => {
    setViewedProfileId(null);
    setPage(pageId);
  };

  const handleProfileClick = () => {
    setViewedProfileId(null);
    setPage('profile');
  };

  const handleNotificationClick = () => {
    setPage('notifications');
  };

  const toggleLanguage = () => {
      setLanguage(language === 'TR' ? 'EN' : 'TR');
  };

  // Get equipped frame styles
  const frameStyle = user?.equippedFrame 
    ? SHOP_ITEMS.find(i => i.id === user.equippedFrame)?.imageUrl 
    : 'border-2 border-gray-100';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0 z-20 shadow-sm">
        <div className="p-6">
          <h1 className="font-display text-3xl text-primary font-bold tracking-tight">HelloClass</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Eğitimin Sosyal Hali</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center w-full p-3.5 rounded-2xl transition-all duration-200 font-medium ${
                currentPage === item.id 
                  ? 'bg-primary text-white shadow-md shadow-primary/30' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={logout}
            className="flex items-center w-full p-3 text-red-500 hover:bg-red-50 rounded-2xl font-medium transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-3">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center bg-white border-b px-8 py-4 sticky top-0 z-10">
           <h2 className="text-xl font-display font-bold text-gray-800">
              {navItems.find(i => i.id === currentPage)?.label || 'HelloClass'}
           </h2>
           <div className="flex items-center gap-6">
               {/* Streak Counter */}
               <div className="flex items-center text-orange-500 font-bold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100" title="Günlük Seri">
                   <Flame size={18} className="mr-1 fill-orange-500 animate-pulse"/>
                   {user?.streak || 0}
               </div>

               {user?.role === UserRole.TEACHER && (
                 <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 text-sm font-bold border border-green-100">
                   ₺{user.walletBalance?.toFixed(2)}
                 </div>
               )}

               <button onClick={toggleLanguage} className="flex items-center text-gray-500 font-bold hover:text-primary transition-colors">
                   <Globe size={20} className="mr-1"/> {language}
               </button>

               <button 
                  onClick={handleNotificationClick}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
               >
                  <Bell size={24} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
               </button>
               
               <button onClick={handleProfileClick} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">{user?.name}</div>
                      <div className="text-xs text-gray-500">
                        {user?.role === UserRole.TEACHER ? 'Eğitmen' : user?.school}
                      </div>
                  </div>
                  <img src={user?.avatar} alt="Avatar" className={`w-10 h-10 rounded-full bg-gray-200 ${frameStyle}`} />
               </button>
           </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-white p-4 shadow-sm sticky top-0 z-30 flex justify-between items-center">
          <h1 className="font-display text-2xl text-primary font-bold">HelloClass</h1>
          <div className="flex items-center gap-3">
             <div className="flex items-center text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-full border border-orange-100 text-xs">
                   <Flame size={14} className="mr-1 fill-orange-500"/>
                   {user?.streak || 0}
             </div>
             <button 
                  onClick={handleNotificationClick}
                  className="relative p-2"
             >
                  <Bell size={24} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
             </button>
             <button onClick={handleProfileClick}>
                {user && <img src={user.avatar} alt="Avatar" className={`w-9 h-9 rounded-full bg-gray-200 ${frameStyle}`} />}
             </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto scroll-smooth">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-6 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center p-2 rounded-xl w-full transition-colors ${
                currentPage === item.id ? 'text-primary' : 'text-gray-400'
              }`}
            >
              {React.cloneElement(item.icon as React.ReactElement<any>, { 
                fill: currentPage === item.id ? "currentColor" : "none",
                className: currentPage === item.id ? "scale-110 transition-transform" : ""
              })}
              <span className="text-[10px] mt-1 font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
