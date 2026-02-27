import React from 'react';
import { Hero } from '../components/sections/Hero';
import { Features } from '../components/sections/Features';
import { Stats } from '../components/sections/Stats';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Home: React.FC = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <Features />
      <Stats />
      
      {/* Call to Action Section */}
      <section className="py-24 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6">
            {t('readyToTransform')}
          </h2>
          <p className="text-lg text-stone-600 mb-10 max-w-2xl mx-auto">
            {t('joinFarmers')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login?signup=true" className="px-8 py-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
              {t('createAccount')}
            </Link>
            <Link to="/contact" className="px-8 py-4 bg-white text-stone-700 border border-stone-200 rounded-lg font-semibold hover:bg-stone-50 transition-colors">
              {t('contactSales')}
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
