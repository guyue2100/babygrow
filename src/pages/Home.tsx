import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, parseISO } from 'date-fns';
import { TrendingUp, BookOpen, ArrowRight, Eye, Clock, Calendar } from 'lucide-react';
import { GrowthChart } from '../components/GrowthChart';
import { GrowthAssessmentForm } from '../components/GrowthAssessmentForm';
import { HeightPredictor } from '../components/HeightPredictor';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { predictHeight } from '../services/growthCalculations';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase'; 

interface Article {
  id: number;
  title: string;
  summary: string;
  created_at: string;
  read_count: number;
  total_duration: number;
  initial_read_count?: number;
}

const BackgroundLogos = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
    <div className="absolute top-[10%] left-[5%] opacity-[0.03] animate-float-slow text-sky-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-64 h-64"><circle cx="10" cy="14" r="5" /><line x1="13.5" y1="10.5" x2="21" y2="3" /><polyline points="16 3 21 3 21 8" /></svg>
    </div>
    <div className="absolute bottom-[10%] right-[5%] opacity-[0.03] animate-float text-rose-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-80 h-80"><circle cx="12" cy="9" r="5" /><line x1="12" y1="14" x2="12" y2="21" /><line x1="9" y1="18" x2="15" y2="18" /></svg>
    </div>
  </div>
);

export default function Home() {
  const { t, i18n } = useTranslation();
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // 需求 1 & 4 & 5：清空默认值，不从 localStorage 读取
  const [assessmentData, setAssessmentData] = useState<any>({
    gender: 'boy',
    birthday: '', // 初始为空
    fatherHeight: '175',
    motherHeight: '160',
    measurements: [{ date: '', height: '0', weight: '0' }] // 初始日期为空
  });

  useEffect(() => {
    document.title = `${t('title')} - ${t('aiPredictor')}`;
    // 需求 6：确保站点语言同步，影响日期控件占位符显示
    document.documentElement.lang = i18n.language || 'en';
  }, [t, i18n.language]);

  // 移除原有的 localStorage 保存逻辑

  useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (!error && data) {
          setRecentArticles(data);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setLoadingArticles(false);
      }
    };

    fetchRecentArticles();
  }, []);

  const parseLocalizedText = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const lang = (i18n.language || 'en').split('-')[0];
      return parsed[lang] || parsed['en'] || parsed['zh'] || 'Untitled';
    } catch {
      return jsonStr;
    }
  };

  const getDisplayReadCount = (article: Article) => {
    const initial = article.initial_read_count || 800;
    return initial + (article.read_count * 5);
  };

  const handleAssessmentSubmit = (data: any) => {
    setAssessmentData(data);
  };

  // 需求 3：数据过滤，确保只有填写了日期的记录才参与计算
  const records = useMemo(() => {
    if (!assessmentData?.measurements || !assessmentData.birthday) return [];
    
    return assessmentData.measurements
      .filter((m: any) => m.date && m.date !== "") // 核心过滤逻辑
      .map((m: any, index: number) => {
        const ageInMonths = Number(
          (differenceInDays(parseISO(m.date), parseISO(assessmentData.birthday)) / 30.4375).toFixed(2)
        );
        return {
          id: `record-${index}`,
          date: m.date,
          ageInMonths,
          height: parseFloat(m.height),
          weight: parseFloat(m.weight)
        };
      })
      .sort((a: any, b: any) => a.ageInMonths - b.ageInMonths);
  }, [assessmentData]);

  const latestRecord = records[records.length - 1];

  return (
    <div className="min-h-screen pb-20 pt-6 md:pt-12 relative overflow-hidden bg-[#FDFBF7]">
      <BackgroundLogos />
      
      <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
        <Link 
          to="/articles" 
          className="text-sm font-bold text-zinc-600 hover:text-indigo-600 bg-white/90 backdrop-blur px-5 py-2.5 rounded-full shadow-sm border border-zinc-200 transition-all hover:shadow-md active:scale-95"
        >
          Articles
        </Link>
        <LanguageSwitcher />
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-6 flex flex-col space-y-12">
        <section className="bg-white/40 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] border border-white/20 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-6 tracking-tight leading-tight">
            {t('directAnswerTitle')}
          </h2>
          <p className="text-zinc-600 text-lg leading-relaxed">
            <strong className="text-zinc-900">{t('directAnswerBold')}</strong> {t('directAnswerText')}
          </p>
        </section>

        <section className="w-full">
          <GrowthAssessmentForm 
            initialData={assessmentData} 
            onSubmit={handleAssessmentSubmit} 
          />
        </section>

        <section className="w-full">
          <HeightPredictor 
            gender={assessmentData.gender}
            fatherHeight={assessmentData.fatherHeight}
            motherHeight={assessmentData.motherHeight}
            latestHeight={latestRecord?.height}
            latestAgeInMonths={latestRecord?.ageInMonths}
          />
        </section>

        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-black/5 space-y-12">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
            <h3 className="text-2xl font-black text-zinc-900 flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-indigo-500" />
              {t('trends')}
            </h3>
          </div>

          <div className="flex flex-col space-y-16">
            <GrowthChart 
              gender={assessmentData.gender}
              type="height"
              records={records}
              title={t('heightChartTitle')}
              unit={t('unitHeight')}
            />
            
            <div className="border-t border-zinc-100 pt-12">
              <GrowthChart 
                gender={assessmentData.gender}
                type="weight"
                records={records}
                title={t('weightChartTitle')}
                unit={t('unitWeight')}
              />
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-zinc-900 flex items-center">
              <BookOpen className="w-7 h-7 mr-3 text-indigo-500" />
              {t('latestArticles')}
            </h2>
            <Link 
              to="/articles" 
              className="flex items-center text-sm font-bold text-indigo-600 hover:translate-x-1 transition-transform"
            >
              {t('viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {!loadingArticles && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {recentArticles.map(article => (
                <Link 
                  key={article.id} 
                  to={`/articles/${article.id}`}
                  className="group bg-white p-7 rounded-[2.5rem] shadow-sm border border-zinc-100 hover:shadow-xl transition-all flex flex-col h-full active:scale-[0.98]"
                >
                  <h3 className="text-lg font-black text-zinc-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {parseLocalizedText(article.title)}
                  </h3>
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-6 flex-grow leading-relaxed">
                    {parseLocalizedText(article.summary)}
                  </p>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase pt-5 border-t border-zinc-50 flex justify-between items-center">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(article.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{getDisplayReadCount(article)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-4xl mx-auto px-4 md:px-6 mt-20 mb-10">
        <div className="bg-white/60 backdrop-blur-md p-10 md:p-16 rounded-[3rem] border border-black/5">
          <h2 className="text-2xl font-black text-zinc-900 mb-8">{t('seoTitle')}</h2>
          <div className="grid md:grid-cols-2 gap-8 text-zinc-600 text-sm leading-relaxed mb-10">
            <p>{t('seoContent1')}</p>
            <p>{t('seoContent2')}</p>
          </div>
          <div className="pt-10 border-t border-zinc-100">
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-widest mb-8">{t('faqTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-900">{t('faq1Title')}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">{t('faq1Content')}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-900">{t('faq2Title')}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">{t('faq2Content')}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
