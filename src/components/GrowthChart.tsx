import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';
import { WHO_DATA, Gender, getInterpolatedLMS, calculateZScore, zScoreToPercentile } from '../services/growthCalculations';
import { Child } from '../types';

interface GrowthChartProps {
  gender: Gender;
  type: 'height' | 'weight';
  records: any[];
  title: string;
  unit: string;
}

const PERCENTILES = [
  { p: 0.03, label: '3rd', color: '#FDA4AF', dash: '4 4' },
  { p: 0.15, label: '15th', color: '#FDBA74', dash: '3 3' },
  { p: 0.5, label: 'Median', color: '#94A3B8', dash: '' },
  { p: 0.85, label: '85th', color: '#FDBA74', dash: '3 3' },
  { p: 0.97, label: '97th', color: '#FDA4AF', dash: '4 4' },
];

export const GrowthChart: React.FC<GrowthChartProps> = ({ gender, type, records, title, unit }) => {
  const { t } = useTranslation();
  const referenceData = WHO_DATA[gender][type];
  
  // Prepare user data points
  const userData = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    return records
      .map(r => ({
        month: r.ageInMonths,
        userValue: r[type],
      }))
      .filter(d => !isNaN(d.userValue))
      .sort((a, b) => a.month - b.month);
  }, [records, type]);

  // Generate reference curve data (more points for smoother WHO curves)
  const referenceCurves = useMemo(() => {
    return Array.from({ length: 121 }, (_, i) => {
      const month = i * 2; // Every 2 months
      const lms = getInterpolatedLMS(month, referenceData);
      const dataPoint: any = { month };
      
      PERCENTILES.forEach(({ p }) => {
        const zMap: Record<number, number> = { 0.03: -1.88, 0.15: -1.036, 0.5: 0, 0.85: 1.036, 0.97: 1.88 };
        const z = zMap[p];
        const { L, M, S } = lms;
        let value;
        if (L === 0) {
          value = M * Math.exp(S * z);
        } else {
          value = M * Math.pow(1 + L * S * z, 1 / L);
        }
        dataPoint[`p${Math.round(p * 100)}`] = Number(value.toFixed(2));
      });
      return dataPoint;
    });
  }, [referenceData]);

  const yDomain: [number, number] = type === 'height' ? [40, 200] : [2, 100];
  const yTicks = type === 'height' 
    ? Array.from({ length: (200 - 40) / 10 + 1 }, (_, i) => 40 + i * 10)
    : undefined;

  const latestRecord = userData.length > 0 ? userData[userData.length - 1] : null;
  const latestPercentile = latestRecord ? (() => {
    const lms = getInterpolatedLMS(latestRecord.month, referenceData);
    return zScoreToPercentile(calculateZScore(latestRecord.userValue, lms));
  })() : null;

  const getConclusion = () => {
    if (!latestPercentile) return null;
    const p = latestPercentile * 100;
    if (p < 3) return t('conclusionVeryLow');
    if (p < 15) return t('conclusionLow');
    if (p > 97) return t('conclusionVeryHigh');
    if (p > 85) return t('conclusionHigh');
    return t('conclusionNormal');
  };

  const conclusion = getConclusion();

  return (
    <div className="w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-50/50 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${gender === 'boy' ? 'bg-sky-100' : 'bg-rose-100'}`}>
            {type === 'height' ? '📏' : '⚖️'}
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">{title}</h3>
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-0.5">{t('reference')}</p>
          </div>
        </div>
        <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${gender === 'boy' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
          {gender === 'boy' ? '🤴 ' + t('prince') : '👸 ' + t('princess')}
        </div>
      </div>

      <div className="w-full h-[320px] md:h-[450px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 20, right: 10, left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#F8FAFC" />
            <XAxis 
              dataKey="month" 
              type="number"
              domain={[0, 240]}
              tickFormatter={(m) => Math.floor(m / 12).toString()}
              ticks={[0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240]}
              label={{ value: t('ageYears'), position: 'insideBottom', offset: 35, fontSize: 10, fill: '#CBD5E1', fontWeight: '900', letterSpacing: '0.1em' }} 
              tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: '700' }}
              minTickGap={15}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={yDomain} 
              ticks={yTicks}
              tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: '700' }}
              tickFormatter={(val) => `${val}`}
              axisLine={false}
              tickLine={false}
              label={{ 
                value: `${t(type)} (${unit})`, 
                angle: -90, 
                position: 'insideLeft', 
                offset: 15,
                style: { textAnchor: 'middle', fill: '#94A3B8', fontSize: 10, fontWeight: '900' } 
              }}
            />
          <Tooltip 
            labelFormatter={(m) => `${t('yearsOld', { count: Math.floor(m / 12) })} ${t('monthsOld', { count: Math.round(m % 12) })}`}
            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }}
            itemStyle={{ fontWeight: '800', fontSize: '12px' }}
          />
          
          {PERCENTILES.map(({ p, label, color, dash }) => (
            <Line
              key={p}
              data={referenceCurves}
              type="monotone"
              dataKey={`p${Math.round(p * 100)}`}
              stroke={color}
              strokeDasharray={dash}
              dot={false}
              strokeWidth={label === 'Median' ? 2.5 : 1.5}
              opacity={label === 'Median' ? 0.6 : 0.3}
              name={label}
              connectNulls
            />
          ))}
          
          {userData.length > 0 && (
            <Line
              data={userData}
              type="monotone"
              dataKey="userValue"
              stroke={gender === 'boy' ? '#0EA5E9' : '#F43F5E'}
              strokeWidth={4}
              dot={{ 
                r: 6, 
                fill: gender === 'boy' ? '#0EA5E9' : '#F43F5E', 
                strokeWidth: 3, 
                stroke: '#fff' 
              }}
              activeDot={{ r: 8, strokeWidth: 0 }}
              name={t('babyData')}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>

    {conclusion && (
      <div className={`p-5 md:p-6 rounded-3xl border-2 transition-all hover:scale-[1.01] ${gender === 'boy' ? 'bg-sky-50/30 border-sky-100 shadow-[0_10px_30px_rgba(14,165,233,0.05)]' : 'bg-rose-50/30 border-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.05)]'}`}>
        <div className="flex items-start space-x-4">
          <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-lg ${gender === 'boy' ? 'bg-sky-100' : 'bg-rose-100'}`}>
            💡
          </div>
          <div>
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${gender === 'boy' ? 'text-sky-600' : 'text-rose-600'}`}>
              {t('analysisResult')}
            </h4>
            <p className="mt-1.5 text-base font-bold text-zinc-700 leading-relaxed">
              {conclusion}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};
