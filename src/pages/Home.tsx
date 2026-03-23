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

// 背景装饰组件
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
  const [assessmentData, setAssessmentData] = useState<any>(() => {
    const saved = localStorage.getItem('growth_assessment');
    return saved ? JSON.parse(saved) : {
      gender: 'boy',
      birthday: new Date().toISOString().split('T')[0],
      fatherHeight: '175',
      motherHeight: '160',
      measurements: [{ date: new Date().toISOString().split('T')[0], height: '50', weight: '3.5' }]
    };
  });

  // SEO 动态更新逻辑
  useEffect(() => {
    document.title = `${t('title')} - ${t('aiPredictor')}`;
    document.documentElement.lang = i18n.language || 'en';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${t('subtitle')}. ${t('seoContent1')}`);
    }
  }, [t, i18n.language]);

  // 从 Supabase 获取最新文章
  useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        if (error) throw error;
        setRecentArticles(data || []);
      } catch (err) {
        console.error('获取文章失败:', err);
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
    if (!assessmentData?.measurements) return [];
    return assessmentData.measurements.map((m: any, index: number) => {
      const ageInMonths = Number((differenceInDays(parseISO(m.date), parseISO(assessmentData.birthday)) / 30.4375).toFixed(2));
      return {
        id: `record-${index}`,
        date: m.date,
        ageInMonths,
        height: parseFloat(m.height),
        weight: parseFloat(m.weight),
      };
    }).sort((a: any, b: any) => a.ageInMonths - b.ageInMonths);
  }, [assessmentData]);

  const latestRecord = records[records.length - 1];

  return (
    <div className="min-h-screen pb-20 pt-6 md:pt-12 relative overflow-hidden bg-[#FDFBF7]">
      <BackgroundLogos />
      
      {/* 顶部控制台 */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
        <Link to="/articles" className="text-sm font-bold text-zinc-600 hover:text-indigo-600 bg-white/90 backdrop-blur px-5 py-2.5 rounded-full shadow-sm border border-zinc-200">
          Articles
        </Link>
        <LanguageSwitcher />
      </div>

      {/* 主布局：改为 flex-col + space-y-12 实现全宽垂直堆叠 */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 flex flex-col space-y-12">
        <h1 className="sr-only">{t('title')}</h1>

        {/* 1. 核心问答模块 (全宽) */}
        <section className="bg-white/40 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] border border-white/20 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mb-6 tracking-tight leading-tight">
            {t('directAnswerTitle', 'How to Predict Your Baby\'s Adult Height?')}
          </h2>
          <p className="text-zinc-600 text-lg leading-relaxed">
            <strong className="text-zinc-900">{t('directAnswerBold', 'Core Answer:')}</strong> {t('directAnswerText', 'Adult height is determined by approximately 70% genetics and 30% environmental factors. Our AI tool analyzes these variables in real-time.')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">#WHOStandards</span>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">#AIPrediction</span>
          </div>
        </section>

        {/* 2. 用户信息表单 (垂直排列) */}
        <section className="w-full">
          <GrowthAssessmentForm initialData={assessmentData} onSubmit={handleAssessmentSubmit} />
        </section>

        {/* 3. 身高预测器 (垂直排列) */}
        <section className="w-full">
          <HeightPredictor 
            gender={assessmentData.gender}
            fatherHeight={assessmentData.fatherHeight}
            motherHeight={assessmentData.motherHeight}
            latestHeight={latestRecord?.height}
            latestAgeInMonths={latestRecord?.ageInMonths}
          />
        </section>

        {/* 4. 生长曲线图表 (全宽，内部垂直排列) */}
        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-black/5 space-y-12">
          <div className="flex items-center justify-between border-b border-zinc-50 pb-6">
            <h3 className="text-2xl font-black text-zinc-900 flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-indigo-500" />
              {t('trends')}
            </h3>
          </div>
          <div className="flex flex-col space-y-16">
            <GrowthChart gender={assessmentData.gender} type="height" records={records} title={t('heightChartTitle')} unit={t('unitHeight')} />
            <div className="border-t border-zinc-100 pt-12">
              <GrowthChart gender={assessmentData.gender} type="weight" records={records} title={t('weightChartTitle')} unit={t('unitWeight')} />
            </div>
          </div>
        </section>

        {/* 5. 最新文章 (全宽) */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-zinc-900 flex items-center">
              <BookOpen className="w-7 h-7 mr-3 text-indigo-500" />
              {t('latestArticles', '最新文章')}
            </h2>
            <Link to="/articles" className="flex items-center text-sm font-bold text-indigo-600 hover:translate-x-1 transition-transform">
              {t('viewAll', '查看全部')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {loadingArticles ? (
            <div className="text-center py-10 text-zinc-400">{t('loading')}</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {recentArticles.map(article => (
                <Link key={article.id} to={`/articles/${article.id}`} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-zinc-100 hover:shadow-xl transition-all flex flex-col h-full">
                  <h3 className="text-lg font-black text-zinc-900 mb-3 line-clamp-2">{parseLocalizedText(article.title)}</h3>
                  <p className="text-zinc-500 text-sm mb-6 line-clamp-3 flex-grow">{parseLocalizedText(article.summary)}</p>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase pt-5 border-t border-zinc-50 flex justify-between">
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{getDisplayReadCount(article)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 6. 页脚 */}
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
              <div className="space-y-2"><strong>{t('faqQ1')}</strong><p className="text-zinc-500">{t('faqA1')}</p></div>
              <div className="space-y-2"><strong>{t('faqQ2')}</strong><p className="text-zinc-500">{t('faqA2')}</p></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
