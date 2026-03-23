import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ruler, Weight, Calendar, Baby, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
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
  // 需求 1：清空默认生日
  const [birthday, setBirthday] = useState(initialData?.birthday || '');
  const [fatherHeight, setFatherHeight] = useState(initialData?.fatherHeight || '175');
  const [motherHeight, setMotherHeight] = useState(initialData?.motherHeight || '160');
  
  // 需求 1 & 4：不从持久化存储加载日期
  const [measurements, setMeasurements] = useState<Measurement[]>(
    initialData?.measurements || [
      { date: '', height: '0', weight: '0' }
    ]
  );

  // 需求 2：自动展开逻辑。如果第一条记录日期为空，则默认展开。
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
    <form onSubmit={handleSubmit} className=\"bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-black/5 space-y-8 max-w-full\">
      <div className=\"flex flex-col md:flex-row md:items-end justify-between gap-4\">
        <div className=\"space-y-2\">
          <div className=\"inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2\">
            <Baby className=\"w-3 h-3 mr-1\" /> {t('aiPredictor')}
          </div>
          <h3 className=\"text-2xl font-black text-zinc-900 tracking-tight\">{t('measurements')}</h3>
          <p className=\"text-sm text-zinc-400 font-medium leading-relaxed\">{t('subtitle')}</p>
        </div>
      </div>

      <div className=\"space-y-10\">
        {/* Profile Section */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-zinc-50/50 rounded-[2.5rem] border border-zinc-100\">
          <div className=\"space-y-4\">
            <label className=\"block text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1\">{t('gender')}</label>
            <div className=\"flex space-x-4\">
              <button
                type=\"button\"
                onClick={() => setGender('boy')}
                className={`flex-1 flex flex-col items-center justify-center p-5 rounded-3xl border-4 transition-all duration-300 ${
                  gender === 'boy' 
                    ? 'border-sky-400 bg-white shadow-[0_12px_24px_-8px_rgba(56,189,248,0.3)] -translate-y-1' 
                    : 'border-transparent bg-white/50 text-zinc-400 opacity-60 hover:opacity-100'
                }`}
              >
                <div className=\"mb-3\"><BoyIcon /></div>
                <span className={`font-black text-sm tracking-tight ${gender === 'boy' ? 'text-sky-600' : 'text-zinc-400'}`}>{t('boy')}</span>
              </button>
              <button
                type=\"button\"
                onClick={() => setGender('girl')}
                className={`flex-1 flex flex-col items-center justify-center p-5 rounded-3xl border-4 transition-all duration-300 ${
                  gender === 'girl' 
                    ? 'border-rose-400 bg-white shadow-[0_12px_24px_-8px_rgba(251,113,133,0.3)] -translate-y-1' 
                    : 'border-transparent bg-white/50 text-zinc-400 opacity-60 hover:opacity-100'
                }`}
              >
                <div className=\"mb-3\"><GirlIcon /></div>
                <span className={`font-black text-sm tracking-tight ${gender === 'girl' ? 'text-rose-600' : 'text-zinc-400'}`}>{t('girl')}</span>
              </button>
            </div>
          </div>

          <div className=\"space-y-4\">
            <label className=\"block text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1\">{t('birthday')}</label>
            <div className=\"flex items-center bg-white p-4 rounded-2xl border border-zinc-100 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all shadow-sm\">
              <Calendar className=\"w-5 h-5 text-zinc-400 mr-3\" />
              <input
                key={`birthday-${i18n.language}`} // 需求 6：根据语言强制重刷占位符
                type=\"date\"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className=\"w-full bg-transparent border-none focus:ring-0 font-bold text-zinc-900 placeholder-zinc-300\"
                required
              />
            </div>
          </div>

          <div className=\"space-y-4\">
            <label className=\"block text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1\">{t('fatherHeight')} (cm)</label>
            <div className=\"flex items-center bg-white p-4 rounded-2xl border border-zinc-100 focus-within:border-indigo-500 shadow-sm\">
              <Ruler className=\"w-5 h-5 text-zinc-400 mr-3\" />
              <input
                type=\"number\"
                step=\"0.1\"
                value={fatherHeight}
                onChange={(e) => setFatherHeight(e.target.value)}
                className=\"w-full bg-transparent border-none focus:ring-0 font-bold text-zinc-900\"
              />
            </div>
          </div>

          <div className=\"space-y-4\">
            <label className=\"block text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1\">{t('motherHeight')} (cm)</label>
            <div className=\"flex items-center bg-white p-4 rounded-2xl border border-zinc-100 focus-within:border-indigo-500 shadow-sm\">
              <Ruler className=\"w-5 h-5 text-zinc-400 mr-3\" />
              <input
                type=\"number\"
                step=\"0.1\"
                value={motherHeight}
                onChange={(e) => setMotherHeight(e.target.value)}
                className=\"w-full bg-transparent border-none focus:ring-0 font-bold text-zinc-900\"
              />
            </div>
          </div>
        </div>

        {/* Measurements Section */}
        <div className=\"space-y-6\">
          <div className=\"flex items-center justify-between ml-1\">
            <label className=\"text-xs font-black text-zinc-400 uppercase tracking-[0.2em]\">{t('measurements')}</label>
            {measurements.length < 5 && (
              <button
                type=\"button\"
                onClick={handleAddMeasurement}
                className=\"text-xs font-black text-indigo-500 flex items-center bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors\"
              >
                <Plus className=\"w-4 h-4 mr-1\" /> {t('addRecord')}
              </button>
            )}
          </div>

          <div className=\"space-y-4\">
            {measurements.map((m, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div 
                  key={index} 
                  className={`relative p-6 border-2 transition-all duration-300 rounded-[2rem] ${
                    isExpanded ? 'border-indigo-100 bg-indigo-50/20' : 'border-zinc-50 bg-white hover:border-zinc-100'
                  }`}
                >
                  <div 
                    className={`flex items-center justify-between ${isExpanded ? 'mb-8' : 'cursor-pointer'}`}
                    onClick={() => !isExpanded && setExpandedIndex(index)}
                  >
                    <div className=\"flex items-center space-x-4\">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                        isExpanded ? 'bg-indigo-500 text-white' : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        #{index + 1}
                      </span>
                      {!isExpanded && (
                        <div className=\"flex items-center space-x-6 text-sm font-bold text-zinc-600\">
                          <span className=\"flex items-center\"><Calendar className=\"w-4 h-4 mr-2 text-zinc-300\"/> {m.date || '-'}</span>
                          <span className=\"flex items-center\"><Ruler className=\"w-4 h-4 mr-2 text-zinc-300\"/> {m.height} cm</span>
                        </div>
                      )}
                    </div>
                    <div className=\"flex items-center space-x-2\">
                      {!isExpanded && (
                        <button
                          type=\"button\"
                          onClick={() => setExpandedIndex(index)}
                          className=\"text-zinc-400 hover:text-indigo-500 p-2 transition-colors\"
                        >
                          <Edit2 className=\"w-4 h-4\" />
                        </button>
                      )}
                      {measurements.length > 1 && (
                        <button
                          type=\"button\"
                          onClick={(e) => { e.stopPropagation(); handleRemoveMeasurement(index); }}
                          className=\"text-zinc-300 hover:text-red-400 p-2 transition-colors\"
                        >
                          <Trash2 className=\"w-4 h-4\" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className=\"grid grid-cols-1 md:grid-cols-3 gap-8\">
                      <div className=\"space-y-2\">
                        <label className=\"text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1\">{t('date')}</label>
                        <div className=\"flex items-center border-b-2 border-zinc-100 focus-within:border-indigo-500 py-2 transition-colors\">
                          <Calendar className=\"w-4 h-4 text-zinc-300 mr-3\" />
                          <input
                            key={`m-date-${index}-${i18n.language}`} // 需求 6：强制重新挂载同步占位符
                            type=\"date\"
                            value={m.date}
                            onChange={(e) => handleUpdateMeasurement(index, 'date', e.target.value)}
                            className=\"w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-zinc-900\"
                            required
                          />
                        </div>
                      </div>

                      <div className=\"space-y-2\">
                        <label className=\"text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1\">{t('height')} (cm)</label>
                        <div className=\"flex items-center border-b-2 border-zinc-100 focus-within:border-indigo-500 py-2 transition-colors\">
                          <Ruler className=\"w-4 h-4 text-zinc-300 mr-3\" />
                          <input
                            type=\"number\"
                            step=\"0.1\"
                            value={m.height}
                            onChange={(e) => handleUpdateMeasurement(index, 'height', e.target.value)}
                            className=\"w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-zinc-900\"
                            required
                          />
                        </div>
                      </div>

                      <div className=\"space-y-2\">
                        <label className=\"text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1\">{t('weight')} (kg)</label>
                        <div className=\"flex items-center border-b-2 border-zinc-100 focus-within:border-indigo-500 py-2 transition-colors\">
                          <Weight className=\"w-4 h-4 text-zinc-300 mr-3\" />
                          <input
                            type=\"number\"
                            step=\"0.01\"
                            value={m.weight}
                            onChange={(e) => handleUpdateMeasurement(index, 'weight', e.target.value)}
                            className=\"w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-zinc-900\"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type=\"submit\"
        className=\"w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-[0_12px_24px_-8px_rgba(79,70,229,0.4)] active:shadow-none active:translate-y-1 group\"
      >
        {t('calculate')}
        <ChevronRight className=\"w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform\" />
      </button>
    </form>
  );
};
