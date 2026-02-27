import React from 'react';
import { motion } from 'motion/react';
import { Users, Target, Award } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-24 pb-16"
    >
      {/* Hero Section */}
      <section className="relative bg-stone-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop" alt="Farm landscape" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Cultivating a Better Future</h1>
          <p className="text-xl text-stone-300 max-w-2xl mx-auto">
            At Katara, we believe that technology and nature can work in harmony to feed the world sustainably.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 mb-6">Our Mission</h2>
              <p className="text-lg text-stone-600 mb-6 leading-relaxed">
                To empower farmers with accessible, data-driven technology that increases productivity while regenerating the land. We are committed to building a future where agriculture is a solution to climate change, not a contributor.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <Target className="w-5 h-5" />
                  <span>Sustainability First</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <Users className="w-5 h-5" />
                  <span>Farmer Focused</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <Award className="w-5 h-5" />
                  <span>Innovation Driven</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=1000&auto=format&fit=crop" 
                alt="Farmer using tablet" 
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-emerald-600 text-white p-6 rounded-xl shadow-lg max-w-xs hidden md:block">
                <p className="font-bold text-lg mb-2">"Katara changed how we farm."</p>
                <p className="text-emerald-100 text-sm">- John D., 3rd Gen Farmer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">Our Global Impact</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              We're not just building software; we're cultivating a movement for sustainable agriculture across the globe.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              { label: "Acres Monitored", value: "500,000+", icon: <Target className="w-6 h-6 text-emerald-600" /> },
              { label: "Water Saved", value: "2B Gallons", icon: <Award className="w-6 h-6 text-blue-600" /> },
              { label: "Farmers Empowered", value: "12,000+", icon: <Users className="w-6 h-6 text-amber-600" /> },
              { label: "Yield Increase", value: "15-20%", icon: <Target className="w-6 h-6 text-purple-600" /> }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center"
              >
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  {stat.icon}
                </div>
                <h3 className="text-4xl font-bold text-stone-900 mb-2">{stat.value}</h3>
                <p className="text-stone-500 font-medium uppercase tracking-wider text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-emerald-900 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 opacity-20">
               <img src="https://images.unsplash.com/photo-1625246333195-f8196812c850?q=80&w=2000&auto=format&fit=crop" alt="Impact background" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 p-12 md:p-20 text-center text-white">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Join the Agricultural Revolution</h3>
              <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
                Whether you're a small family farm or a large enterprise, Katara has the tools you need to grow better, faster, and more sustainably.
              </p>
              <button className="bg-white text-emerald-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors shadow-lg">
                Partner With Us
              </button>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
