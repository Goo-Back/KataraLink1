import React from 'react';
import { motion } from 'motion/react';
import { Sprout, BarChart3, CloudRain, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Features: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Sprout className="w-6 h-6" />,
      title: t('cropMonitoring'),
      description: t('cropMonitoringDesc'),
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: t('yieldAnalytics'),
      description: t('yieldAnalyticsDesc'),
    },
    {
      icon: <CloudRain className="w-6 h-6" />,
      title: t('smartIrrigation'),
      description: t('smartIrrigationDesc'),
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: t('pestDetection'),
      description: t('pestDetectionDesc'),
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('energyEfficiency'),
      description: t('energyEfficiencyDesc'),
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: t('sustainabilityReports'),
      description: t('sustainabilityReportsDesc'),
    },
  ];

  return (
    <section id="solutions" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">
            {t('ourSolutions')}
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            {t('techRootedInNature')}
          </h3>
          <p className="text-lg text-stone-600">
            {t('featuresDescription')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-stone-50 hover:bg-emerald-50/50 transition-colors border border-stone-100 hover:border-emerald-100 group"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform text-emerald-600">
                {feature.icon}
              </div>
              <h4 className="text-xl font-semibold text-stone-900 mb-3">
                {feature.title}
              </h4>
              <p className="text-stone-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
