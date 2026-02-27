import React from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { TopBar } from '../components/dashboard/TopBar';
import { Overview } from '../components/dashboard/Overview';
import { LandAndCrops } from '../components/dashboard/LandAndCrops';
import { Irrigation } from '../components/dashboard/Irrigation';
import { Settings } from '../components/dashboard/Settings';
import { CropDoctor } from '../components/dashboard/CropDoctor';
import { Tasks } from '../components/dashboard/Tasks';
import { useState } from 'react';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getTitle = (tab: string) => {
    switch (tab) {
      case 'land': return 'Land & Crops';
      case 'doctor': return 'Crop Doctor';
      case 'tasks': return 'Tasks';
      case 'irrigation': return 'Smart Irrigation';
      case 'settings': return 'Settings';
      default: return 'Overview';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar 
          title={getTitle(activeTab)} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <Overview onNavigate={setActiveTab} />}
            {activeTab === 'land' && <LandAndCrops />}
            {activeTab === 'irrigation' && <Irrigation />}
            {activeTab === 'doctor' && <CropDoctor />}
            {activeTab === 'tasks' && <Tasks />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </main>
    </div>
  );
};
