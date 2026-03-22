import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize SQLite Database
// On Vercel, we must use /tmp for any writable files, but note that it won't persist between requests.
// For production, consider using a remote database like Supabase or MongoDB.
const dbPath = process.env.VERCEL ? '/tmp/articles.db' : 'articles.db';
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,
    read_count INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    pv INTEGER DEFAULT 0,
    uv_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS article_visits (
    article_id INTEGER,
    user_id TEXT,
    PRIMARY KEY (article_id, user_id),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  )
`);

// Ensure columns exist (for existing databases)
try {
  db.exec(`ALTER TABLE articles ADD COLUMN pv INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE articles ADD COLUMN uv_count INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE articles ADD COLUMN image_url TEXT`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE articles ADD COLUMN initial_read_count INTEGER`);
  // Populate existing articles with unique initial_read_count
  const articles = db.prepare('SELECT id FROM articles').all();
  const used = new Set<number>();
  for (const article of articles) {
    let initialReadCount;
    do {
      initialReadCount = Math.floor(Math.random() * (1034 - 634 + 1)) + 634;
    } while (used.has(initialReadCount));
    used.add(initialReadCount);
    db.prepare('UPDATE articles SET initial_read_count = ? WHERE id = ?').run(initialReadCount, article.id);
  }
} catch (e) {}

app.use(express.json());

// API Routes
app.get('/api/articles', (req, res) => {
  const stmt = db.prepare('SELECT id, title, summary, created_at, read_count, total_duration, initial_read_count, pv, uv_count FROM articles ORDER BY created_at DESC');
  const articles = stmt.all();
  res.json(articles);
});

app.get('/api/articles/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM articles WHERE id = ?');
  const article = stmt.get(req.params.id);
  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ error: 'Article not found' });
  }
});

app.post('/api/articles', (req, res) => {
  const { title, content, summary, image_url } = req.body;
  
  // Generate unique initial_read_count for the last 20 articles
  const recent = db.prepare('SELECT initial_read_count FROM articles ORDER BY created_at DESC LIMIT 20').all();
  const used = recent.map(r => r.initial_read_count);
  let initialReadCount;
  do {
    initialReadCount = Math.floor(Math.random() * (1034 - 634 + 1)) + 634;
  } while (used.includes(initialReadCount));

  const stmt = db.prepare('INSERT INTO articles (title, content, summary, image_url, initial_read_count) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(title, content, summary, image_url, initialReadCount);
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/articles/:id/track', (req, res) => {
  const { action, value, userId, isAdminView } = req.body;
  const articleId = req.params.id;

  if (isAdminView) {
    return res.json({ success: true });
  }

  if (action === 'pv') {
    db.prepare('UPDATE articles SET pv = pv + 1 WHERE id = ?').run(articleId);
    
    // Track UV
    if (userId) {
      try {
        db.prepare('INSERT OR IGNORE INTO article_visits (article_id, user_id) VALUES (?, ?)').run(articleId, userId);
        const changes = db.prepare('SELECT changes() as changes').get();
        if (changes.changes > 0) {
          db.prepare('UPDATE articles SET uv_count = uv_count + 1 WHERE id = ?').run(articleId);
        }
      } catch (e) {}
    }
  } else if (action === 'duration') {
    db.prepare('UPDATE articles SET total_duration = total_duration + ? WHERE id = ?').run(value, articleId);
  }

  res.json({ success: true });
});

app.delete('/api/articles/:id', (req, res) => {
  const articleId = req.params.id;
  // Delete associated visits first
  db.prepare('DELETE FROM article_visits WHERE article_id = ?').run(articleId);
  // Then delete the article
  db.prepare('DELETE FROM articles WHERE id = ?').run(articleId);
  res.json({ success: true });
});

app.put('/api/articles/:id', (req, res) => {
  const { title, content, summary, image_url, read_count, total_duration } = req.body;
  
  if (read_count !== undefined && total_duration !== undefined) {
    const stmt = db.prepare('UPDATE articles SET title = ?, content = ?, summary = ?, image_url = ?, read_count = ?, total_duration = ? WHERE id = ?');
    stmt.run(title, content, summary, image_url, read_count, total_duration, req.params.id);
  } else {
    const stmt = db.prepare('UPDATE articles SET title = ?, content = ?, summary = ?, image_url = ? WHERE id = ?');
    stmt.run(title, content, summary, image_url, req.params.id);
  }
  res.json({ success: true });
});

app.get('/api/debug-env', (req, res) => {
  res.json({
    geminiKey: process.env.GEMINI_API_KEY ? `Length: ${process.env.GEMINI_API_KEY.length}` : 'undefined',
    allKeys: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('KEY'))
  });
});

app.get('/api/debug-env-full', (req, res) => {
  res.json(process.env);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}
