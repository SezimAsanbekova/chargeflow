'use client';

import { useState } from 'react';
import { locales, localeNames, localeFlags, type Locale } from '../config';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export default function LanguageSwitcher({ 
  currentLocale, 
  onLocaleChange 
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
      >
        <span>{localeFlags[currentLocale]}</span>
        <span className="text-gray-300">{localeNames[currentLocale]}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#0f2d26] border border-emerald-500/30 shadow-xl z-20">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => {
                  onLocaleChange(locale);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition first:rounded-t-lg last:rounded-b-lg ${
                  locale === currentLocale
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-300 hover:bg-emerald-500/10'
                }`}
              >
                <span className="text-xl">{localeFlags[locale]}</span>
                <span className="font-medium">{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <svg
                    className="w-5 h-5 ml-auto text-emerald-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
