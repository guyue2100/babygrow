import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-black/5">
      <div className="p-2 text-zinc-400">
        <Languages className="w-4 h-4" />
      </div>
      <select
        value={(i18n.language || 'en').split('-')[0]}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-transparent text-xs font-bold text-zinc-600 outline-none pr-4 cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
