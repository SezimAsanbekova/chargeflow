'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useSession } from 'next-auth/react';
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
import { getTranslations, getLocaleCookie, setLocaleCookie, defaultLocale, type Locale } from '@/app/i18n';
import LanguageSwitcher from '@/app/i18n/components/LanguageSwitcher';

export default function HomePage() {
  const { status } = useSession();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Редирект авторизованных пользователей в профиль
  useEffect(() => {
    if (status === 'authenticated') {
      window.location.href = '/profile';
    }
  }, [status]);

  // Загрузка переводов при изменении языка
  useEffect(() => {
    setIsLoading(true);
    getTranslations(locale, 'landing')
      .then(translations => {
        setT(translations);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to load translations:', error);
        setIsLoading(false);
      });
  }, [locale]);

  // Восстановление языка из cookies при загрузке
  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) {
      setLocale(savedLocale);
    }
  }, []);

  // Обработчик изменения языка
  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleCookie(newLocale);
  };

  // Показываем загрузку или если идет редирект
  if (isLoading || !t || status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mb-4"></div>
          <div className="text-emerald-400 text-lg">
            {status === 'authenticated' ? 'Переход в профиль...' : 'Загрузка...'}
          </div>
        </div>
      </div>
    );
  }
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
            <Link href="#features" className="text-gray-300 hover:text-emerald-400 transition">{t.nav.features}</Link>
            <Link href="#how-it-works" className="text-gray-300 hover:text-emerald-400 transition">{t.nav.howItWorks}</Link>
            <Link href="#pricing" className="text-gray-300 hover:text-emerald-400 transition">{t.nav.pricing}</Link>
            <Link href="#app" className="text-gray-300 hover:text-emerald-400 transition">{t.nav.app}</Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher 
              currentLocale={locale}
              onLocaleChange={handleLocaleChange}
            />
            <Link href="/auth/signin" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full transition">
              {t.nav.login}
            </Link>
          </div>
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
              <div className="text-3xl font-bold text-emerald-400 mb-2">{t.hero.stats.stations.value}</div>
              <div className="text-gray-400">{t.hero.stats.stations.label}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">{t.hero.stats.connectors.value}</div>
              <div className="text-gray-400">{t.hero.stats.connectors.label}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">{t.hero.stats.support.value}</div>
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
            {/* Feature 1 */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-2xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">{t.features.smartSearch.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t.features.smartSearch.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {t.features.smartSearch.connectors.map((connector: string, idx: number) => (
                  <span key={idx} className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">{connector}</span>
                ))}
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-2xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">{t.features.booking.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t.features.booking.description}
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {t.features.booking.benefits.map((benefit: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-400" size={16} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-2xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">{t.features.quickStart.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t.features.quickStart.description}
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {t.features.quickStart.tracking.map((item: string, idx: number) => (
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-medium">{t.howItWorks.badge}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
              {t.howItWorks.title} <span className="text-emerald-400">{t.howItWorks.titleHighlight}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Car },
              { icon: MapPin },
              { icon: Calendar },
              { icon: CreditCard }
            ].map((item, idx) => {
              const IconComponent = item.icon;
              const step = t.howItWorks.steps[idx];
              return (
                <div key={idx} className="relative">
                  <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6 hover:border-emerald-500/50 transition">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {idx + 1}
                    </div>
                    <div className="mt-4 mb-4">
                      <IconComponent className="text-emerald-400" size={48} />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Payment & Features Section */}
      <section className="py-20 px-6 bg-[#0f2d26]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="text-emerald-400 font-medium">{t.payment.badge}</span>
              <h2 className="text-4xl font-bold text-white mt-4 mb-6">
                {t.payment.title}<br />
                <span className="text-emerald-400">{t.payment.titleHighlight}</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-2">{t.payment.methods.card.title}</h3>
                    <p className="text-gray-400 text-sm">{t.payment.methods.card.description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-2">{t.payment.methods.balance.title}</h3>
                    <p className="text-gray-400 text-sm">{t.payment.methods.balance.description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Receipt className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-2">{t.payment.methods.receipts.title}</h3>
                    <p className="text-gray-400 text-sm">{t.payment.methods.receipts.description}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#0a1f1a] rounded-2xl p-8 border border-emerald-500/20">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-emerald-900/30">
                  <span className="text-gray-400">{t.payment.invoice.energy}</span>
                  <span className="text-white font-bold">{t.payment.invoice.energyValue}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-emerald-900/30">
                  <span className="text-gray-400">{t.payment.invoice.tariff}</span>
                  <span className="text-white font-bold">{t.payment.invoice.tariffValue}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-emerald-900/30">
                  <span className="text-gray-400">{t.payment.invoice.deposit}</span>
                  <span className="text-emerald-400 font-bold">{t.payment.invoice.depositValue}</span>
                </div>
                <div className="flex justify-between items-center text-xl">
                  <span className="text-white font-bold">{t.payment.invoice.total}</span>
                  <span className="text-emerald-400 font-bold">{t.payment.invoice.totalValue}</span>
                </div>
                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-medium transition">
                  {t.payment.invoice.pay}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Section */}
      <section id="app" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl p-8 backdrop-blur-sm border border-emerald-500/20">
                <div className="bg-[#0f2d26] rounded-2xl p-6 space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-emerald-900/30">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Smartphone className="text-emerald-400" size={32} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{t.app.card.title}</h3>
                      <p className="text-gray-400 text-sm">{t.app.card.compatibility}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {t.app.card.features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="text-emerald-400" size={14} />
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button className="flex-1 bg-[#0a1f1a] hover:bg-emerald-500/20 text-white py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 border border-emerald-900/30 hover:border-emerald-500/50">
                      <Apple size={24} />
                      <div className="text-left">
                        <div className="text-xs text-gray-400">{t.app.card.appStore.prefix}</div>
                        <div className="text-sm font-bold">{t.app.card.appStore.name}</div>
                      </div>
                    </button>
                    <button className="flex-1 bg-[#0a1f1a] hover:bg-emerald-500/20 text-white py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 border border-emerald-900/30 hover:border-emerald-500/50">
                      <Play size={24} />
                      <div className="text-left">
                        <div className="text-xs text-gray-400">{t.app.card.googlePlay.prefix}</div>
                        <div className="text-sm font-bold">{t.app.card.googlePlay.name}</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="text-emerald-400 font-medium">{t.app.badge}</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
                {t.app.title}<br />
                <span className="text-emerald-400">{t.app.titleHighlight}</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                {t.app.description}
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{t.app.stats.downloads.value}</div>
                  <div className="text-gray-400 text-sm">{t.app.stats.downloads.label}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{t.app.stats.rating.value}</div>
                  <div className="text-gray-400 text-sm">{t.app.stats.rating.label}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{t.app.stats.support.value}</div>
                  <div className="text-gray-400 text-sm">{t.app.stats.support.label}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{t.app.stats.uptime.value}</div>
                  <div className="text-gray-400 text-sm">{t.app.stats.uptime.label}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-[#0f2d26]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-medium">{t.pricing.badge}</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              {t.pricing.title} <span className="text-emerald-400">{t.pricing.titleHighlight}</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t.pricing.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* AC Charging */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-2xl p-8 hover:border-emerald-500/50 transition">
              <div className="mb-4">
                <Zap className="text-emerald-400" size={48} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">{t.pricing.plans.ac.title}</h3>
              <p className="text-gray-400 text-sm mb-6">{t.pricing.plans.ac.subtitle}</p>
              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  {t.pricing.plans.ac.price}<span className="text-2xl text-gray-400"> {t.pricing.plans.ac.currency}</span>
                </div>
                <div className="text-gray-400 text-sm">{t.pricing.plans.ac.unit}</div>
              </div>
              <ul className="space-y-3 mb-8">
                {t.pricing.plans.ac.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                    <CheckCircle className="text-emerald-400" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* DC Fast Charging */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-[#0a1f1a] border-2 border-emerald-500 rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                {t.pricing.plans.dcFast.badge}
              </div>
              <div className="mb-4">
                <Zap className="text-emerald-400" size={48} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">{t.pricing.plans.dcFast.title}</h3>
              <p className="text-gray-400 text-sm mb-6">{t.pricing.plans.dcFast.subtitle}</p>
              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  {t.pricing.plans.dcFast.price}<span className="text-2xl text-gray-400"> {t.pricing.plans.dcFast.currency}</span>
                </div>
                <div className="text-gray-400 text-sm">{t.pricing.plans.dcFast.unit}</div>
              </div>
              <ul className="space-y-3 mb-8">
                {t.pricing.plans.dcFast.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                    <CheckCircle className="text-emerald-400" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ultra Fast Charging */}
            <div className="bg-[#0a1f1a] border border-emerald-900/30 rounded-2xl p-8 hover:border-emerald-500/50 transition">
              <div className="mb-4">
                <Zap className="text-emerald-400" size={48} />
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">{t.pricing.plans.dcUltra.title}</h3>
              <p className="text-gray-400 text-sm mb-6">{t.pricing.plans.dcUltra.subtitle}</p>
              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  {t.pricing.plans.dcUltra.price}<span className="text-2xl text-gray-400"> {t.pricing.plans.dcUltra.currency}</span>
                </div>
                <div className="text-gray-400 text-sm">{t.pricing.plans.dcUltra.unit}</div>
              </div>
              <ul className="space-y-3 mb-8">
                {t.pricing.plans.dcUltra.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                    <CheckCircle className="text-emerald-400" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              {t.pricing.note}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t.cta.title}
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            {t.cta.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-medium transition flex items-center justify-center gap-2">
              <Smartphone size={20} />
              {t.cta.downloadApp}
            </button>
            <button className="border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 px-8 py-4 rounded-full font-medium transition">
              {t.cta.contact}
            </button>
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
                {t.footer.company.links.map((link: string, idx: number) => (
                  <li key={idx}><Link href="#" className="hover:text-emerald-400 transition">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t.footer.support.title}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {t.footer.support.links.map((link: string, idx: number) => (
                  <li key={idx}><Link href="#" className="hover:text-emerald-400 transition">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t.footer.legal.title}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {t.footer.legal.links.map((link: string, idx: number) => (
                  <li key={idx}><Link href="#" className="hover:text-emerald-400 transition">{link}</Link></li>
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
