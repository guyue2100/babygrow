import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ruler, Weight, Calendar, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import { Gender } from '../services/growthCalculations';

export interface Measurement {
  date: string;
  height: string;
  weight: string;
}

export interface AssessmentData {
  gender: Gender;
  birthday: string;
  fatherHeight?: string;
  motherHeight?: string;
  measurements: Measurement[];
}

interface GrowthAssessmentFormProps {
  initialData?: AssessmentData | null;
  onSubmit: (data: AssessmentData) => void;
}

const BoyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-sky-500">
    <circle cx="10" cy="14" r="5" />
    <line x1="13.5" y1="10.5" x2="21" y2="3" />
    <polyline points="16 3 21 3 21 8" />
  </svg>
);

const GirlIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-rose-500">
    <circle cx="12" cy="9" r="5" />
    <line x1="12" y1="14" x2="12" y2="21" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

export const GrowthAssessmentForm: React.FC<GrowthAssessmentFormProps> = ({ initialData, onSubmit }) => {
  const { t, i18n } = useTranslation();
  
  const [gender, setGender] = useState<Gender>(initialData?.gender || 'boy');
  const [birthday, setBirthday] = useState(initialData?.birthday || '');
  const [fatherHeight, setFatherHeight] = useState(initialData?.fatherHeight || '175');
  const [motherHeight, setMotherHeight] = useState(initialData?.motherHeight || '160');
  
  const [measurements, setMeasurements] = useState<Measurement[]>(
    initialData?.measurements || [
      { date: '', height: '0', weight: '0' }
    ]
  );

  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    measurements[0].date === '' ? 0 : null
  );

  const handleAddMeasurement = () => {
    if (measurements.length < 5) {
      setMeasurements([...measurements, { date: '', height: '0', weight: '0' }]);
      setExpandedIndex(measurements.length);
    }
  };

  const handleRemoveMeasurement = (index: number) => {
    if (measurements.length > 1) {
      setMeasurements(measurements.filter((_, i) => i !== index));
      if (expandedIndex === index) setExpandedIndex(null);
    }
  };

  const handleUpdateMeasurement = (index: number, field: keyof Measurement, value: string) => {
    const newMeasurements = [...measurements];
    newMeasurements[index] = { ...newMeasurements[index], [field]: value };
    setMeasurements(newMeasurements);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthday) return;
    setExpandedIndex(null);
    onSubmit({ gender, birthday, fatherHeight, motherHeight, measurements });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-black/5 space-y-6 max-w-full">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-zinc-900">{t('measurements')}</h3>
        <p className="text-xs text-zinc-400">{t('subtitle')}</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t('gender')}</label>
            <div className="flex space-x-4">
              <button type="button" onClick={() => setGender('boy')} className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all ${gender === 'boy' ? 'border-sky-400 bg-white shadow-[0_8px_0_0_rgba(56,189,248,0.2)] -translate-y-1' : 'border-transparent bg-white/50 text-zinc-400 opacity-60'}`}>
                <div className="mb-2"><BoyIcon /></div>
                <span className={`font-black text-sm ${gender === 'boy' ? 'text-sky-600' : 'text-zinc-400'}`}>{t('boy')}</span>
              </button>
              <button type="button" onClick={() => setGender('girl')} className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all ${gender === 'girl' ? 'border-rose-400 bg-white shadow-[0_8px_0_0_rgba(251,113,133,0.2)] -translate-y-1' : 'border-transparent bg-white/50 text-zinc-400 opacity-60'}`}>
                <div className="mb-2"><GirlIcon /></div>
                <span className={`font-black text-sm ${gender === 'girl' ? 'text-rose-600' : 'text-zinc-400'}`}>{t('girl')}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('birthday')}</label>
            <div className="flex items-center bg-white p-3 rounded-xl border border-zinc-100 focus-within:border-indigo-500 shadow-sm">
              <Calendar className="w-5 h-5 text-zinc-400 mr-2" />
              <input 
                key={`birthday-field-${i18n.language}`} // 强制重新挂载以同步占位符语言
                type="date" 
                value={birthday} 
                onChange={(e) => setBirthday(e.target.value)} 
                className="w-full bg-transparent border-none focus:ring-0 font-medium" 
                required 
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('fatherHeight')} (cm)</label>
            <div className="flex items-center bg-white p-3 rounded-xl border border-zinc-100 focus-within:border-indigo-500 shadow-sm">
              <Ruler className="w-5 h-5 text-zinc-400 mr-2" />
              <input type="number" step="0.1" value={fatherHeight} onChange={(e) => setFatherHeight(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 font-medium" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('motherHeight')} (cm)</label>
            <div className="flex items-center bg-white p-3 rounded-xl border border-zinc-100 focus-within:border-indigo-500 shadow-sm">
              <Ruler className="w-5 h-5 text-zinc-400 mr-2" />
              <input type="number" step="0.1" value={motherHeight} onChange={(e) => setMotherHeight(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 font-medium" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('measurements')}</label>
            {measurements.length < 5 && (
              <button type="button" onClick={handleAddMeasurement} className="text-xs font-black text-indigo-500 flex items-center bg-indigo-50 px-4 py-2 rounded-full hover:scale-105 transition-all">
                <Plus className="w-4 h-4 mr-1" /> {t('addRecord')}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {measurements.map((m, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div key={index} className="relative p-6 border border-zinc-100 rounded-3xl bg-white shadow-sm">
                  <div className={`flex items-center justify-between ${isExpanded ? 'mb-6' : 'cursor-pointer'}`} onClick={() => !isExpanded && setExpandedIndex(index)}>
                    <div className="flex items-center space-x-4">
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase">#{index + 1}</span>
                      {!isExpanded && (
                        <div className="flex items-center space-x-4 text-sm font-medium text-zinc-600">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-zinc-400"/> {m.date || '-'}</span>
                          <span className="flex items-center"><Ruler className="w-3 h-3 mr-1 text-zinc-400"/> {m.height} cm</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isExpanded && (
                        <button type="button" onClick={() => setExpandedIndex(index)} className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{t('edit', 'Edit')}</button>
                      )}
                      {measurements.length > 1 && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveMeasurement(index); }} className="text-zinc-300 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{t('date')}</label>
                        <input 
                          key={`measure-date-${index}-${i18n.language}`} // 强制重新挂载以同步占位符语言
                          type="date" 
                          value={m.date} 
                          onChange={(e) => handleUpdateMeasurement(index, 'date', e.target.value)} 
                          className="w-full bg-transparent border-b border-zinc-100 focus:border-indigo-500 py-1 text-sm font-medium focus:ring-0" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{t('height')} ({t('unitHeight')})</label>
                        <input type="number" step="0.1" value={m.height} onChange={(e) => handleUpdateMeasurement(index, 'height', e.target.value)} className="w-full bg-transparent border-b border-zinc-100 focus:border-indigo-500 py-1 text-sm font-medium focus:ring-0" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{t('weight')} ({t('unitWeight')})</label>
                        <input type="number" step="0.01" value={m.weight} onChange={(e) => handleUpdateMeasurement(index, 'weight', e.target.value)} className="w-full bg-transparent border-b border-zinc-100 focus:border-indigo-500 py-1 text-sm font-medium focus:ring-0" required />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center hover:bg-indigo-700 shadow-[0_8px_0_0_rgba(79,70,229,0.2)] active:translate-y-1 active:shadow-none transition-all">
        {t('calculate')} <ChevronRight className="w-6 h-6 ml-2" />
      </button>
    </form>
  );
};
