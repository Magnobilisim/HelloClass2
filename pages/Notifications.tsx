
import React, { useState } from 'react';
import { useApp } from '../services/store';
import { Bell, ToggleLeft, ToggleRight, Plus, Inbox } from 'lucide-react';
import { NotificationType } from '../types';

export const NotificationScreen = () => {
  const { user, notifications, markAllNotificationsRead, markNotificationRead, updatePreferences, setPage, setViewedProfileId } = useApp();
  const [activeTab, setActiveTab] = useState<'LIST' | 'PREFS'>('LIST');
  const [topicInput, setTopicInput] = useState('');

  const handleAddTopic = () => {
      if(topicInput && user) {
          const newTopics = [...user.preferences.subscribedTopics, topicInput];
          updatePreferences('subscribedTopics', newTopics);
          setTopicInput('');
      }
  };

  const removeTopic = (topic: string) => {
      if(user) {
          const newTopics = user.preferences.subscribedTopics.filter(t => t !== topic);
          updatePreferences('subscribedTopics', newTopics);
      }
  };

  const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      
      return isToday 
          ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          : date.toLocaleDateString([], {day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'});
  };

  const handleNotificationClick = (n: any) => {
      markNotificationRead(n.id);
      
      // Navigation Logic
      if (n.type === NotificationType.EXAM) {
          setPage('exam-setup');
      } else if (n.type === NotificationType.LIKE || n.type === NotificationType.MENTION) {
          setPage('social');
      } else if (n.type === NotificationType.SYSTEM && n.title.includes('Onay')) {
          setPage('teacher-dash');
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
            <button 
                onClick={() => setActiveTab('LIST')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'LIST' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Bildirimler
            </button>
            <button 
                onClick={() => setActiveTab('PREFS')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'PREFS' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Tercihler
            </button>
        </div>

        {/* LIST VIEW */}
        {activeTab === 'LIST' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <Bell size={18} className="mr-2 text-primary"/> 
                        Son Hareketler
                    </h3>
                    <button onClick={markAllNotificationsRead} className="text-xs text-primary font-bold hover:underline">
                        Tümünü Okundu İşaretle
                    </button>
                </div>
                <div className="divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Inbox size={32} className="text-gray-300" />
                            </div>
                            <h4 className="font-bold text-gray-700">Hepsini Yakaladın!</h4>
                            <p className="text-sm text-gray-400 mt-1">Şu anda yeni bir bildirimin yok.</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div 
                                key={n.id} 
                                onClick={() => handleNotificationClick(n)}
                                className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
                            >
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold
                                            ${n.type === NotificationType.EXAM ? 'bg-purple-100 text-purple-600' : 
                                              n.type === NotificationType.LIKE ? 'bg-red-100 text-red-600' :
                                              n.type === NotificationType.MENTION ? 'bg-blue-100 text-blue-600' : 
                                              n.type === NotificationType.SYSTEM ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {n.type === NotificationType.LIKE && 'Beğeni'}
                                            {n.type === NotificationType.EXAM && 'Sınav'}
                                            {n.type === NotificationType.MENTION && 'Etiket'}
                                            {n.type === NotificationType.SYSTEM && 'Sistem'}
                                        </span>
                                        <span className="text-xs text-gray-400">{formatDate(n.timestamp)}</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-800">{n.title}</h4>
                                    <p className="text-sm text-gray-600 leading-snug">{n.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* PREFS VIEW */}
        {activeTab === 'PREFS' && user && (
            <div className="space-y-4">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 text-lg">Bildirim Ayarları</h3>
                    
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-gray-700">@Bahsetmeler</div>
                                <div className="text-xs text-gray-400">Biri senden bahsettiğinde bildir</div>
                            </div>
                            <button onClick={() => updatePreferences('mentions', !user.preferences.mentions)}>
                                {user.preferences.mentions ? <ToggleRight size={40} className="text-primary"/> : <ToggleLeft size={40} className="text-gray-300"/>}
                            </button>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-gray-700">Okul Duyuruları</div>
                                <div className="text-xs text-gray-400">Okulunla ilgili haberleri al</div>
                            </div>
                            <button onClick={() => updatePreferences('schoolNews', !user.preferences.schoolNews)}>
                                {user.preferences.schoolNews ? <ToggleRight size={40} className="text-primary"/> : <ToggleLeft size={40} className="text-gray-300"/>}
                            </button>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold text-gray-700">Sınav Hatırlatıcıları</div>
                                <div className="text-xs text-gray-400">Yeni testler eklendiğinde haber ver</div>
                            </div>
                            <button onClick={() => updatePreferences('examReminders', !user.preferences.examReminders)}>
                                {user.preferences.examReminders ? <ToggleRight size={40} className="text-primary"/> : <ToggleLeft size={40} className="text-gray-300"/>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Takip Edilen Konular</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {user.preferences.subscribedTopics.map(topic => (
                            <span key={topic} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                {topic}
                                <button onClick={() => removeTopic(topic)} className="ml-2 text-gray-400 hover:text-red-500">×</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            placeholder="Örn: LGS, Uzay, İngilizce"
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button 
                            onClick={handleAddTopic}
                            className="bg-black text-white px-4 py-2 rounded-xl font-bold flex items-center active:scale-95"
                        >
                            <Plus size={18} className="mr-1" /> Ekle
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
