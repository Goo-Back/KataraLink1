import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const Hero: React.FC = () => {
  const { t, dir } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-stone-50" dir={dir}>
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-amber-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {t('heroTagline')}
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-stone-900 tracking-tight leading-[1.1] mb-6">
              {t('heroTitle')} <br />
              <span className="text-emerald-600">{t('heroTitleHighlight')}</span>
            </h1>
            
            <p className="text-xl text-stone-600 mb-8 max-w-lg leading-relaxed">
              {t('heroDescription')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login?signup=true">
                <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                  {t('startTrial')}
                </Button>
              </Link>
              <Link to="/solutions">
                <Button variant="outline" size="lg" icon={<PlayCircle className="w-5 h-5" />}>
                  {t('watchDemo')}
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 text-stone-400 grayscale opacity-70">
              {/* Placeholder logos for social proof */}
              <div className="h-8 w-24 bg-stone-300 rounded animate-pulse" />
              <div className="h-8 w-24 bg-stone-300 rounded animate-pulse" />
              <div className="h-8 w-24 bg-stone-300 rounded animate-pulse" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-200 bg-white">
              <img 
                src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2000&auto=format&fit=crop" 
                alt="Agricultural drone monitoring crop health" 
                className="w-full h-auto object-cover"
              />
              
              {/* Floating UI Elements */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-500">Soil Moisture</span>
                  <span className="text-sm font-bold text-emerald-600">Optimal</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full w-[75%] bg-emerald-500 rounded-full" />
                </div>
              </motion.div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -z-10 top-10 -right-10 w-full h-full bg-stone-200 rounded-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
