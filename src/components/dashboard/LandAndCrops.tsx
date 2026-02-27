import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MapPin, 
  Ruler, 
  Sprout, 
  MoreHorizontal, 
  Tractor,
  Droplets,
  Calendar,
  ArrowRight,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Layers
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

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

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];

export const LandAndCrops: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const initialFormState = {
    fieldName: '',
    area: '',
    areaUnit: 'acres',
    soilType: 'Loam',
    irrigationType: 'Rain-fed',
    crops: [] as Crop[],
    status: 'Active',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch Farm Profile
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().farmProfile) {
          setFarmProfile(userDoc.data().farmProfile as FarmProfile);
        }
      } catch (error) {
        console.error("Error fetching farm profile:", error);
      }

      // Fetch Fields
      const q = query(
        collection(db, `users/${user.uid}/fields`),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fieldsData = snapshot.docs.map(doc => {
          const data = doc.data();
          // Handle legacy data migration
          let crops: Crop[] = data.crops || [];
          if (crops.length === 0 && data.currentCrop) {
            crops = [{
              id: 'legacy-1',
              name: data.currentCrop,
              plantingDate: data.plantingDate || '',
              expectedHarvestDate: data.expectedHarvestDate || ''
            }];
          }
          
          return {
            id: doc.id,
            ...data,
            crops
          };
        }) as FieldRecord[];
        setFields(fieldsData);
      });

      return unsubscribe;
    };

    const unsubscribePromise = fetchData();
    return () => { unsubscribePromise.then(unsub => unsub && unsub()); };
  }, [user]);

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (field: FieldRecord) => {
    setFormData({
      fieldName: field.fieldName,
      area: field.area.toString(),
      areaUnit: field.areaUnit || 'acres',
      soilType: field.soilType,
      irrigationType: field.irrigationType || 'Rain-fed',
      crops: field.crops,
      status: field.status,
      notes: field.notes || ''
    });
    setIsEditing(true);
    setEditingId(field.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dataToSave = {
        ...formData,
        area: Number(formData.area),
        updatedAt: serverTimestamp()
      };

      if (isEditing && editingId) {
        await updateDoc(doc(db, `users/${user.uid}/fields`, editingId), dataToSave);
      } else {
        await addDoc(collection(db, `users/${user.uid}/fields`), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving field: ", error);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!user || !window.confirm(t('deleteFieldConfirm'))) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/fields`, id));
    } catch (error) {
      console.error("Error deleting field: ", error);
    }
  };

  // Filter fields
  const filteredFields = filterStatus === 'All' 
    ? fields 
    : fields.filter(f => f.status === filterStatus);

  // Calculate stats
  const cultivatedArea = fields.reduce((acc, field) => acc + Number(field.area), 0);
  const totalFarmArea = farmProfile?.totalArea || cultivatedArea;
  const activeFields = fields.filter(f => f.status === 'Active').length;
  
  // Prepare chart data
  const cropDistribution = fields.reduce((acc: any[], field) => {
    if (!field.crops || field.crops.length === 0) return acc;
    
    // Distribute area equally among crops if multiple (simplified assumption)
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Farm Profile Header */}
      {farmProfile && (
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">{farmProfile.farmName}</h1>
                <div className="flex items-center gap-4 mt-2 text-stone-500 text-sm">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-600" /> {farmProfile.location}</span>
                  <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4 text-emerald-600" /> {farmProfile.totalArea} {getAreaUnitLabel(farmProfile.areaUnit)} Total</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-medium border border-stone-200">
                  {getAreaUnitLabel(farmProfile.areaUnit)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-stone-100">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-1">{t('primarySoil')}</p>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-stone-400" />
                  <p className="font-medium text-stone-900">{getSoilLabel(farmProfile.soilType)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-1">{t('irrigationSystem')}</p>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-stone-400" />
                  <p className="font-medium text-stone-900">{getIrrigationLabel(farmProfile.irrigationType)}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-1">{t('intendedCrops')}</p>
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-stone-400" />
                  <p className="font-medium text-stone-900 truncate">{farmProfile.primaryCrops.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Ruler className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-stone-500 font-medium">{t('cultivatedArea')}</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {cultivatedArea.toFixed(1)} 
                <span className="text-sm font-normal text-stone-500 ml-1">
                  / {totalFarmArea} {getAreaUnitLabel(farmProfile?.areaUnit || 'acres')}
                </span>
              </h3>
              <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${Math.min((cultivatedArea / totalFarmArea) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Tractor className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-stone-500 font-medium">{t('activeFields')}</p>
              <h3 className="text-2xl font-bold text-stone-900">{activeFields} <span className="text-sm font-normal text-stone-500">/ {fields.length}</span></h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-stone-500 font-medium">{t('cropsPlanted')}</p>
              <h3 className="text-2xl font-bold text-stone-900">{cropDistribution.length} <span className="text-sm font-normal text-stone-500">{t('varieties')}</span></h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Field List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-stone-900">{t('fieldManagement')}</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <select 
                  className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-40 appearance-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">{t('allStatus')}</option>
                  <option value="Active">{t('active')}</option>
                  <option value="Fallow">{t('fallow')}</option>
                  <option value="Harvested">{t('harvested')}</option>
                  <option value="Prepared">{t('prepared')}</option>
                </select>
              </div>
              <Button onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>
                {t('addField')}
              </Button>
            </div>
          </div>

          {filteredFields.length === 0 ? (
             <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-1">{t('noFieldsFound')}</h3>
              <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                {filterStatus === 'All' ? t('mapOutFarm') : `${t('noFieldsStatus')} "${filterStatus}".`}
              </p>
              {filterStatus === 'All' && (
                <Button onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>
                  {t('addField')}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredFields.map((field) => (
                <motion.div 
                  key={field.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col h-full"
                >
                  <div className="absolute top-4 right-4 flex gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-1">
                    <button 
                      onClick={() => handleOpenEdit(field)}
                      className="p-1.5 text-stone-400 hover:text-emerald-600 transition-colors rounded-md hover:bg-stone-100"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-md hover:bg-stone-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${
                        field.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 
                        field.status === 'Fallow' ? 'bg-amber-100 text-amber-600' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900">{field.fieldName}</h3>
                        <p className="text-xs text-stone-500">{field.area} {getAreaUnitLabel(field.areaUnit)} • {getSoilLabel(field.soilType)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 flex-grow">
                    <div className="text-sm">
                      <span className="text-stone-500 flex items-center gap-2 mb-1">
                        <Sprout className="w-4 h-4" /> Crops
                      </span>
                      {field.crops && field.crops.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {field.crops.map((crop, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                              {crop.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">{t('noCropsPlanted')}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-500 flex items-center gap-2">
                        <Droplets className="w-4 h-4" /> {t('irrigation')}
                      </span>
                      <span className="font-medium text-stone-900">{getIrrigationLabel(field.irrigationType || 'Rain-fed')}</span>
                    </div>

                    {field.crops && field.crops.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> {t('planted')}
                        </span>
                        <span className="font-medium text-stone-900">
                          {field.crops[0].plantingDate || t('notAvailable')}
                          {field.crops.length > 1 && <span className="text-stone-400 text-xs ml-1">(+{t('others')})</span>}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-stone-50">
                      <span className="text-stone-500">{t('status')}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        field.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        field.status === 'Fallow' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-stone-50 text-stone-600 border-stone-200'
                      }`}>
                        {t(field.status.toLowerCase())}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar / Charts */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
            <h3 className="font-bold text-stone-900 mb-4">{t('cropDistribution')}</h3>
            {cropDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cropDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {cropDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-stone-400 text-sm border-2 border-dashed border-stone-100 rounded-lg">
                {t('addFieldsDistribution')}
              </div>
            )}
          </div>

          <div className="bg-emerald-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">{t('soilHealthTip')}</h3>
              <p className="text-emerald-100 text-sm mb-4">
                {t('rotateCropsTip')}
              </p>
              <button 
                onClick={() => alert(t('rotationGuideAlert'))}
                className="text-xs font-bold uppercase tracking-wider text-emerald-300 hover:text-white transition-colors flex items-center gap-1"
              >
                {t('readRotationGuide')} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Sprout className="w-32 h-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Field Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-stone-100">
                <h3 className="text-xl font-bold text-stone-900">{isEditing ? t('editField') : t('addNewField')}</h3>
                <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 p-1 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('fieldName')}</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={formData.fieldName}
                      onChange={(e) => setFormData({...formData, fieldName: e.target.value})}
                      placeholder={t('fieldNamePlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('areaSize')}</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        required
                        step="0.1"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        value={formData.area}
                        onChange={(e) => setFormData({...formData, area: e.target.value})}
                        placeholder="0.0"
                      />
                      <select 
                        className="px-3 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-stone-50"
                        value={formData.areaUnit}
                        onChange={(e) => setFormData({...formData, areaUnit: e.target.value})}
                      >
                        <option value="acres">{t('acres')}</option>
                        <option value="hectares">{t('hectares')}</option>
                        <option value="sqm">{t('sqm')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('soilType')}</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                      value={formData.soilType}
                      onChange={(e) => setFormData({...formData, soilType: e.target.value})}
                    >
                      <option value="Loam">{t('loam')}</option>
                      <option value="Clay">{t('clay')}</option>
                      <option value="Sandy">{t('sandy')}</option>
                      <option value="Silt">{t('silt')}</option>
                      <option value="Peat">{t('peat')}</option>
                      <option value="Chalk">{t('chalk')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('irrigationMethod')}</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                      value={formData.irrigationType}
                      onChange={(e) => setFormData({...formData, irrigationType: e.target.value})}
                    >
                      <option value="Rain-fed">{t('rainFed')}</option>
                      <option value="Drip">{t('drip')}</option>
                      <option value="Sprinkler">{t('sprinkler')}</option>
                      <option value="Flood">{t('flood')}</option>
                      <option value="Pivot">{t('pivot')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('status')}</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="Active">{t('active')}</option>
                      <option value="Fallow">{t('fallow')}</option>
                      <option value="Harvested">{t('harvested')}</option>
                      <option value="Prepared">{t('prepared')}</option>
                    </select>
                  </div>

                  <div className="col-span-2 border-t border-stone-100 pt-4 mt-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-emerald-600" /> {t('cropDetails')}
                      </h4>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            crops: [
                              ...formData.crops,
                              { id: Date.now().toString(), name: '', plantingDate: '', expectedHarvestDate: '' }
                            ]
                          });
                        }}
                        icon={<Plus className="w-3 h-3" />}
                      >
                        {t('addCrop')}
                      </Button>
                    </div>

                    {formData.crops.length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-stone-200 rounded-lg bg-stone-50">
                        <p className="text-sm text-stone-500 mb-2">{t('noCropsAdded')}</p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              crops: [
                                ...formData.crops,
                                { id: Date.now().toString(), name: '', plantingDate: '', expectedHarvestDate: '' }
                              ]
                            });
                          }}
                        >
                          + {t('addFirstCrop')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.crops.map((crop, index) => (
                          <div key={crop.id} className="bg-stone-50 p-4 rounded-lg border border-stone-200 relative group">
                            <button
                              type="button"
                              onClick={() => {
                                const newCrops = formData.crops.filter((_, i) => i !== index);
                                setFormData({ ...formData, crops: newCrops });
                              }}
                              className="absolute top-2 right-2 text-stone-400 hover:text-red-500 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="col-span-2 md:col-span-2">
                                <label className="block text-xs font-medium text-stone-500 mb-1">{t('cropName')}</label>
                                <input 
                                  type="text" 
                                  className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white text-sm"
                                  value={crop.name}
                                  onChange={(e) => {
                                    const newCrops = [...formData.crops];
                                    newCrops[index].name = e.target.value;
                                    setFormData({ ...formData, crops: newCrops });
                                  }}
                                  placeholder={t('cropNamePlaceholder')}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1">{t('plantingDate')}</label>
                                <input 
                                  type="date" 
                                  className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white text-sm"
                                  value={crop.plantingDate}
                                  onChange={(e) => {
                                    const newCrops = [...formData.crops];
                                    newCrops[index].plantingDate = e.target.value;
                                    setFormData({ ...formData, crops: newCrops });
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1">{t('estHarvest')}</label>
                                <input 
                                  type="date" 
                                  className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white text-sm"
                                  value={crop.expectedHarvestDate}
                                  onChange={(e) => {
                                    const newCrops = [...formData.crops];
                                    newCrops[index].expectedHarvestDate = e.target.value;
                                    setFormData({ ...formData, crops: newCrops });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('notes')}</label>
                    <textarea 
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[80px]"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder={t('notesPlaceholder')}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-stone-100">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="flex-1 shadow-lg shadow-emerald-500/20">
                    {isEditing ? t('updateField') : t('saveField')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
