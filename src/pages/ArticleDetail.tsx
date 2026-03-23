import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Eye, Share2, ChevronRight, BookOpen } from 'lucide-react';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
// 1. 修正后的导入路径
import { supabase } from '../services/supabase'; 

interface Article {
  id: number;
  title: string;
  content: string;
  created_at: string;
  read_count: number;
  total_duration: number;
  pv: number;
  uv_count: number;
  summary: string;
  image_url: string;
  initial_read_count?: number;
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromAdmin = location.state?.fromAdmin;
  const { t, i18n } = useTranslation();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const parseLocalizedText = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const lang = (i18n.language || 'en').split('-')[0];
      return parsed[lang] || parsed['en'] || parsed['zh'] || 'Untitled';
    } catch (e) {
      return jsonStr;
    }
  };

  const getDisplayReadCount = (art: Article) => {
    const initial = art.initial_read_count || 800;
    return initial + (art.read_count * 5);
  };

  const readingTime = useMemo(() => {
    if (!article) return 0;
    const content = parseLocalizedText(article.content);
    const wordsPerMinute = 200;
    const noOfWords = content.split(/\s+/).length;
    return Math.ceil(noOfWords / wordsPerMinute);
  }, [article, i18n.language]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. 修正后的 Supabase 获取逻辑
  useEffect(() => {
    if (!id) return;
    const fetchArticleData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setArticle(data);

        const { data: others } = await supabase
          .from('articles')
          .select('*')
          .neq('id', id)
          .limit(3);

        if (others) setRelatedArticles(others);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticleData();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-zinc-500">{t('loading', 'Loading...')}</div>;
  }

  // 3. 修正了类型检查错误
  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">{t('articleNotFound', 'Article not found')}</h2>
        <Link to="/articles" className="text-indigo-600 hover:underline">{t('returnToArticles', 'Return to articles')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6 md:pt-12 bg-[#FDFBF7]">
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-zinc-100">
        <div 
          className="h-full bg-indigo-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <Link 
          to={fromAdmin ? "/admin" : "/articles"} 
          className="inline-flex items-center text-zinc-500 hover:text-indigo-600 transition-all mb-12 group"
        >
          <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-zinc-100 flex items-center justify-center mr-3 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-tight">{fromAdmin ? "返回后台管理" : t('backToArticles', 'Back to Articles')}</span>
        </Link>

        <article className="space-y-12">
          <header className="space-y-8 text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
              <span className="px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">Parenting Guide</span>
              <span className="w-1 h-1 bg-zinc-300 rounded-full" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {readingTime} min read
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 leading-[1.1] tracking-tight">
              {parseLocalizedText(article.title)}
            </h1>

            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">BG</div>
                <div className="text-left">
                  <p className="text-sm font-black text-zinc-900 leading-none">BabyGrow Editorial</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Medical Reviewer Team</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs font-bold text-zinc-400 border-t border-zinc-100 pt-4 w-full justify-center">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(article.created_at).toLocaleDateString(i18n.language || 'en')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {getDisplayReadCount(article)} views
                </span>
              </div>
            </div>
          </header>

          <div className="max-w-3xl mx-auto">
            <div className="prose prose-zinc prose-indigo max-w-none">
              <Markdown>{parseLocalizedText(article.content)}</Markdown>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
