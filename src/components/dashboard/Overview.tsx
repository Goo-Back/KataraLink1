import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Sun, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  CloudRain,
  CloudSun,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sprout,
  Tractor,
  ArrowRight,
  FlaskConical,
  TestTube,
  Leaf,
  Save,
  X,
  Plus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { getCoordinates, getWeather, WeatherData } from '../../services/weather';
import { useLanguage } from '../../context/LanguageContext';

// Interfaces
interface Crop {
  id: string;
  name: string;
  plantingDate: string;
  expectedHarvestDate: string;
}

interface FieldRecord {
  id: string;
  fieldName: string;
  area: number;
  areaUnit: string;
  soilType: string;
  irrigationType: string;
  crops: Crop[];
  status: 'Active' | 'Fallow' | 'Harvested' | 'Prepared';
  notes: string;
}

interface FarmProfile {
  farmName: string;
  location: string;
  totalArea: number;
  areaUnit: string;
  soilType: string;
  irrigationType: string;
  primaryCrops: string[];
}

interface PredictionResult {
  fieldId: string;
  status: 'Irrigate' | 'Wait' | 'Critical';
  moistureLevel: number;
}

interface SoilHealth {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  lastUpdated?: any;
}

  // Enhanced Mock Data for Sensor Readings
  const getSoilData = (range: string) => {
    switch (range) {
      case '7d':
        return [
          { time: 'Mon', moisture: 42, temp: 18 },
          { time: 'Tue', moisture: 45, temp: 19 },
          { time: 'Wed', moisture: 40, temp: 21 },
          { time: 'Thu', moisture: 38, temp: 22 },
          { time: 'Fri', moisture: 44, temp: 20 },
          { time: 'Sat', moisture: 46, temp: 19 },
          { time: 'Sun', moisture: 43, temp: 18 },
        ];
      case '30d':
        return Array.from({ length: 15 }, (_, i) => ({
          time: `Day ${i * 2 + 1}`,
          moisture: 35 + Math.random() * 15,
          temp: 15 + Math.random() * 10
        }));
      case '24h':
      default:
        return [
          { time: '00:00', moisture: 48, temp: 16 },
          { time: '04:00', moisture: 46, temp: 15 },
          { time: '08:00', moisture: 45, temp: 18 },
          { time: '12:00', moisture: 38, temp: 26 },
          { time: '16:00', moisture: 35, temp: 28 },
          { time: '20:00', moisture: 40, temp: 22 },
          { time: '23:59', moisture: 44, temp: 19 },
        ];
    }
  };

  const yieldData = [
    { name: 'Wheat', actual: 4000, projected: 4200 },
    { name: 'Corn', actual: 3000, projected: 3500 },
    { name: 'Soy', actual: 2000, projected: 2800 },
  ];

  const StatCard = ({ label, value, subValue, icon: Icon, color, bg, trend, trendValue, onClick, className }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`bg-white p-6 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${onClick ? 'cursor-pointer hover:border-emerald-200 hover:ring-2 hover:ring-emerald-500/10' : ''} ${className || ''}`}
  >
    <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon className="w-24 h-24 transform translate-x-8 -translate-y-8" />
    </div>
    
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-2.5 rounded-lg ${bg} ${color} ring-1 ring-inset ring-black/5`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 
          trend === 'down' ? 'bg-red-50 text-red-700' : 
          'bg-stone-100 text-stone-600'
        }`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : 
           trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : 
           <Activity className="w-3 h-3 mr-1" />}
          {trendValue}
        </div>
      )}
    </div>
    
    <div className="relative z-10">
      <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider mb-1">{label}</h3>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-stone-900 font-mono tracking-tight">{value}</span>
      </div>
      {subValue && <p className="text-xs text-stone-400 mt-1">{subValue}</p>}
    </div>
  </motion.div>
);

const IrrigationCard = ({ criticalCount, avgMoisture, onClick }: { criticalCount: number, avgMoisture: number, onClick?: () => void }) => {
  const needsAttention = criticalCount > 0;
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`p-6 rounded-xl border shadow-sm relative overflow-hidden group transition-all ${
        needsAttention 
          ? 'bg-amber-50 border-amber-100 hover:border-amber-300 hover:shadow-md' 
          : 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:shadow-md'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-2.5 rounded-lg ring-1 ring-inset ring-black/5 ${
          needsAttention ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {needsAttention ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className={`font-medium text-xs uppercase tracking-wider mb-1 ${
          needsAttention ? 'text-amber-600' : 'text-emerald-600'
        }`}>{t('irrigation')}</h3>
        <div className="flex items-end gap-3">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            needsAttention ? 'text-amber-900' : 'text-emerald-900'
          }`}>
            {needsAttention ? `${criticalCount} ${t('criticalFields').toUpperCase()}` : t('optimal').toUpperCase()}
          </span>
        </div>
        <p className={`text-xs mt-2 ${
          needsAttention ? 'text-amber-700' : 'text-emerald-700'
        }`}>
          {t('avgSoilMoisture')}: {avgMoisture.toFixed(1)}%
        </p>
      </div>
    </motion.div>
  );
};

const WeatherCard = ({ location, weather }: { location: string, weather: WeatherData | null }) => {
  const { t } = useLanguage();
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden"
  >
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider">{t('forecast')}</h3>
      <div className="flex items-center text-xs text-stone-400">
        <MapPin className="w-3 h-3 mr-1" /> {location || 'Local'}
      </div>
    </div>
    
    {weather ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">{t('today')}</p>
              <p className="text-xs text-stone-500">{weather.current.condition}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-stone-900 font-mono">{weather.current.temp}°C</span>
            <span className="text-xs text-stone-400 block">
              H:{weather.forecast[0]?.maxTemp}° L:{weather.forecast[0]?.minTemp}°
            </span>
          </div>
        </div>
        
        <div className="w-full h-px bg-stone-100" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">{t('tomorrow')}</p>
              <p className="text-xs text-stone-500">{weather.forecast[1]?.condition}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-stone-900 font-mono">{weather.forecast[1]?.maxTemp}°C</span>
            <span className="text-xs text-stone-400 block">
              H:{weather.forecast[1]?.maxTemp}° L:{weather.forecast[1]?.minTemp}°
            </span>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-32 text-stone-400">
        <p className="text-sm">{t('loadingWeather')}</p>
      </div>
    )}
  </motion.div>
  );
};

const SoilHealthCard = ({ 
  data, 
  onEdit, 
  onSave, 
  isEditing, 
  editValues, 
  setEditValues, 
  onCancelEdit 
}: {
  data: SoilHealth | null;
  onEdit: () => void;
  onSave: () => void;
  isEditing: boolean;
  editValues: SoilHealth;
  setEditValues: (val: SoilHealth) => void;
  onCancelEdit: () => void;
}) => {
  const { t } = useLanguage();
  const nutrientLevel = (val: number) => {
    if (val < 30) return { label: t('low'), color: 'bg-red-500', text: 'text-red-600' };
    if (val > 70) return { label: t('high'), color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: t('optimal'), color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> {t('soilHealthAnalysis')}
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            {data?.lastUpdated ? `${t('updated')}: ${new Date(data.lastUpdated?.seconds * 1000).toLocaleDateString()}` : t('noData')}
          </p>
        </div>
        {!isEditing ? (
          <button 
            onClick={onEdit}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {t('updateData')}
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={onCancelEdit} className="p-1.5 text-stone-400 hover:text-stone-600 bg-stone-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <button onClick={onSave} className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-100 rounded-lg">
              <Save className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-500 block mb-1">{t('phLevel')}</label>
              <input 
                type="number" 
                step="0.1"
                value={editValues.ph}
                onChange={(e) => setEditValues({...editValues, ph: parseFloat(e.target.value)})}
                className="w-full text-sm border border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 block mb-1">{t('organicMatter')} (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={editValues.organicMatter}
                onChange={(e) => setEditValues({...editValues, organicMatter: parseFloat(e.target.value)})}
                className="w-full text-sm border border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-medium text-stone-500 block">Nutrients (N-P-K)</label>
            <div className="grid grid-cols-3 gap-2">
               <div className="space-y-1">
                 <span className="text-[10px] uppercase text-stone-400 font-bold">{t('nitrogen')}</span>
                 <input 
                    type="number" 
                    value={editValues.nitrogen}
                    onChange={(e) => setEditValues({...editValues, nitrogen: parseFloat(e.target.value)})}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2"
                    placeholder="N"
                 />
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] uppercase text-stone-400 font-bold">{t('phosphorus')}</span>
                 <input 
                    type="number" 
                    value={editValues.phosphorus}
                    onChange={(e) => setEditValues({...editValues, phosphorus: parseFloat(e.target.value)})}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2"
                    placeholder="P"
                 />
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] uppercase text-stone-400 font-bold">{t('potassium')}</span>
                 <input 
                    type="number" 
                    value={editValues.potassium}
                    onChange={(e) => setEditValues({...editValues, potassium: parseFloat(e.target.value)})}
                    className="w-full text-sm border border-stone-200 rounded-lg p-2"
                    placeholder="K"
                 />
               </div>
            </div>
          </div>
          <div className="pt-2">
             <button 
                onClick={() => alert(t('featureComingSoon'))}
                className="w-full py-2 text-xs font-medium text-stone-500 border border-dashed border-stone-300 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
             >
                <Plus className="w-3 h-3" /> {t('connectSoilKit')}
             </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <TestTube className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-stone-900">{t('phLevel')}</p>
                    <p className="text-xs text-stone-500">{t('target')}: 6.0 - 7.0</p>
                 </div>
              </div>
              <div className="text-right">
                 <span className={`text-xl font-bold font-mono ${data?.ph && (data.ph < 6 || data.ph > 7.5) ? 'text-amber-600' : 'text-stone-900'}`}>
                    {data?.ph || '--'}
                 </span>
              </div>
           </div>

           <div className="space-y-3">
              {['Nitrogen', 'Phosphorus', 'Potassium'].map((nutrient) => {
                 const key = nutrient.toLowerCase() as keyof SoilHealth;
                 const val = data ? (data[key] as number) : 0;
                 const status = nutrientLevel(val);
                 
                 return (
                    <div key={nutrient} className="space-y-1">
                       <div className="flex justify-between text-xs">
                          <span className="font-medium text-stone-600">{t(nutrient.toLowerCase() as any)}</span>
                          <span className={status.text}>{status.label} ({val})</span>
                       </div>
                       <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                             className={`h-full rounded-full ${status.color}`} 
                             style={{ width: `${Math.min(val, 100)}%` }}
                          />
                       </div>
                    </div>
                 );
              })}
           </div>

           <div className="flex items-center justify-between pt-2 border-t border-stone-50">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                 <Leaf className="w-3 h-3" /> {t('organicMatter')}
              </div>
              <span className="text-sm font-bold text-stone-900">{data?.organicMatter || '--'}%</span>
           </div>
        </div>
      )}
    </motion.div>
  );
};

interface OverviewProps {
  onNavigate: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  // Soil Health State
  const [soilHealth, setSoilHealth] = useState<SoilHealth | null>(null);
  const [isEditingSoil, setIsEditingSoil] = useState(false);
  const [soilEditValues, setSoilEditValues] = useState<SoilHealth>({
    ph: 6.5,
    nitrogen: 50,
    phosphorus: 50,
    potassium: 50,
    organicMatter: 3.0
  });

  // Fetch Soil Health
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, `users/${user.uid}/soil_health`, 'current'), (doc) => {
        if (doc.exists()) {
            const data = doc.data() as SoilHealth;
            setSoilHealth(data);
            setSoilEditValues(data);
        }
    });
    return () => unsub();
  }, [user]);

  const handleSaveSoil = async () => {
    if (!user) return;
    try {
        await setDoc(doc(db, `users/${user.uid}/soil_health`, 'current'), {
            ...soilEditValues,
            lastUpdated: serverTimestamp()
        });
        setIsEditingSoil(false);
    } catch (error) {
        console.error("Error saving soil data:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch Farm Profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().farmProfile) {
          const profile = userDoc.data().farmProfile as FarmProfile;
          setFarmProfile(profile);

          // Fetch Weather if location exists
          if (profile.location) {
            getCoordinates(profile.location).then(coords => {
              if (coords) {
                getWeather(coords.lat, coords.lon).then(data => {
                  setWeather(data);
                });
              }
            });
          }
        }

        // Fetch Fields
        const q = query(collection(db, `users/${user.uid}/fields`));
        const unsubscribeFields = onSnapshot(q, (snapshot) => {
          const fieldsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FieldRecord[];
          setFields(fieldsData);
        });

        // Fetch Predictions
        const predsQ = query(collection(db, `users/${user.uid}/irrigation_predictions`));
        const unsubscribePreds = onSnapshot(predsQ, (snapshot) => {
          const predsData = snapshot.docs.map(doc => doc.data() as PredictionResult);
          setPredictions(predsData);
          setLoading(false);
        });

        return () => {
          unsubscribeFields();
          unsubscribePreds();
        };
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Derived Stats
  const totalCultivatedArea = fields.reduce((acc, field) => acc + Number(field.area), 0);
  const activeFieldsCount = fields.filter(f => f.status === 'Active').length;
  const totalFarmArea = farmProfile?.totalArea || 0;
  const utilizationRate = totalFarmArea > 0 ? (totalCultivatedArea / totalFarmArea) * 100 : 0;

  // Irrigation Stats
  const avgMoisture = predictions.length > 0 
    ? predictions.reduce((acc, curr) => acc + curr.moistureLevel, 0) / predictions.length 
    : 0;
  
  const criticalFieldsCount = predictions.filter(p => p.status === 'Irrigate' || p.status === 'Critical').length;

  // Crop Distribution for Chart
  const cropDistribution = fields.reduce((acc: any[], field) => {
    if (!field.crops || field.crops.length === 0) return acc;
    const areaPerCrop = Number(field.area) / field.crops.length;
    field.crops.forEach(crop => {
      const existing = acc.find(c => c.name === crop.name);
      if (existing) {
        existing.value += areaPerCrop;
      } else {
        acc.push({ name: crop.name, value: areaPerCrop });
      }
    });
    return acc;
  }, []);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];

  const [showAlert, setShowAlert] = useState(true);

  // ... (existing code)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Critical Alert Banner */}
      <AnimatePresence>
        {showAlert && criticalFieldsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, mb: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-red-900">{t('actionRequired')}</h3>
                <p className="text-sm text-red-700">
                  {criticalFieldsCount} {t('fields')} {t('requireImmediateIrrigation')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('irrigation')}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                {t('viewFields')}
              </button>
              <button 
                onClick={() => setShowAlert(false)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {farmProfile?.farmName ? `${t('welcome')} ${farmProfile.farmName}` : t('dashboardOverview')}
          </h1>
          <p className="text-stone-500 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {farmProfile?.location || t('locationNotSet')}
          </p>
        </div>
        <div className="flex gap-3">
           <div 
             onClick={() => onNavigate('settings')}
             className="px-4 py-2 bg-white rounded-lg border border-stone-200 shadow-sm text-sm cursor-pointer hover:border-emerald-300 transition-colors"
           >
             <span className="text-stone-500">{t('totalArea')}:</span> <span className="font-bold text-stone-900">{totalFarmArea} {farmProfile?.areaUnit || 'acres'}</span>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label={t('avgSoilMoisture')}
          value={avgMoisture > 0 ? `${avgMoisture.toFixed(1)}%` : '--'} 
          subValue={predictions.length > 0 ? `${t('basedOn')} ${predictions.length} ${t('fields')}` : t('noData')}
          icon={Droplets} 
          color="text-blue-600" 
          bg="bg-blue-50" 
          onClick={() => onNavigate('irrigation')}
        />
        <StatCard 
          label={t('soilTemperature')}
          value={weather?.current.soilTemp ? `${weather.current.soilTemp}°C` : '--'} 
          trendValue={weather?.current.soilTemp ? t('realTime') : "N/A"}
          trend={weather?.current.soilTemp ? "up" : undefined}
          icon={Thermometer} 
          color="text-orange-600" 
          bg="bg-orange-50" 
        />
        <StatCard 
          label={t('landUtilization')}
          value={`${utilizationRate.toFixed(1)}%`} 
          subValue={`${totalCultivatedArea.toFixed(1)} / ${totalFarmArea} ${farmProfile?.areaUnit || 'acres'} ${t('used')}`}
          icon={Tractor} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
          trend={utilizationRate > 80 ? 'up' : 'down'}
          trendValue={utilizationRate > 80 ? t('high') : t('low')}
          onClick={() => onNavigate('land')}
        />
        <WeatherCard location={farmProfile?.location || ''} weather={weather} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart - Environmental */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-stone-900">{t('environmentalConditions')}</h2>
              <p className="text-sm text-stone-500">{t('realTimeSensorData')}</p>
            </div>
            <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-lg border border-stone-200">
              {['24h', '7d', '30d'].map((range) => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeRange === range 
                      ? 'bg-white text-stone-900 shadow-sm border border-stone-200' 
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getSoilData(timeRange)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#78716c', fontSize: 12, fontFamily: 'monospace' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#78716c', fontSize: 12, fontFamily: 'monospace' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px', 
                    border: '1px solid #e7e5e4', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontFamily: 'monospace'
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="moisture" 
                  name="Moisture (%)"
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorMoisture)" 
                  animationDuration={1000}
                />
                <Area 
                  type="monotone" 
                  dataKey="temp" 
                  name="Temp (°C)"
                  stroke="#f97316" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorTemp)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart - Field Moisture Levels */}
        <div 
          onClick={() => onNavigate('irrigation')}
          className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex flex-col cursor-pointer hover:border-emerald-200 hover:ring-2 hover:ring-emerald-500/10 transition-all group"
        >
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">{t('fieldMoistureLevels')}</h2>
              <p className="text-sm text-stone-500">{t('soilSaturationByField')}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          
          <div className="flex-1 min-h-[250px]">
            {fields.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fields.map(f => {
                  const pred = predictions.find(p => p.fieldId === f.id);
                  return {
                    name: f.fieldName,
                    moisture: pred ? pred.moistureLevel : 0,
                    status: pred ? pred.status : 'Unknown'
                  };
                })}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f4' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="moisture" name="Moisture %" radius={[4, 4, 0, 0]}>
                    {fields.map((f, index) => {
                      const pred = predictions.find(p => p.fieldId === f.id);
                      const color = !pred ? '#e5e7eb' : 
                                    pred.moistureLevel < 30 ? '#ef4444' : 
                                    pred.moistureLevel < 50 ? '#f59e0b' : '#10b981';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-100 rounded-lg">
                <Droplets className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">{t('noFieldsData')}</p>
                <p className="text-xs mt-1">{t('addFieldsToSee')}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-stone-100">
             <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">Critical Fields</span>
                <span className={`font-bold ${criticalFieldsCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {criticalFieldsCount} Fields
                </span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Irrigation & Soil Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <IrrigationCard 
           criticalCount={criticalFieldsCount} 
           avgMoisture={avgMoisture} 
           onClick={() => onNavigate('irrigation')}
         />
         <SoilHealthCard 
            data={soilHealth}
            isEditing={isEditingSoil}
            onEdit={() => setIsEditingSoil(true)}
            onCancelEdit={() => {
                setIsEditingSoil(false);
                if (soilHealth) setSoilEditValues(soilHealth);
            }}
            onSave={handleSaveSoil}
            editValues={soilEditValues}
            setEditValues={setSoilEditValues}
         />
      </div>
    </div>
  );
};
