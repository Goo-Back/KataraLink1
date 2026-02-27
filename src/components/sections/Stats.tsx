import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const Stats: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    { value: "10k+", label: t('farmsManaged') },
    { value: "2.5M", label: t('acresMonitored') },
    { value: "40%", label: t('waterSaved') },
    { value: "98%", label: t('clientSatisfaction') },
  ];

  return (
    <section className="py-20 bg-emerald-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
          {stats.map((stat, index) => (
            <div key={index} className="px-4">
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
                {stat.value}
              </div>
              <div className="text-emerald-100 font-medium tracking-wide text-sm uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
