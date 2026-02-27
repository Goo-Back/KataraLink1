import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Sprout, MapPin, Ruler, Droplets, Layers, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmName: '',
    location: '',
    totalArea: '',
    areaUnit: 'acres',
    soilType: 'Loam',
    irrigationType: 'Rain-fed',
    primaryCrops: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Save farm profile to Firestore under the user's document
      await setDoc(doc(db, 'users', user.uid), {
        farmProfile: {
          ...formData,
          totalArea: Number(formData.totalArea),
          primaryCrops: formData.primaryCrops.split(',').map(c => c.trim()), // Convert to array
          updatedAt: serverTimestamp()
        },
        onboardingCompleted: true
      }, { merge: true });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving farm profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-600 p-3 rounded-xl shadow-lg shadow-emerald-600/20">
            <Sprout className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-stone-900 tracking-tight">
          Setup Your Farm Profile
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600 max-w-sm mx-auto">
          To provide accurate AI forecasting and yield analysis, we need a few details about your land.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-xl shadow-stone-200/50 sm:rounded-2xl sm:px-10 border border-stone-100"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Farm Name */}
            <div>
              <label htmlFor="farmName" className="block text-sm font-medium text-stone-700 mb-1">
                Farm Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Sprout className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="text"
                  name="farmName"
                  id="farmName"
                  required
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-stone-300 rounded-lg py-2.5"
                  placeholder="e.g. Green Valley Farms"
                  value={formData.farmName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-stone-700 mb-1">
                Location (Region/City)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-stone-300 rounded-lg py-2.5"
                  placeholder="e.g. California, Central Valley"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Area Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="totalArea" className="block text-sm font-medium text-stone-700 mb-1">
                  Total Area
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Ruler className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="number"
                    name="totalArea"
                    id="totalArea"
                    required
                    min="0"
                    step="0.1"
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-stone-300 rounded-lg py-2.5"
                    placeholder="0.0"
                    value={formData.totalArea}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="areaUnit" className="block text-sm font-medium text-stone-700 mb-1">
                  Unit
                </label>
                <select
                  id="areaUnit"
                  name="areaUnit"
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-stone-300 rounded-lg py-2.5 bg-white"
                  value={formData.areaUnit}
                  onChange={handleChange}
                >
                  <option value="acres">Acres</option>
                  <option value="hectares">Hectares</option>
                  <option value="sqm">Sq Meters</option>
                </select>
              </div>
            </div>

            {/* Soil Type */}
            <div>
              <label htmlFor="soilType" className="block text-sm font-medium text-stone-700 mb-1">
                Predominant Soil Type
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Layers className="h-5 w-5 text-stone-400" />
                </div>
                <select
                  id="soilType"
                  name="soilType"
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-stone-300 rounded-lg py-2.5 bg-white"
                  value={formData.soilType}
                  onChange={handleChange}
                >
                  <option value="Loam">Loam (Balanced)</option>
                  <option value="Clay">Clay (Heavy)</option>
                  <option value="Sandy">Sandy (Light)</option>
                  <option value="Silt">Silt</option>
                  <option value="Peat">Peat</option>
                  <option value="Chalk">Chalky</option>
                </select>
              </div>
            </div>

            {/* Irrigation Type */}
            <div>
              <label htmlFor="irrigationType" className="block text-sm font-medium text-stone-700 mb-1">
                Primary Irrigation Method
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Droplets className="h-5 w-5 text-stone-400" />
                </div>
                <select
                  id="irrigationType"
                  name="irrigationType"
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-stone-300 rounded-lg py-2.5 bg-white"
                  value={formData.irrigationType}
                  onChange={handleChange}
                >
                  <option value="Rain-fed">Rain-fed (None)</option>
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Sprinkler System</option>
                  <option value="Flood">Surface / Flood</option>
                  <option value="Pivot">Center Pivot</option>
                </select>
              </div>
            </div>

            {/* Primary Crops */}
            <div>
              <label htmlFor="primaryCrops" className="block text-sm font-medium text-stone-700 mb-1">
                Primary Crops (Comma separated)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Sprout className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="text"
                  name="primaryCrops"
                  id="primaryCrops"
                  required
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-stone-300 rounded-lg py-2.5"
                  placeholder="e.g. Corn, Wheat, Soybeans"
                  value={formData.primaryCrops}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center">
                    Complete Setup <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
