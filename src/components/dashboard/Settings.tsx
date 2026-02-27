import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Save, Loader2, MapPin, Ruler, Layers, Droplets, Sprout } from 'lucide-react';

interface FarmProfile {
  farmName: string;
  location: string;
  latitude?: number;
  longitude?: number;
  totalArea: number;
  areaUnit: string;
  soilType: string;
  irrigationType: string;
  primaryCrops: string[];
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [formData, setFormData] = useState<FarmProfile>({
    farmName: '',
    location: '',
    totalArea: 0,
    areaUnit: 'acres',
    soilType: 'Loam',
    irrigationType: 'Rain-fed',
    primaryCrops: []
  });
  const [cropInput, setCropInput] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().farmProfile) {
          setFormData(userDoc.data().farmProfile as FarmProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalArea' ? Number(value) : value
    }));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding to get a readable address (optional but nice)
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          const locationName = `${data.city || data.locality}, ${data.principalSubdivision || ''}, ${data.countryName}`;
          
          setFormData(prev => ({
            ...prev,
            location: locationName,
            latitude,
            longitude
          }));
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          // Fallback to coordinates string if reverse geocoding fails
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude
          }));
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please allow location access.");
        setDetectingLocation(false);
      }
    );
  };

  const handleAddCrop = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && cropInput.trim()) {
      e.preventDefault();
      if (!formData.primaryCrops.includes(cropInput.trim())) {
        setFormData(prev => ({
          ...prev,
          primaryCrops: [...prev.primaryCrops, cropInput.trim()]
        }));
      }
      setCropInput('');
    }
  };

  const removeCrop = (cropToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      primaryCrops: prev.primaryCrops.filter(c => c !== cropToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        farmProfile: formData
      }, { merge: true });
      // Optional: Show success toast
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-stone-400" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-xl font-bold text-stone-900">Farm Profile Settings</h2>
          <p className="text-stone-500 text-sm mt-1">Manage your farm's core configuration and preferences.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* General Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Farm Name</label>
                <input
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. Green Valley Farm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. California, USA"
                  />
                  <Button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    variant="outline"
                    icon={detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    title="Detect Current Location"
                  >
                    {detectingLocation ? 'Detecting...' : 'Detect'}
                  </Button>
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-stone-400 mt-1">
                    Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-stone-100" />

          {/* Land Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Ruler className="w-4 h-4 text-blue-600" /> Land Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Total Area</label>
                <input
                  type="number"
                  name="totalArea"
                  value={formData.totalArea}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Unit</label>
                <select
                  name="areaUnit"
                  value={formData.areaUnit}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="acres">Acres</option>
                  <option value="hectares">Hectares</option>
                  <option value="sqm">Square Meters</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Primary Soil Type</label>
                <div className="relative">
                  <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="Loam">Loam</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Silt">Silt</option>
                    <option value="Peat">Peat</option>
                    <option value="Chalk">Chalk</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-stone-100" />

          {/* Operations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600" /> Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Primary Irrigation System</label>
                <div className="relative">
                  <Droplets className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <select
                    name="irrigationType"
                    value={formData.irrigationType}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="Rain-fed">Rain-fed</option>
                    <option value="Drip">Drip Irrigation</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Flood">Flood / Furrow</option>
                    <option value="Pivot">Center Pivot</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Primary Crops (Press Enter to add)</label>
                <input
                  type="text"
                  value={cropInput}
                  onChange={(e) => setCropInput(e.target.value)}
                  onKeyDown={handleAddCrop}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Type crop name and press Enter"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.primaryCrops.map((crop, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                      {crop}
                      <button
                        type="button"
                        onClick={() => removeCrop(crop)}
                        className="ml-1.5 text-emerald-400 hover:text-emerald-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex justify-end">
            <Button 
              type="submit" 
              disabled={saving}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            >
              {saving ? 'Saving Changes...' : 'Save Configuration'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
