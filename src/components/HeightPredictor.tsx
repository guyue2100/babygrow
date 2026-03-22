import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Info } from 'lucide-react';
import { 
  Gender,
  predictHeight
} from '../services/growthCalculations';

interface HeightPredictorProps {
  gender: Gender;
  fatherHeight: string | number;
  motherHeight: string | number;
  latestHeight?: number;
  latestAgeInMonths?: number;
}

export const HeightPredictor: React.FC<HeightPredictorProps> = ({ 
  gender, 
  fatherHeight, 
  motherHeight, 
  latestHeight, 
  latestAgeInMonths 
}) => {
  const { t } = useTranslation();

  const prediction = useMemo(() => {
    if (!latestHeight || latestAgeInMonths === undefined) return null;

    return predictHeight(
      gender,
      parseFloat(fatherHeight.toString() || '0'),
      parseFloat(motherHeight.toString() || '0'),
      latestHeight,
      latestAgeInMonths
    );
  }, [gender, fatherHeight, motherHeight, latestHeight, latestAgeInMonths]);

  if (!prediction) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-rose-50 p-6 md:p-10 rounded-[2.5rem] border border-orange-100 shadow-[0_20px_50px_-12px_rgba(249,115,22,0.1)] space-y-8 relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/40 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-orange-200/20 rounded-full blur-2xl"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-orange-900 tracking-tight">
            {t('aiPredictor')}
          </h3>
        </div>
        <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-orange-100 flex items-center shadow-sm">
          <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{t('predictionLogic')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(249,115,22,0.05)] border border-orange-50 relative group/card">
            <div className="absolute top-4 right-4 text-2xl opacity-20 group-hover/card:opacity-100 transition-opacity">📏</div>
            <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest mb-2">{t('predictedHeight')}</p>
            <div className="flex items-baseline">
              <span className="text-5xl font-black text-orange-600 tracking-tighter">{prediction.final.toFixed(1)}</span>
              <span className="text-lg font-black text-orange-300 ml-2 uppercase tracking-widest">{t('cm')}</span>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 bg-orange-100/30 p-4 rounded-2xl border border-orange-100/50">
            <div className="mt-0.5 bg-orange-400 rounded-full p-1">
              <Info className="w-3 h-3 text-white" />
            </div>
            <p className="text-[11px] leading-relaxed font-bold text-orange-800/70 italic">{t('predictionDesc')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-orange-600 p-8 rounded-[2rem] shadow-xl shadow-orange-200 relative group/range">
            <div className="absolute top-4 right-4 text-2xl opacity-20 group-hover/range:opacity-100 transition-opacity">✨</div>
            <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-2">{t('fuzzyRange')}</p>
            <div className="flex items-baseline text-white">
              <span className="text-3xl font-black tracking-tighter">{prediction.range[0].toFixed(0)}</span>
              <span className="mx-3 opacity-40 font-black text-xl">-</span>
              <span className="text-3xl font-black tracking-tighter">{prediction.range[1].toFixed(0)}</span>
              <span className="text-lg font-black opacity-60 ml-2 uppercase tracking-widest">{t('cm')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
              <p className="text-[9px] font-black text-orange-300 uppercase tracking-widest mb-1">👨 {t('fatherHeight')}</p>
              <p className="text-base font-black text-orange-900">{fatherHeight || '--'}<span className="text-[10px] ml-1 opacity-40">cm</span></p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
              <p className="text-[9px] font-black text-orange-300 uppercase tracking-widest mb-1">👩 {t('motherHeight')}</p>
              <p className="text-base font-black text-orange-900">{motherHeight || '--'}<span className="text-[10px] ml-1 opacity-40">cm</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
