import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Plus, Trash2, Edit3, Loader2, Search, Key, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Article {
  id: number;
  title: string;
  summary: string;
  created_at: string;
  read_count: number;
  total_duration: number;
  pv: number;
  uv_count: number;
}

export default function Admin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [newArticleId, setNewArticleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  
// API Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKey, setCustomKey] = useState(localStorage.getItem('CUSTOM_GEMINI_KEY') || '');

  const fetchArticles = () => {
    setLoading(true);
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('加载文章失败');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const saveCustomKey = () => {
    localStorage.setItem('CUSTOM_GEMINI_KEY', customKey.trim());
    setShowKeyModal(false);
    setError(null);
  };

  const handleGenerateAI = async (useSearch: boolean) => {
    if (!useSearch && !keyword.trim()) {
      setError('请输入关键词');
      return;
    }

    setGenerating(true);
    setProgressText('正在初始化 AI 模型...');
    setNewArticleId(null);
    setError(null);
    
    let currentApiKey = localStorage.getItem('CUSTOM_GEMINI_KEY') || process.env.GEMINI_API_KEY || '';
    
    // Check if key is missing or is the default placeholder
    if (!currentApiKey || currentApiKey === 'MY_GEMINI_API_KEY') {
      setError('请先配置有效的 Gemini API Key');
      setShowKeyModal(true);
      setGenerating(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: currentApiKey });
      
      let prompt = '';
      if (useSearch) {
        prompt = 'Search the web for recent hot topics related to baby growth, parenting, or child development. Then, write a comprehensive, highly SEO-optimized article about one of these topics.';
      } else {
        prompt = `Write a comprehensive, highly SEO-optimized article about baby growth and parenting focusing on the keyword: "${keyword}".`;
      }

      prompt += `
      CRITICAL SEO & GEO GUIDELINES:
      1. DIRECT ANSWER LOGIC: The first paragraph MUST directly answer the core question of the title in under 120 words. This is for AI search engine snippets.
      2. DATA CHUNKING: Include at least one Markdown table (e.g., growth standards, nutrition tables) and a set of bullet points.
      3. E-E-A-T (Authority): Cite authoritative sources like WHO, AAP, or major pediatric associations. Include a "References" section at the end.
      4. LONG-TAIL KEYWORDS: The title should be in a "User Question" format (e.g., "Is 100cm normal for a 3-year-old boy?").
      5. FAQ SECTION: Include a 3-question FAQ at the end of the article content.
      6. META DESCRIPTION: Include a compelling meta description in the "summary" field.
      7. STRUCTURE: Use clear H2 and H3 heading tags.
      8. NO IMAGES: Do NOT include any images, image placeholders, or image URLs in the content. Do NOT include Markdown image tags like ![...](...). The "image_url" field in the database will be ignored.

      TRANSLATION REQUIREMENTS:
      You MUST translate the article into: English (en), Chinese (zh), Japanese (ja), Korean (ko), Spanish (es), Portuguese (pt), and German (de).
      Ensure the "Direct Answer" and "E-E-A-T" principles are maintained in all translations.

      OUTPUT FORMAT:
      The response MUST be a valid JSON object with exactly three fields: "title", "summary", and "content".
      Each field is an object with language codes as keys.
      Example:
      {
        "title": { "en": "Is 100cm normal for a 3-year-old?", "zh": "3岁孩子身高100cm正常吗？", ... },
        "summary": { "en": "Discover if your child's growth is on track...", "zh": "了解您的孩子发育是否达标...", ... },
        "content": { "en": "# Direct Answer\nYes, 100cm is exactly the 50th percentile...", "zh": "# 直接回答\n是的，100cm 刚好是 50 百分位...", ... }
      }
      `;
      
      const config: any = {};
      
      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      } else {
        config.responseMimeType = "application/json";
      }

      setProgressText('正在调用 Gemini API 生成多语言内容 (这可能需要 1-2 分钟，请耐心等待)...');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error('No text returned from AI');
      }

      // Robust JSON parsing
      let articleData;
      try {
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        const cleanedText = jsonMatch ? jsonMatch[0] : resultText;
        articleData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', resultText);
        throw new Error('AI response was not valid JSON');
      }
      
      setProgressText('AI 生成完毕，正在保存到数据库...');
      
      // Convert objects to strings for database storage
      const titleStr = JSON.stringify(articleData.title);
      const summaryStr = JSON.stringify(articleData.summary);
      const contentStr = JSON.stringify(articleData.content);
      
      // Save the generated article
      const saveRes = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: titleStr, summary: summaryStr, content: contentStr, image_url: '' }), // Placeholder for now
      });
      
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || '保存文章失败');
      }
      
      const savedData = await saveRes.json();
      const articleId = savedData.id;

      // Generate image
      setProgressText('正在生成文章配图...');
      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `A professional, high-quality, relevant image for an article about: ${keyword || articleData.title.zh}. The image should be visually appealing, suitable for a parenting/child development blog, and capture the essence of the article theme: ${articleData.summary.zh || ''}`,
              },
            ],
          },
        });
        
        let imageUrl = '';
        if (imageResponse.candidates && imageResponse.candidates[0].content.parts) {
          for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }

        if (imageUrl) {
          await fetch(`/api/articles/${articleId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: titleStr, summary: summaryStr, content: contentStr, image_url: imageUrl }),
          });
        }
      } catch (imgErr) {
        console.error('Image generation failed:', imgErr);
        // Continue even if image generation fails
      }
      
      setNewArticleId(articleId);
      setProgressText('文章生成并保存成功！');
      
      setKeyword('');
      fetchArticles();
    } catch (err: any) {
      console.error(err);
      const keyInfo = currentApiKey ? `(Key length: ${currentApiKey.length}, starts with: ${currentApiKey.substring(0, 4)})` : '(Key is empty)';
      setError(`${err.message || 'AI 生成过程中发生错误'} ${keyInfo}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这篇文章吗？')) return;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('删除文章失败');
      }
      
      fetchArticles();
    } catch (err: any) {
      console.error(err);
      setError(err.message || '删除文章失败');
    }
  };

  const parseLocalizedText = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      // Default to Chinese for admin dashboard
      return parsed['zh'] || parsed['en'] || '未命名';
    } catch (e) {
      return jsonStr; // Fallback for old articles
    }
  };

  return (
    <div className="min-h-screen pb-10 md:pb-20 pt-6 md:pt-12 max-w-5xl mx-auto px-4 md:px-6 relative">
      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mr-4">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">配置 API Key</h3>
                <p className="text-sm text-slate-500">请输入您的 Gemini API Key</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
              <div className="flex flex-col gap-2 mt-3">
                <p className="text-xs text-slate-500">
                  您的 Key 仅保存在当前浏览器的本地缓存中 (localStorage)，不会上传到我们的服务器。
                </p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  还没有 Key？点击这里免费获取 Gemini API Key
                </a>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveCustomKey}
                className="flex-1 px-4 py-3 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition-colors shadow-[0_4px_0_0_rgba(14,165,233,0.2)] active:shadow-none active:translate-y-1"
              >
                保存并使用
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link to="/" className="flex items-center text-slate-500 hover:text-sky-600 transition-colors w-fit">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回主页
        </Link>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <h1 className="text-2xl font-black text-slate-900 flex items-center">
            <Edit3 className="w-6 h-6 mr-3 text-sky-500" />
            后台管理
          </h1>
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors text-sm font-bold"
          >
            <Key className="w-4 h-4 mr-2" />
            配置 Key
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 mb-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-2">AI 文章生成器</h2>
            <p className="text-slate-500 text-sm mb-6">
              您可以输入关键词生成指定主题的文章，或者让 AI 自动搜索全网最新的育儿热点来生成文章。文章会自动翻译成 7 种语言。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex items-center bg-amber-50 p-2 rounded-full border border-amber-100 focus-within:border-amber-500 transition-colors">
                <Search className="w-5 h-5 text-amber-400 ml-2 mr-2" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="输入关键词，如：宝宝辅食、睡眠训练..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium"
                  disabled={generating}
                />
              </div>
              <button
                onClick={() => handleGenerateAI(false)}
                disabled={generating || !keyword.trim()}
                className="flex items-center justify-center px-6 py-3 bg-sky-500 text-white font-bold rounded-full hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_0_rgba(14,165,233,0.2)] active:shadow-none active:translate-y-1 whitespace-nowrap"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                根据关键词生成
              </button>
              <button
                onClick={() => handleGenerateAI(true)}
                disabled={generating}
                className="flex items-center justify-center px-6 py-3 bg-amber-500 text-white font-bold rounded-full hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_0_rgba(245,158,11,0.2)] active:shadow-none active:translate-y-1 whitespace-nowrap"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                搜索全网热点生成
              </button>
            </div>
          </div>
        </div>
        
        {generating && (
          <div className="mt-6 p-6 bg-sky-50 rounded-[2rem] border border-sky-100 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-4" />
            <p className="text-sky-900 font-medium text-center">{progressText}</p>
            <div className="w-full max-w-md bg-sky-200/50 rounded-full h-1.5 mt-4 overflow-hidden">
              <div className="bg-sky-600 h-1.5 rounded-full animate-[pulse_2s_ease-in-out_infinite] w-full origin-left scale-x-50"></div>
            </div>
          </div>
        )}

        {!generating && newArticleId && (
          <div className="mt-6 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-amber-900 font-bold text-lg mb-1 flex items-center justify-center sm:justify-start">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-600" />
                  新文章生成成功！
                </h3>
                <p className="text-amber-700 text-sm">您的多语言 SEO 优化文章已发布到网站。</p>
              </div>
              <Link 
                to={`/articles/${newArticleId}`}
                state={{ fromAdmin: true }}
                className="px-6 py-3 bg-amber-600 text-white font-bold rounded-full hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap"
              >
                立即查看文章
              </Link>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">已发布文章</h2>
          <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            共 {articles.length} 篇
          </span>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-slate-500">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center text-slate-500">暂无已发布文章。</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {articles.map(article => (
              <div key={article.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{parseLocalizedText(article.title)}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-3">{parseLocalizedText(article.summary)}</p>
                  <div className="text-xs text-slate-400 font-medium flex gap-4">
                    <span>发布于 {new Date(article.created_at).toLocaleDateString()}</span>
                    <span>PV: {article.pv}</span>
                    <span>UV: {article.uv_count}</span>
                    <span>停留时长: {Math.round(article.total_duration / 1000)}秒</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link 
                    to={`/edit-article/${article.id}`}
                    className="px-4 py-2 bg-sky-100 text-sky-600 font-bold text-sm rounded-full hover:bg-sky-200 transition-colors"
                  >
                    编辑
                  </Link>
                  <Link 
                    to={`/articles/${article.id}`}
                    state={{ fromAdmin: true }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-full hover:bg-slate-200 transition-colors"
                  >
                    查看
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                    title="删除文章"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
