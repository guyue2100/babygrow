import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import EditArticle from './pages/EditArticle';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/articles" element={<Articles />} />
      <Route path="/articles/:id" element={<ArticleDetail />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/edit-article/:id" element={<EditArticle />} />
    </Routes>
  );
}
