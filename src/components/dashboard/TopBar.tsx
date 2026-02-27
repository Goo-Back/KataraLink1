import React, { useState } from 'react';
import { Search, Bell, Calendar, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../ui/LanguageSelector';

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onMenuClick }) => {
  const { t, language } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const currentDate = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const notifications = [
    { id: 1, title: t('irrigationAlert'), message: t('northFieldMoistureLow'), time: '10m ago', type: 'alert' },
    { id: 2, title: t('taskCompleted'), message: t('soilSamplingFinished'), time: '1h ago', type: 'success' },
    { id: 3, title: t('weatherUpdate'), message: t('rainExpectedTomorrow'), time: '2h ago', type: 'info' },
  ];

  return (
    <header className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm bg-white/90">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 capitalize tracking-tight">{title}</h1>
          <div className="hidden md:flex items-center gap-2 text-xs text-stone-500 mt-1 font-mono">
            <Calendar className="w-3 h-3" />
            <span>{currentDate}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 relative">
        <div className="relative group hidden md:block">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="pl-9 pr-4 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64 transition-all"
          />
        </div>
        
        <LanguageSelector />

        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className={`p-2 rounded-lg relative transition-colors border ${showNotifications ? 'bg-stone-100 text-stone-900 border-stone-200' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 border-transparent hover:border-stone-200'}`}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50"
            >
              <div className="p-3 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-sm text-stone-900">{t('notifications')}</h3>
                <button onClick={() => setShowNotifications(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 border-b border-stone-50 hover:bg-stone-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-medium ${notif.type === 'alert' ? 'text-red-600' : notif.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-stone-400">{notif.time}</span>
                    </div>
                    <p className="text-xs text-stone-600">{notif.message}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 text-center border-t border-stone-100 bg-stone-50/30">
                <button className="text-xs font-medium text-emerald-600 hover:text-emerald-700">{t('markAllRead')}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
