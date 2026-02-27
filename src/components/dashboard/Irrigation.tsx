import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  CloudRain, 
  Sun, 
  Wind, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  Sprout,
  MapPin,
  RefreshCw,
  History,
  Thermometer,
  Activity,
  MoreHorizontal,
  Calendar,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, getDoc, setDoc, serverTimestamp, getDocs, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { GoogleGenAI, Type } from "@google/genai";
import { getCoordinates, getWeather, WeatherData } from '../../services/weather';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Crop {
  id: string;
  name: string;
  plantingDate: string;
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
}

interface FarmProfile {
  location: string;
  farmName: string;
}

interface PredictionResult {
  fieldId: string;
  status: 'Irrigate' | 'Wait' | 'Critical';
  moistureLevel: number;
  recommendation: string;
  waterAmount: string;
  nextIrrigation: string;
  confidence: number;
  evapotranspiration: number; // mm/day
  fieldCapacity: number; // %
  wiltingPoint: number; // %
  forecast: { day: string; moisture: number; rainProb: number }[];
  lastUpdated?: any;
}

interface IrrigationEvent {
  id: string;
  fieldId: string;
  date: any;
  type: string;
  amount: string;
}

export const Irrigation: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>({});
  const [loadingPredictions, setLoadingPredictions] = useState<Record<string, boolean>>({});
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [loggingWater, setLoggingWater] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [history, setHistory] = useState<IrrigationEvent[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
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

      // Fetch Active Fields
      const q = query(collection(db, `users/${user.uid}/fields`));
      const unsubscribeFields = onSnapshot(q, (snapshot) => {
        const fieldsData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as FieldRecord))
          .filter(f => f.status === 'Active');
        setFields(fieldsData);
        if (fieldsData.length > 0 && !selectedFieldId) {
          setSelectedFieldId(fieldsData[0].id);
        }
      });

      // Fetch Saved Predictions
      const predsQ = query(collection(db, `users/${user.uid}/irrigation_predictions`));
      const unsubscribePreds = onSnapshot(predsQ, (snapshot) => {
        const predsData: Record<string, PredictionResult> = {};
        snapshot.docs.forEach(doc => {
          predsData[doc.id] = doc.data() as PredictionResult;
        });
        setPredictions(predsData);
      });

      // Fetch Irrigation History
      const historyQ = query(
        collection(db, `users/${user.uid}/irrigation_events`),
        orderBy('date', 'desc'),
        limit(20)
      );
      const unsubscribeHistory = onSnapshot(historyQ, (snapshot) => {
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as IrrigationEvent[];
        setHistory(historyData);
      });

      return () => {
        unsubscribeFields();
        unsubscribePreds();
        unsubscribeHistory();
      };
    };

    fetchData();
  }, [user]);

  const getIrrigationLabel = (type: string) => {
    const map: Record<string, string> = {
      'Rain-fed': 'rainFed',
      'Drip': 'drip',
      'Sprinkler': 'sprinkler',
      'Flood': 'flood',
      'Pivot': 'pivot'
    };
    return t(map[type] || 'rainFed');
  };

  const getSoilLabel = (type: string) => {
    const map: Record<string, string> = {
      'Loam': 'loam',
      'Clay': 'clay',
      'Sandy': 'sandy',
      'Silt': 'silt',
      'Peat': 'peat',
      'Chalk': 'chalk'
    };
    return t(map[type] || 'loam');
  };

  const getAreaUnitLabel = (unit: string) => {
    const map: Record<string, string> = {
      'acres': 'acres',
      'hectares': 'hectares',
      'sqm': 'sqm'
    };
    return t(map[unit] || 'acres');
  };

  const analyzeField = async (field: FieldRecord) => {
    if (!process.env.GEMINI_API_KEY) {
      alert(t('geminiKeyMissing'));
      return;
    }
    if (!user) return;

    setLoadingPredictions(prev => ({ ...prev, [field.id]: true }));

    try {
      const cropNames = field.crops?.map(c => c.name).join(', ') || field.fieldName;
      const plantingDate = field.crops?.[0]?.plantingDate || t('unknown');
      const location = farmProfile?.location || t('unknown');
      const today = new Date().toISOString().split('T')[0];

      const weatherContext = weather ? `
        Real-time Weather Forecast for ${location}:
        Current: ${weather.current.temp}°C, ${weather.current.condition}, Humidity ${weather.current.humidity}%
        Soil Temperature (6cm depth): ${weather.current.soilTemp}°C
        Soil Moisture (3-9cm depth): ${weather.current.soilMoisture} m³/m³
        Forecast:
        ${weather.forecast.map(d => `- ${d.date}: ${d.condition}, Max ${d.maxTemp}°C, Min ${d.minTemp}°C, Rain Prob ${d.rainProb}%`).join('\n')}
      ` : 'Assume typical weather for this season and location.';

      const prompt = `
        Act as an expert agronomist AI. Analyze irrigation needs for this field:
        - Field Name: ${field.fieldName}
        - Location: ${location}
        - Soil Type: ${field.soilType}
        - Crops: ${cropNames} (Planted: ${plantingDate})
        - Irrigation Method: ${field.irrigationType}
        - Field Size: ${field.area} ${field.areaUnit}
        - Current Date: ${today}
        
        ${weatherContext}
        
        Consider the soil temperature and moisture data if available.
        
        IMPORTANT: Provide the 'recommendation', 'waterAmount', and 'nextIrrigation' fields in ${language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English'}.
        
        Provide a JSON response with the following schema:
        {
          "status": "Irrigate" | "Wait" | "Critical",
          "moistureLevel": number (0-100),
          "recommendation": "string (max 15 words)",
          "waterAmount": "string (e.g., '15mm' or '2000 Liters')",
          "nextIrrigation": "string (e.g., 'In 2 days' or 'Today')",
          "confidence": number (0-100),
          "evapotranspiration": number (mm/day estimate),
          "fieldCapacity": number (soil capacity %),
          "wiltingPoint": number (wilting point %),
          "forecast": [
            { "day": "Mon", "moisture": number, "rainProb": number },
            { "day": "Tue", "moisture": number, "rainProb": number },
            { "day": "Wed", "moisture": number, "rainProb": number },
            { "day": "Thu", "moisture": number, "rainProb": number },
            { "day": "Fri", "moisture": number, "rainProb": number },
            { "day": "Sat", "moisture": number, "rainProb": number },
            { "day": "Sun", "moisture": number, "rainProb": number }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["Irrigate", "Wait", "Critical"] },
              moistureLevel: { type: Type.NUMBER },
              recommendation: { type: Type.STRING },
              waterAmount: { type: Type.STRING },
              nextIrrigation: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              evapotranspiration: { type: Type.NUMBER },
              fieldCapacity: { type: Type.NUMBER },
              wiltingPoint: { type: Type.NUMBER },
              forecast: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING },
                    moisture: { type: Type.NUMBER },
                    rainProb: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      const predictionData: PredictionResult = { 
        fieldId: field.id, 
        ...result,
        lastUpdated: serverTimestamp()
      };

      await setDoc(doc(db, `users/${user.uid}/irrigation_predictions`, field.id), predictionData);

    } catch (error) {
      console.error(`Error analyzing field ${field.fieldName}:`, error);
    } finally {
      setLoadingPredictions(prev => ({ ...prev, [field.id]: false }));
    }
  };

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true);
    await Promise.all(fields.map(field => analyzeField(field)));
    setAnalyzingAll(false);
  };

  const logIrrigation = async (fieldId: string) => {
    if (!user) return;
    setLoggingWater(fieldId);
    try {
      await addDoc(collection(db, `users/${user.uid}/irrigation_events`), {
        fieldId,
        date: serverTimestamp(),
        type: 'Manual',
        amount: 'Standard'
      });

      const currentPred = predictions[fieldId];
      if (currentPred) {
        const updatedPred = {
          ...currentPred,
          status: 'Wait' as const,
          moistureLevel: 90,
          recommendation: t('fieldIrrigatedRecommendation'),
          nextIrrigation: t('in3to4Days'),
          lastUpdated: serverTimestamp()
        };
        await setDoc(doc(db, `users/${user.uid}/irrigation_predictions`, fieldId), updatedPred);
      }
    } catch (error) {
      console.error("Error logging irrigation:", error);
    } finally {
      setLoggingWater(null);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!user || !window.confirm(t('deleteLogConfirm'))) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/irrigation_events`, id));
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  const allPredictions = Object.values(predictions) as PredictionResult[];
  const fieldsNeedingWater = allPredictions.filter(p => p.status === 'Irrigate' || p.status === 'Critical').length;
  const avgMoisture = allPredictions.reduce((acc, curr) => acc + curr.moistureLevel, 0) / (allPredictions.length || 1);
  
  const selectedField = fields.find(f => f.id === selectedFieldId);
  const selectedPrediction = selectedFieldId ? predictions[selectedFieldId] : null;

  const radarData = selectedPrediction ? [
    { subject: t('moisture'), A: selectedPrediction.moistureLevel, fullMark: 100 },
    { subject: t('nitrogen'), A: 80, fullMark: 100 },
    { subject: t('phosphorus'), A: 65, fullMark: 100 },
    { subject: t('potassium'), A: 70, fullMark: 100 },
    { subject: t('ph'), A: 90, fullMark: 100 },
    { subject: t('organic'), A: 75, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t('irrigationTitle')}</h1>
          <p className="text-stone-500">{t('irrigationSubtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleAnalyzeAll} 
            disabled={analyzingAll || fields.length === 0}
            icon={analyzingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
          >
            {analyzingAll ? t('analyzingFarm') : t('runAnalysis')}
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">{t('avgSoilMoisture')}</p>
            <h3 className="text-2xl font-bold text-stone-900">
              {avgMoisture > 0 ? avgMoisture.toFixed(1) : '--'} 
              <span className="text-sm font-normal text-stone-500">%</span>
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">{t('systemStatus')}</p>
            <h3 className="text-2xl font-bold text-stone-900">{t('optimal')} <span className="text-sm font-normal text-stone-500">{t('efficiency')}</span></h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">{t('fieldsNeedingWater')}</p>
            <h3 className="text-2xl font-bold text-stone-900">
              {fieldsNeedingWater}
              <span className="text-sm font-normal text-stone-500"> / {fields.length}</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Field List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-stone-900">{t('activeFieldsCount')}</h3>
            <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-full">{fields.length} {t('fieldsCount')}</span>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {fields.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center">
                <p className="text-stone-500 text-sm">{t('noActiveFields')}</p>
              </div>
            ) : (
              fields.map((field) => {
                const prediction = predictions[field.id];
                const isSelected = selectedFieldId === field.id;
                const isLoading = loadingPredictions[field.id];

                return (
                  <div 
                    key={field.id}
                    onClick={() => setSelectedFieldId(field.id)}
                    className={`bg-white p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${
                      isSelected 
                        ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' 
                        : 'border-stone-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-stone-900 text-sm">{field.fieldName}</h4>
                      {prediction ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          prediction.status === 'Critical' ? 'bg-red-100 text-red-700' :
                          prediction.status === 'Irrigate' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {prediction.status}
                        </span>
                      ) : (
                        <span className="text-stone-300">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                      <Sprout className="w-3 h-3" />
                      <span className="truncate max-w-[80px]">{field.crops?.[0]?.name || t('unknown')}</span>
                      <span className="text-stone-300">|</span>
                      <span>{field.area} {getAreaUnitLabel(field.areaUnit)}</span>
                    </div>

                    {prediction ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">{t('moisture')}</span>
                          <span className="font-mono font-bold text-stone-700">{prediction.moistureLevel}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              prediction.moistureLevel < 30 ? 'bg-red-500' : 
                              prediction.moistureLevel < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${prediction.moistureLevel}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400 italic flex items-center gap-1 h-6">
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
                        {isLoading ? t('analyzing') : t('pendingAnalysis')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* History Section */}
          <div className="mt-6 pt-6 border-t border-stone-200">
            <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              {t('recentLogs')}
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {history.length === 0 ? (
                <p className="text-xs text-stone-400 italic">{t('noIrrigationHistory')}</p>
              ) : (
                history.map(event => {
                  const field = fields.find(f => f.id === event.fieldId);
                  return (
                    <div key={event.id} className="bg-white p-3 rounded-lg border border-stone-200 text-xs flex justify-between items-center group">
                      <div>
                        <p className="font-medium text-stone-700">{field?.fieldName || t('unknownField')}</p>
                        <p className="text-stone-400">{event.date?.toDate ? event.date.toDate().toLocaleDateString() : t('justNow')}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteHistory(event.id)}
                        className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Analysis */}
        <div className="lg:col-span-8 space-y-6">
          {selectedField && selectedPrediction ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={selectedField.id}
              className="space-y-6"
            >
              {/* Field Status Hero */}
              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-stone-100">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                      {selectedField.fieldName}
                      <span className="text-sm font-normal text-stone-400">{t('analysis')}</span>
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                      {getSoilLabel(selectedField.soilType)} {t('soil')} • {getIrrigationLabel(selectedField.irrigationType)} {t('system')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => analyzeField(selectedField)}
                      disabled={loadingPredictions[selectedField.id]}
                      icon={loadingPredictions[selectedField.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    >
                      {t('refresh')}
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => logIrrigation(selectedField.id)}
                      disabled={loggingWater === selectedField.id}
                      icon={loggingWater === selectedField.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Droplets className="w-3 h-3" />}
                    >
                      {t('logWater')}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="text-xs text-stone-500 mb-1">{t('currentMoisture')}</div>
                    <div className="text-2xl font-bold text-stone-900">{selectedPrediction.moistureLevel}%</div>
                    <div className={`text-xs font-medium mt-1 ${selectedPrediction.moistureLevel > 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedPrediction.moistureLevel > 40 ? t('optimal') : t('low')}
                    </div>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="text-xs text-stone-500 mb-1">{t('evapotranspiration')}</div>
                    <div className="text-2xl font-bold text-stone-900">{selectedPrediction.evapotranspiration || '-'}</div>
                    <div className="text-xs text-stone-400 mt-1">{t('mmDay')}</div>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="text-xs text-stone-500 mb-1">{t('fieldCapacity')}</div>
                    <div className="text-2xl font-bold text-stone-900">{selectedPrediction.fieldCapacity || '-'}%</div>
                    <div className="text-xs text-stone-400 mt-1">{t('retentionLimit')}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-600 mb-1">{t('nextIrrigation')}</div>
                    <div className="text-xl font-bold text-blue-900">{selectedPrediction.nextIrrigation}</div>
                    <div className="text-xs text-blue-700 mt-1 font-medium">{selectedPrediction.waterAmount}</div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Forecast Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                  <h3 className="font-bold text-stone-900 mb-6 flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    {t('moistureProjection')}
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedPrediction.forecast || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#78716c', fontSize: 12 }} 
                          dy={10}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#78716c', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <ReferenceLine y={selectedPrediction.wiltingPoint || 20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: t('wiltingPoint'), fill: '#ef4444', fontSize: 10, position: 'insideRight' }} />
                        <ReferenceLine y={selectedPrediction.fieldCapacity || 80} stroke="#10b981" strokeDasharray="3 3" label={{ value: t('fieldCapacity'), fill: '#10b981', fontSize: 10, position: 'insideRight' }} />
                        <Area 
                          type="monotone" 
                          dataKey="moisture" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          fill="url(#colorMoisture)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col">
                  <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    {t('soilHealthIndex')}
                  </h3>
                  <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar 
                          name={t('current')}
                          dataKey="A" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fill="#10b981" 
                          fillOpacity={0.2} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* AI Insight Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <RefreshCw className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    {t('aiRecommendation')}
                  </h3>
                  <p className="text-indigo-800 text-lg leading-relaxed font-medium">
                    "{selectedPrediction.recommendation}"
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-indigo-600 font-medium">
                    <span className="bg-white/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {t('confidenceScore')}: {selectedPrediction.confidence}%
                    </span>
                    <span className="bg-white/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {t('lastAnalysis')}: {selectedPrediction.lastUpdated ? t('justNow') : t('recently')}
                    </span>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center text-stone-400 bg-stone-50/50 rounded-xl border-2 border-dashed border-stone-200">
              <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                <Sprout className="w-12 h-12 text-stone-300" />
              </div>
              <h3 className="text-xl font-bold text-stone-600 mb-2">{t('selectField')}</h3>
              <p className="text-stone-500 max-w-sm text-center">
                {t('selectFieldDesc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
