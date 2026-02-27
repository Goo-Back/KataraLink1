import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Upload, Loader2, AlertCircle, CheckCircle2, X, Camera, Sprout, Activity, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface AnalysisResult {
  id?: string;
  imageUrl: string;
  diagnosis: string;
  confidence: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  createdAt: any;
}

export const CropDoctor: React.FC = () => {
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch history
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, `users/${user.uid}/crop_analyses`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnalysisResult[];
      setAnalyses(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!image || !user) return;

    setAnalyzing(true);
    try {
      // Resize and compress image
      const base64Data = await resizeImage(image);
      const base64Content = base64Data.split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Analyze this image of a crop. 
        Identify the plant.
        Diagnose any diseases, pests, or deficiencies visible.
        If healthy, state that.
        
        Provide the response in this JSON format:
        {
          "diagnosis": "Name of disease/pest or 'Healthy'",
          "confidence": "High/Medium/Low",
          "symptoms": ["symptom 1", "symptom 2"],
          "treatment": ["treatment step 1", "treatment step 2"],
          "prevention": ["prevention tip 1", "prevention tip 2"]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { text: prompt },
            { 
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Content
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("No response from AI");
      
      const analysisData = JSON.parse(resultText);

      // Save to Firestore
      await addDoc(collection(db, `users/${user.uid}/crop_analyses`), {
        ...analysisData,
        imageUrl: base64Data,
        createdAt: serverTimestamp()
      });

      setImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error analyzing crop:", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm("Delete this analysis?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/crop_analyses`, id));
    } catch (error) {
      console.error("Error deleting analysis:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 opacity-50" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">AI Crop Doctor</h1>
          <p className="text-stone-500 max-w-2xl">
            Upload a photo of your crop to instantly identify diseases, pests, or nutrient deficiencies. 
            Our AI agronomist will provide diagnosis and treatment recommendations.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm h-full">
            <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" /> New Analysis
            </h3>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                previewUrl ? 'border-emerald-200 bg-emerald-50/30' : 'border-stone-200 hover:border-emerald-400 hover:bg-stone-50'
              }`}
              onClick={() => !analyzing && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleImageSelect}
              />
              
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                  />
                  {!analyzing && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute -top-2 -right-2 bg-white text-stone-400 hover:text-red-500 p-1 rounded-full shadow-md border border-stone-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-8">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-stone-900">Click to upload photo</p>
                  <p className="text-xs text-stone-500 mt-1">JPG, PNG up to 5MB</p>
                </div>
              )}
            </div>

            <Button 
              className="w-full mt-4"
              disabled={!image || analyzing}
              onClick={handleAnalyze}
              icon={analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            >
              {analyzing ? 'Analyzing...' : 'Diagnose Issue'}
            </Button>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" /> Recent Diagnoses
          </h3>

          {analyses.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-dashed border-stone-200 text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-1">No analyses yet</h3>
              <p className="text-stone-500">Upload a photo to get your first diagnosis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <motion.div 
                  key={analysis.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow relative group"
                >
                  <button 
                    onClick={() => analysis.id && handleDelete(analysis.id)}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Analysis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex gap-5 flex-col sm:flex-row">
                    <div className="w-full sm:w-32 h-32 flex-shrink-0">
                      <img 
                        src={analysis.imageUrl} 
                        alt="Crop" 
                        className="w-full h-full object-cover rounded-lg border border-stone-100"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-stone-900 text-lg">{analysis.diagnosis}</h4>
                          <p className="text-xs text-stone-500">
                            Confidence: <span className="font-medium text-emerald-600">{analysis.confidence}</span>
                          </p>
                        </div>
                        <span className="text-xs text-stone-400 pr-8">
                          {analysis.createdAt?.toDate ? analysis.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Symptoms</p>
                          <ul className="text-sm text-stone-600 list-disc list-inside">
                            {analysis.symptoms?.slice(0, 2).map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Treatment</p>
                          <ul className="text-sm text-stone-600 list-disc list-inside">
                            {analysis.treatment?.slice(0, 2).map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
