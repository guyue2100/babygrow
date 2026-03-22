import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Eye, Share2, ChevronRight, BookOpen } from 'lucide-react';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

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

  useEffect(() => {
    setLoading(true);
    // Fetch current article
    fetch(`/api/articles/${id}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch related articles (excluding current)
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((a: Article) => a.id !== Number(id)).slice(0, 3);
        setRelatedArticles(filtered);
      })
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!article) return;

    const startTime = Date.now();
    const userId = localStorage.getItem('user_id') || Math.random().toString(36).substring(7);
    localStorage.setItem('user_id', userId);
    
    // Track PV
    fetch(`/api/articles/${id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pv',
        userId,
        isAdminView: fromAdmin
      }),
    }).catch(console.error);

    return () => {
      const duration = Date.now() - startTime;
      // Track Duration
      fetch(`/api/articles/${id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duration',
          value: duration,
          isAdminView: fromAdmin
        }),
      }).catch(console.error);
    };
  }, [article, id, fromAdmin]);

  if (loading) {
    return <div className="text-center py-20 text-zinc-500">{t('loading', 'Loading article...')}</div>;
  }

  if (!article || 'error' in article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">{t('articleNotFound', 'Article not found')}</h2>
        <Link to="/articles" className="text-indigo-600 hover:underline">{t('returnToArticles', 'Return to articles')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6 md:pt-12 bg-[#FDFBF7]">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-zinc-100">
        <div 
          className="h-full bg-indigo-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Article JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": parseLocalizedText(article.title),
          "description": parseLocalizedText(article.summary),
          "image": article.image_url,
          "datePublished": article.created_at,
          "author": {
            "@type": "Organization",
            "name": "BabyGrow.online"
          }
        })}
      </script>

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
          {/* Editorial Header */}
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
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                  BG
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-zinc-900 leading-none">BabyGrow Editorial</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Medical Reviewer Team</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs font-bold text-zinc-400 border-t border-zinc-100 pt-4 w-full justify-center">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(article.created_at).toLocaleDateString(i18n.language || 'en', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {getDisplayReadCount(article)} views
                </span>
              </div>
            </div>
          </header>

          {/* Content Body */}
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-zinc prose-indigo max-w-none 
              prose-headings:font-black prose-headings:tracking-tight prose-headings:text-zinc-900
              prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8
              prose-p:text-lg prose-p:leading-relaxed prose-p:text-zinc-600 prose-p:mb-8
              prose-strong:text-zinc-900 prose-strong:font-black
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-8
              prose-li:text-lg prose-li:text-zinc-600 prose-li:mb-2
              prose-img:hidden
              prose-table:border-collapse prose-table:w-full prose-table:my-12
              prose-th:bg-zinc-50 prose-th:p-4 prose-th:text-left prose-th:font-black prose-th:text-xs prose-th:uppercase prose-th:tracking-widest
              prose-td:p-4 prose-td:border-b prose-td:border-zinc-100 prose-td:text-sm
              prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-zinc-700 prose-blockquote:my-12
            ">
              <Markdown>{parseLocalizedText(article.content)}</Markdown>
            </div>

            {/* Share Section */}
            <div className="mt-20 pt-10 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Share this guide</span>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-full">#GrowthChart</span>
                <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-full">#ParentingTips</span>
                <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-full">#WHOStandards</span>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-32 space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                Recommended Reading
              </h2>
              <Link to="/articles" className="text-sm font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map(art => (
                <Link 
                  key={art.id} 
                  to={`/articles/${art.id}`}
                  className="group space-y-4 bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <h3 className="font-black text-zinc-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {parseLocalizedText(art.title)}
                    </h3>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {new Date(art.created_at).toLocaleDateString(i18n.language || 'en')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
