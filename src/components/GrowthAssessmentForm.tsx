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
  const [fatherHeight, setFatherHeight] = useState(initialData?.fatherHeight || ''); 
  const [motherHeight, setMotherHeight] = useState(initialData?.motherHeight || ''); 
  const [measurements, setMeasurements] = useState<Measurement[]>(initialData?.measurements || [{ date: '', height: '0', weight: '0' }]);

  // 第一条日期为空时自动展开
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    measurements[0]?.date === '' ? 0 : null
  );

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
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-black/5 space-y-8">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{t('measurements')}</h3>
        <p className="text-sm text-zinc-400">{t('subtitle')}</p>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-zinc-50/50 rounded-[2.5rem] border border-zinc-100">
          {/* 性别选择 */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">{t('gender')}</label>
            <div className="flex space-x-4">
              <button type="button" onClick={() => setGender('boy')} className={`flex-1 p-5 rounded-3xl border-4 transition-all ${gender === 'boy' ? 'border-sky-400 bg-white shadow-lg' : 'border-transparent bg-white/50 opacity-60'}`}><BoyIcon /><span className={`block mt-2 font-black ${gender === 'boy' ? 'text-sky-600' : 'text-zinc-400'}`}>{t('boy')}</span></button>
              <button type="button" onClick={() => setGender('girl')} className={`flex-1 p-5 rounded-3xl border-4 transition-all ${gender === 'girl' ? 'border-rose-400 bg-white shadow-lg' : 'border-transparent bg-white/50 opacity-60'}`}><GirlIcon /><span className={`block mt-2 font-black ${gender === 'girl' ? 'text-rose-600' : 'text-zinc-400'}`}>{t('girl')}</span></button>
            </div>
          </div>

          {/* 生日：使用 key 强制根据语言重绘原生控件文字 */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">{t('birthday')}</label>
            <div className="flex items-center bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <Calendar className="w-5 h-5 text-zinc-400 mr-3" />
              <input 
                key={`bday-${i18n.language}`} 
                type="date" 
                value={birthday} 
                onChange={(e) => setBirthday(e.target.value)} 
                className="w-full bg-transparent border-none focus:ring-0 font-bold" 
                required 
              />
            </div>
          </div>

          {/* 父母身高 */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">{t('fatherHeight')} (cm)</label>
            <div className="flex items-center bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <Ruler className="w-5 h-5 text-zinc-400 mr-3" />
              <input type="number" step="0.1" value={fatherHeight} onChange={(e) => setFatherHeight(e.target.value)} placeholder="-" className="w-full bg-transparent border-none focus:ring-0 font-bold" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">{t('motherHeight')} (cm)</label>
            <div className="flex items-center bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <Ruler className="w-5 h-5 text-zinc-400 mr-3" />
              <input type="number" step="0.1" value={motherHeight} onChange={(e) => setMotherHeight(e.target.value)} placeholder="-" className="w-full bg-transparent border-none focus:ring-0 font-bold" />
            </div>
          </div>
        </div>

        {/* 测量记录 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t('measurements')}</label>
            <button type="button" onClick={() => { setMeasurements([...measurements, { date: '', height: '0', weight: '0' }]); setExpandedIndex(measurements.length); }} className="text-xs font-black text-indigo-500 bg-indigo-50 px-4 py-2 rounded-full"><Plus className="w-4 h-4 mr-1" /> {t('addRecord')}</button>
          </div>

          <div className="space-y-4">
            {measurements.map((m, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div key={index} className={`p-6 border-2 rounded-[2rem] transition-all ${isExpanded ? 'border-indigo-100 bg-indigo-50/20' : 'border-zinc-50 bg-white'}`}>
                  <div className={`flex items-center justify-between ${isExpanded ? 'mb-8' : 'cursor-pointer'}`} onClick={() => !isExpanded && setExpandedIndex(index)}>
                    <div className="flex items-center space-x-4">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>#{index + 1}</span>
                      {!isExpanded && <span className="text-sm font-bold text-zinc-600">{m.date || '-'} | {m.height} cm</span>}
                    </div>
                    {measurements.length > 1 && <button type="button" onClick={(e) => { e.stopPropagation(); setMeasurements(measurements.filter((_, i) => i !== index)); }} className="text-zinc-300 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>}
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{t('date')}</label>
                        <input 
                          key={`m-date-${index}-${i18n.language}`} 
                          type="date" 
                          value={m.date} 
                          onChange={(e) => handleUpdateMeasurement(index, 'date', e.target.value)} 
                          className="w-full bg-transparent border-b-2 border-zinc-100 py-2 text-sm font-bold focus:ring-0" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{t('height')} (cm)</label>
                        <input type="number" step="0.1" value={m.height} onChange={(e) => handleUpdateMeasurement(index, 'height', e.target.value)} className="w-full bg-transparent border-b-2 border-zinc-100 py-2 text-sm font-bold focus:ring-0" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{t('weight')} (kg)</label>
                        <input type="number" step="0.01" value={m.weight} onChange={(e) => handleUpdateMeasurement(index, 'weight', e.target.value)} className="w-full bg-transparent border-b-2 border-zinc-100 py-2 text-sm font-bold focus:ring-0" required />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center">
        {t('calculate')} <ChevronRight className="w-6 h-6 ml-2" />
      </button>
    </form>
  );
};
