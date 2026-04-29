/**
 * Пример использования локализации на главной странице
 * 
 * Этот файл показывает, как интегрировать переводы в существующую страницу.
 * Скопируйте нужные части в app/page.tsx для использования.
 */

import Link from "next/link";
import Image from "next/image";
import { 
  Zap, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Car, 
  Smartphone, 
  CheckCircle,
  Wallet,
  Receipt,
  Apple,
  Play,
  MessageCircle,
  Mail,
  Phone
} from "lucide-react";
import { getTranslations } from '@/app/i18n';
import type { Locale } from '@/app/i18n/config';

interface HomePageProps {
  params: {
    locale: Locale;
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const t = await getTranslations(params.locale, 'landing');

  return (
    <div className="min-h-screen bg-[#0a1f1a]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0a1f1a]/95 backdrop-blur-sm z-50 border-b border-emerald-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo12.png" 
              alt="ChargeFlow Logo" 
              width={40} 
              height={40}
              className="object-contain"
            />
            <span className="text-white font-bold text-xl">{t.nav.logo}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-300 hover:text-emerald-400 transition">
              {t.nav.features}
            </Link>
            <Link href="#how-it-works" className="text-gray-300 hover:text-emerald-400 transition">
              {t.nav.howItWorks}
            </Link>
            <Link href="#pricing" className="text-gray-300 hover:text-emerald-400 transition">
              {t.nav.pricing}
            </Link>
            <Link href="#app" className="text-gray-300 hover:text-emerald-400 transition">
              {t.nav.app}
            </Link>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full transition">
            {t.nav.login}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <span className="text-emerald-400 text-sm font-medium">{t.hero.badge}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="text-emerald-400">{t.hero.title}</span><br />
            {t.hero.titleHighlight}
          </h1>
          <p className="text-gray-400 text-lg mb-12 leading-relaxed max-w-2xl mx-auto">
            {t.hero.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-medium transition flex items-center justify-center gap-2">
              <Smartphone size={20} />
              {t.hero.downloadApp}
            </button>
            <button className="border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 px-8 py-4 rounded-full font-medium transition">
              {t.hero.findStation}
            </button>
          </div>
          <div className="flex items-center justify-center gap-16 text-sm">
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                {t.hero.stats.stations.value}
              </div>
              <div className="text-gray-400">{t.hero.stats.stations.label}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                {t.hero.stats.connectors.value}
              </div>
              <div className="text-gray-400">{t.hero.stats.connectors.label}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                {t.hero.stats.support.value}
              </div>
              <div className="text-gray-400">{t.hero.stats.support.label}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#0f2d26]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-medium">{t.features.badge}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              {t.features.title}<br />
              <span className="text-emerald-400">{t.features.titleHighlight}</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - Smart Search */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-2xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">
                {t.features.smartSearch.title}
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t.features.smartSearch.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {t.features.smartSearch.connectors.map((connector, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full"
                  >
                    {connector}
                  </span>
                ))}
              </div>
            </div>

            {/* Feature 2 - Booking */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-2xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">
                {t.features.booking.title}
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t.features.booking.description}
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {t.features.booking.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-400" size={16} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 3 - Quick Start */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-2xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">
                {t.features.quickStart.title}
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t.features.quickStart.description}
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {t.features.quickStart.tracking.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-400" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f2d26] border-t border-emerald-900/20 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image 
                  src="/logo12.png" 
                  alt="ChargeFlow Logo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
                <span className="text-white font-bold text-xl">{t.nav.logo}</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                {t.footer.description}
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full flex items-center justify-center transition">
                  <Phone className="text-emerald-400" size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full flex items-center justify-center transition">
                  <MessageCircle className="text-emerald-400" size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full flex items-center justify-center transition">
                  <Mail className="text-emerald-400" size={18} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t.footer.company.title}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {t.footer.company.links.map((link, idx) => (
                  <li key={idx}>
                    <Link href="#" className="hover:text-emerald-400 transition">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t.footer.support.title}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {t.footer.support.links.map((link, idx) => (
                  <li key={idx}>
                    <Link href="#" className="hover:text-emerald-400 transition">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t.footer.legal.title}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {t.footer.legal.links.map((link, idx) => (
                  <li key={idx}>
                    <Link href="#" className="hover:text-emerald-400 transition">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-900/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm text-center md:text-left">
              {t.footer.copyright}
            </div>
            <div className="flex gap-6 text-gray-400 text-sm">
              <span>{t.footer.country}</span>
              <span>•</span>
              <span>{t.footer.language}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
