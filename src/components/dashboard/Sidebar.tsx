import React from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  CloudRain, 
  Settings, 
  LogOut,
  Leaf,
  Stethoscope,
  CheckSquare,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: t('overview') },
    { id: 'land', icon: Sprout, label: t('landAndCrops') },
    { id: 'irrigation', icon: CloudRain, label: t('irrigation') },
    { id: 'doctor', icon: Stethoscope, label: t('cropDoctor') },
    { id: 'tasks', icon: CheckSquare, label: t('tasks') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full" dir={dir}>
      <div className="p-6 flex items-center justify-between text-white mb-6 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-900/20">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight font-mono">KATARA_OS</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' 
                : 'hover:bg-stone-800 hover:text-stone-200 border border-transparent'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-emerald-400' : 'text-stone-500 group-hover:text-stone-300'}`} />
            <span className="font-medium text-sm">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 m-4 bg-stone-800/50 rounded-xl border border-stone-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-bold shadow-inner border border-emerald-500/30">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.displayName || t('user')}</p>
            <p className="text-xs text-stone-500 truncate font-mono">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-700 py-2 rounded-lg transition-colors border border-stone-700 hover:border-stone-600"
        >
          <LogOut className="w-3 h-3" />
          {t('disconnect')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-400 flex-shrink-0 hidden md:flex flex-col border-r border-stone-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="fixed inset-y-0 left-0 w-64 bg-stone-900 text-stone-400 z-50 md:hidden border-r border-stone-800"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
