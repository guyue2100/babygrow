import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Eye, Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// 导入 supabase 客户端实例
import { supabase } from '../src/services/supabase'; 

interface Article {
  id: number;
  title: string;
  summary: string;
  created_at: string;
  read_count: number;
  total_duration: number;
  image_url: string;
  initial_read_count?: number;
}

export default function Articles() {
  const { t, i18n } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const parseLocalizedText = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const lang = (i18n.language || 'en').split('-')[0];
      return parsed[lang] || parsed['en'] || parsed['zh'] || 'Untitled';
    } catch (e) {
      return jsonStr;
    }
  };

  const getDisplayReadCount = (article: Article) => {
    const initial = article.initial_read_count || 800;
    return initial + (article.read_count * 5);
  };

  useEffect(() => {
    // 替换 fetch 为直接查询 Supabase
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles') // 确保与你 Supabase 中的表名一致
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setArticles(data || []);
      } catch (err) {
        console.error('获取文章失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const featuredArticle = useMemo(() => articles[0], [articles]);
  const otherArticles = useMemo(() => articles.slice(1), [articles]);

  return (
    <div className="min-h-screen pb-20 pt-12 bg-[#FDFBF7]">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToHome', 'Back to Home')}
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse border border-zinc-100" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-zinc-100 shadow-sm">
            <BookOpen className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
            <p className="text-zinc-500 font-black uppercase tracking-widest">{t('noArticles', 'No articles found.')}</p>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {articles.map(article => (
              <Link 
                key={article.id} 
                to={`/articles/${article.id}`}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 flex flex-col"
              >
                <div className="p-8 flex flex-col flex-grow space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.created_at).toLocaleDateString(i18n.language || 'en')}
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {parseLocalizedText(article.title)}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 flex-grow">
                    {parseLocalizedText(article.summary)}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      <Eye className="w-3 h-3" /> {getDisplayReadCount(article)}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
