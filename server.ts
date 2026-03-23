import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase environment variables are missing!');
  console.log('Available env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(express.json());

// API Routes
app.get('/api/articles', async (req, res) => {
  console.log('Fetching articles from Supabase...');
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, summary, created_at, read_count, total_duration, initial_read_count, pv, uv_count')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching articles:', error);
    return res.status(500).json({ error: error.message });
  }
  
  console.log(`Successfully fetched ${data?.length || 0} articles`);
  res.json(data);
});

app.get('/api/articles/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (error) return res.status(404).json({ error: 'Article not found' });
  res.json(data);
});

app.post('/api/articles', async (req, res) => {
  const { title, content, summary, image_url } = req.body;
  
  // Generate unique initial_read_count
  const { data: recent } = await supabase
    .from('articles')
    .select('initial_read_count')
    .order('created_at', { ascending: false })
    .limit(20);
  
  const used = recent?.map(r => r.initial_read_count) || [];
  let initialReadCount;
  do {
    initialReadCount = Math.floor(Math.random() * (1034 - 634 + 1)) + 634;
  } while (used.includes(initialReadCount));

  const { data, error } = await supabase
    .from('articles')
    .insert([{ title, content, summary, image_url, initial_read_count: initialReadCount }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id });
});

app.post('/api/articles/:id/track', async (req, res) => {
  const { action, value, userId, isAdminView } = req.body;
  const articleId = req.params.id;

  if (isAdminView) {
    return res.json({ success: true });
  }

  if (action === 'pv') {
    // Increment PV
    await supabase.rpc('increment_pv', { article_id: articleId });
    
    // Track UV
    if (userId) {
      const { error: visitError } = await supabase
        .from('article_visits')
        .insert([{ article_id: articleId, user_id: userId }]);
      
      if (!visitError) {
        // If insert was successful (not a duplicate), increment UV
        await supabase.rpc('increment_uv', { article_id: articleId });
      }
    }
  } else if (action === 'duration') {
    await supabase.rpc('increment_duration', { article_id: articleId, increment_value: value });
  }

  res.json({ success: true });
});

app.delete('/api/articles/:id', async (req, res) => {
  const articleId = req.params.id;
  
  // Supabase handles cascading deletes if configured, but let's be explicit if not
  await supabase.from('article_visits').delete().eq('article_id', articleId);
  const { error } = await supabase.from('articles').delete().eq('id', articleId);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put('/api/articles/:id', async (req, res) => {
  const { title, content, summary, image_url, read_count, total_duration } = req.body;
  
  const updateData: any = { title, content, summary, image_url };
  if (read_count !== undefined) updateData.read_count = read_count;
  if (total_duration !== undefined) updateData.total_duration = total_duration;

  const { error } = await supabase
    .from('articles')
    .update(updateData)
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/debug-env', async (req, res) => {
  let supabaseStatus = 'unknown';
  let articleCount = 0;
  
  try {
    const { count, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      supabaseStatus = `Error: ${error.message}`;
    } else {
      supabaseStatus = 'Connected';
      articleCount = count || 0;
    }
  } catch (e: any) {
    supabaseStatus = `Exception: ${e.message}`;
  }

  res.json({
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    supabaseUrl: supabaseUrl ? 'Defined' : 'Missing',
    supabaseAnonKey: supabaseAnonKey ? 'Defined' : 'Missing',
    supabaseStatus,
    articleCount,
    geminiKey: process.env.GEMINI_API_KEY ? 'Defined' : 'Missing',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Export for Vercel
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}
