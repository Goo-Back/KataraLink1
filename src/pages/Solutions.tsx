import React from 'react';
import { motion } from 'motion/react';
import { Sprout, BarChart3, CloudRain, ShieldCheck, Zap, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const solutions = [
  {
    icon: <Sprout className="w-8 h-8" />,
    title: "Precision Crop Monitoring",
    description: "Our satellite-based monitoring system provides real-time insights into crop health, allowing you to detect issues before they impact yield.",
    details: ["NDVI Analysis", "Growth Stage Tracking", "Yield Prediction"]
  },
  {
    icon: <CloudRain className="w-8 h-8" />,
    title: "Smart Irrigation Management",
    description: "Optimize water usage with AI-driven irrigation schedules based on soil moisture data and weather forecasts.",
    details: ["Soil Moisture Sensors", "Weather Integration", "Automated Scheduling"]
  },
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Pest & Disease Detection",
    description: "Identify potential threats early using computer vision and historical data analysis to protect your crops.",
    details: ["Image Recognition", "Risk Mapping", "Treatment Recommendations"]
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Farm Management Software",
    description: "Centralize all your farm operations in one easy-to-use platform, from inventory management to financial reporting.",
    details: ["Inventory Tracking", "Labor Management", "Financial Analytics"]
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Energy Optimization",
    description: "Reduce energy costs and carbon footprint by optimizing machinery usage and integrating renewable energy sources.",
    details: ["Fuel Monitoring", "Renewable Integration", "Cost Analysis"]
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Sustainability Reporting",
    description: "Generate comprehensive sustainability reports to meet compliance standards and access premium markets.",
    details: ["Carbon Footprint", "Water Usage", "Biodiversity Metrics"]
  }
];

export const Solutions: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-24 pb-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-6">
            Comprehensive Solutions for Modern Agriculture
          </h1>
          <p className="text-xl text-stone-600">
            From soil to harvest, Katara provides the tools you need to optimize every aspect of your farming operation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow group"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                {solution.icon}
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">{solution.title}</h3>
              <p className="text-stone-600 mb-6 leading-relaxed">
                {solution.description}
              </p>
              <ul className="space-y-2 mb-6">
                {solution.details.map((detail, i) => (
                  <li key={i} className="flex items-center text-sm text-stone-500">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
                    {detail}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="flex items-center text-emerald-600 font-medium hover:text-emerald-700 transition-colors group-hover:translate-x-1 duration-300">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
