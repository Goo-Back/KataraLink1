import React from 'react';
import { Leaf, Twitter, Linkedin, Instagram, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Katara</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              {t('footerDescription')}
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors"><Github className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/solutions" className="hover:text-emerald-400 transition-colors">{t('features')}</Link></li>
              <li><Link to="/solutions" className="hover:text-emerald-400 transition-colors">{t('pricing')}</Link></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('api')}</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('integrations')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('company')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">{t('aboutUs')}</Link></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('careers')}</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('blog')}</a></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('privacyPolicy')}</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('termsOfService')}</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('cookiePolicy')}</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Katara AgTech Inc. {t('allRightsReserved')}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">{t('privacy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('terms')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('sitemap')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
