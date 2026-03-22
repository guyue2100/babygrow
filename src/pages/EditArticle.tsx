import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  image_url: string;
}

export default function EditArticle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: {}, summary: {}, content: {} });

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data);
        setFormData({
          title: JSON.parse(data.title),
          summary: JSON.parse(data.summary),
          content: JSON.parse(data.content),
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleInputChange = (field: 'title' | 'summary' | 'content', lang: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value }
    }));
  };

  const saveArticle = async () => {
    setSaving(true);
    try {
      const chineseTitle = (formData.title as any)['zh'];
      const chineseSummary = (formData.summary as any)['zh'];
      const chineseContent = (formData.content as any)['zh'];

      const newTitle = {};
      const newSummary = {};
      const newContent = {};
      
      const languages = ['en', 'zh', 'ja', 'ko', 'es', 'pt', 'de'];
      languages.forEach(lang => {
        (newTitle as any)[lang] = chineseTitle;
        (newSummary as any)[lang] = chineseSummary;
        (newContent as any)[lang] = chineseContent;
      });

      const res = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: JSON.stringify(newTitle),
          summary: JSON.stringify(newSummary),
          content: JSON.stringify(newContent),
          image_url: article?.image_url
        }),
      });
      if (!res.ok) throw new Error('保存失败');
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20">加载中...</div>;
  if (!article) return <div className="text-center py-20">文章未找到</div>;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 pt-10 max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <Link to="/admin" className="flex items-center text-zinc-500 hover:text-indigo-600">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回后台
        </Link>
        <button 
          onClick={saveArticle}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          保存修改
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-8">
        <div className="space-y-4 border-b border-zinc-100 pb-8">
          <h3 className="font-bold text-zinc-900 uppercase tracking-wider">中文 (ZH)</h3>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">标题</label>
            <input 
              value={(formData.title as any)['zh'] || ''}
              onChange={(e) => handleInputChange('title', 'zh', e.target.value)}
              className="w-full p-3 rounded-xl border border-zinc-200"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">摘要</label>
            <textarea 
              value={(formData.summary as any)['zh'] || ''}
              onChange={(e) => handleInputChange('summary', 'zh', e.target.value)}
              className="w-full p-3 rounded-xl border border-zinc-200"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">内容 (Markdown)</label>
            <textarea 
              value={(formData.content as any)['zh'] || ''}
              onChange={(e) => handleInputChange('content', 'zh', e.target.value)}
              className="w-full p-3 rounded-xl border border-zinc-200 font-mono text-sm"
              rows={8}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
