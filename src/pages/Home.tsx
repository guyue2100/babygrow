import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, parseISO } from 'date-fns';
import { TrendingUp, Edit2, BookOpen, ArrowRight, Eye } from 'lucide-react';
import { GrowthChart } from '../components/GrowthChart';
import { GrowthAssessmentForm } from '../components/GrowthAssessmentForm';
import { HeightPredictor } from '../components/HeightPredictor';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { predictHeight } from '../services/growthCalculations';
import { Link } from 'react-router-dom';
// 导入 supabase 客户端实例
import { supabase } from '../supabaseClient'; 

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
    {/* Mars (Boy) Logo */}
    <div className="absolute top-[10%] left-[5%] opacity-[0.03] animate-float-slow text-sky-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-64 h-64">
        <circle cx="10" cy="14" r="5" />
        <line x1="13.5" y1="10.5" x2="21" y2="3" />
        <polyline points="16 3 21 3 21 8" />
      </svg>
    </div>
    {/* Venus (Girl) Logo */}
    <div className="absolute bottom-[10%] right-[5%] opacity-[0.03] animate-float text-rose-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-80 h-80">
        <circle cx="12" cy="9" r="5" />
        <line x1="12" y1="14" x2="12" y2="21" />
        <line x1="9" y1="18" x2="15" y2="18" />
      </svg>
    </div>
    {/* Additional smaller logos */}
    <div className="absolute top-[40%] right-[15%] opacity-[0.02] animate-float-delayed text-sky-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-32 h-32">
        <circle cx="10" cy="14" r="5" />
        <line x1="13.5" y1="10.5" x2="21" y2="3" />
        <polyline points="16 3 21 3 21 8" />
      </svg>
    </div>
    <div className="absolute bottom-[30%] left-[10%] opacity-[0.02] animate-float-slow text-rose-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-40 h-40">
        <circle cx="12" cy="9" r="5" />
        <line x1="12" y1="14" x2="12" y2="21" />
        <line x1="9" y1="18" x2="15" y2="18" />
      </svg>
    </div>
  </div>
);

export default function Home() {
  const { t, i18n } = useTranslation();
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [assessmentData, setAssessmentData] = useState<any>(() => {
    const saved = localStorage.getItem('growth_assessment');
    return saved ? JSON.parse(saved) : {
      gender: 'boy',
      birthday: new Date().toISOString().split('T')[0],
      fatherHeight: '0',
      motherHeight: '0',
      measurements: [{ date: new Date().toISOString().split('T')[0], height: '0', weight: '0' }]
    };
  });

  // Dynamic SEO Update
  useEffect(() => {
    document.title = `${t('title')} - ${t('aiPredictor')}`;
    document.documentElement.lang = i18n.language || 'en';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${t('subtitle')}. ${t('seoContent1')}`);
    }

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', t('seoKeywords'));

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);

    const languages = ['en', 'zh', 'ja', 'ko', 'es', 'pt', 'de'];
    languages.forEach(lang => {
      let link = document.querySelector(`link[hreflang="${lang}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', lang);
        document.head.appendChild(link);
      }
      link.setAttribute('href', window.location.origin + window.location.pathname);
    });

    let xDefault = document.querySelector('link[hreflang="x-default"]');
    if (!xDefault) {
      xDefault = document.createElement('link');
      xDefault.setAttribute('rel', 'alternate');
      xDefault.setAttribute('hreflang', 'x-default');
      document.head.appendChild(xDefault);
    }
    xDefault.setAttribute('href', window.location.origin + window.location.pathname);
  }, [t, i18n.language]);

  // 修改后的同步逻辑：直接从 Supabase 获取数据
  useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles') // 对应数据库中的 articles 表
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setRecentArticles(data || []);
      } catch (err) {
        console.error('获取首页文章失败:', err);
      } finally {
        setLoadingArticles(false);
      }
    };

    fetchRecentArticles();
  }, []);

  const getDisplayReadCount = (article: Article) => {
    const initial = article.initial_read_count || 800;
    return initial + (article.read_count * 5);
  };

  const parseLocalizedText = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const lang = (i18n.language || 'en').split('-')[0];
      return parsed[lang] || parsed['en'] || parsed['zh'] || 'Untitled';
    } catch (e) {
      return jsonStr;
    }
  };

  const handleAssessmentSubmit = (data: any) => {
    setAssessmentData(data);
    localStorage.setItem('growth_assessment', JSON.stringify(data));
  };

  const records = useMemo(() => {
    if (!assessmentData || !assessmentData.measurements) return [];
    
    return assessmentData.measurements.map((m: any, index: number) => {
      const ageInMonths = Number((differenceInDays(parseISO(m.date), parseISO(assessmentData.birthday)) / 30.4375).toFixed(2));
      
      return {
        id: `record-${index}`,
        childId: 'child',
        date: m.date,
        ageInMonths,
        height: parseFloat(m.height),
        weight: parseFloat(m.weight),
        headCircumference: 0,
      };
    }).sort((a: any, b: any) => a.ageInMonths - b.ageInMonths);
  }, [assessmentData]);

  const latestRecord = records[records.length - 1];

  const prediction = useMemo(() => {
    return predictHeight(
      assessmentData.gender,
      parseFloat(assessmentData.fatherHeight || '0'),
      parseFloat(assessmentData.motherHeight || '0'),
      latestRecord?.height,
      latestRecord?.ageInMonths
    );
  }, [assessmentData.gender, assessmentData.fatherHeight, assessmentData.motherHeight, latestRecord]);

  return (
    <div className="min-h-screen pb-10 md:pb-20 pt-6 md:pt-12 relative overflow-hidden">
      <BackgroundLogos />
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-4">
        <Link to="/articles" className="text-sm font-medium text-zinc-600 hover:text-indigo-600 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-zinc-200">
          Articles
        </Link>
        <LanguageSwitcher />
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <h1 className="sr-only">{t('title')} - {t('aiPredictor')}</h1>

        <div className="lg:col-span-12 mb-8 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 shadow-sm">
          <h2 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">
            {t('directAnswerTitle', 'How to Predict Your Baby\'s Adult Height?')}
          </h2>
          <p className="text-zinc-600 leading-relaxed max-w-3xl">
            <strong>{t('directAnswerBold', 'Core Answer:')}</strong> {t('directAnswerText', 'Adult height is determined by approximately 70% genetics and 30% environmental factors. By using the Mid-Parental Height (MPH) formula combined with current WHO growth percentile tracking, you can accurately estimate your child\'s future height. Our AI tool analyzes these variables in real-time to provide a statistical prediction range.')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">#WHOStandards</span>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">#AIPrediction</span>
            <span className="px-4 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">#GrowthTracker</span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-8">
            <GrowthAssessmentForm 
              initialData={assessmentData} 
              onSubmit={handleAssessmentSubmit} 
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-10">
          <HeightPredictor 
            gender={assessmentData.gender}
            fatherHeight={assessmentData.fatherHeight}
            motherHeight={assessmentData.motherHeight}
            latestHeight={latestRecord?.height}
            latestAgeInMonths={latestRecord?.ageInMonths}
          />

          <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-black/5 space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-indigo-500" />
                {t('trends')}
              </h3>
            </div>
            
            <div className="space-y-10">
              <GrowthChart 
                gender={assessmentData.gender} 
                type="height" 
                records={records} 
                title={t('heightChartTitle')} 
                unit={t('unitHeight')} 
              />
              <GrowthChart 
                gender={assessmentData.gender} 
                type="weight" 
                records={records} 
                title={t('weightChartTitle')} 
                unit={t('unitWeight')} 
              />
            </div>
          </section>
        </div>
      </main>

      {/* 修正后的文章展示区 */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 mt-12 md:mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-zinc-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-indigo-500" />
            {t('latestArticles', '最新文章')}
          </h2>
          <Link 
            to="/articles" 
            className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {t('viewAll', '查看全部')} <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {loadingArticles ? (
          <div className="text-center py-10 text-zinc-500">{t('loading', '加载中...')}</div>
        ) : recentArticles.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[2rem] border border-zinc-100 shadow-sm">
            <p className="text-zinc-500">{t('noArticles', '暂无文章')}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {recentArticles.map(article => (
              <Link 
                key={article.id} 
                to={`/articles/${article.id}`}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 hover:shadow-md hover:border-indigo-100 transition-all group flex flex-col"
              >
                <h3 className="text-lg font-bold text-zinc-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {parseLocalizedText(article.title)}
                </h3>
                <p className="text-zinc-500 text-sm mb-4 line-clamp-3 flex-grow">
                  {parseLocalizedText(article.summary)}
                </p>
                <div className="text-xs text-zinc-400 font-medium flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                  <span>{new Date(article.created_at).toLocaleDateString(i18n.language || 'en')}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {getDisplayReadCount(article)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="max-w-5xl mx-auto px-4 md:px-6 mt-12 md:mt-16 mb-10">
        <div className="bg-white/50 backdrop-blur-sm p-6 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-black/5 space-y-6">
          <h2 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight leading-tight">
            {t('seoTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-zinc-600 leading-relaxed">
            <div className="space-y-4">
              <p className="text-sm md:text-base opacity-80">
                {t('seoContent1')}
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-sm md:text-base opacity-80">
                {t('seoContent2')}
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-black/5 space-y-8">
            <h2 className="text-lg font-black text-zinc-900 uppercase tracking-widest">{t('faqTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <h3 className="font-bold text-zinc-800">{t('faqQ1')}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{t('faqA1')}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-zinc-800">{t('faqQ2')}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{t('faqA2')}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <h3 className="font-bold text-zinc-800">{t('faqQ3')}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{t('faqA3')}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center sm:text-left">
              © 2026 Baby Growth Dashboard • {t('reference')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
