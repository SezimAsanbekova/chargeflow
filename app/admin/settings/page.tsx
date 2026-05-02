'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Mail, MessageSquare, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Setting {
  id: string;
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const settingsMap: Record<string, string> = {};
        data.settings.forEach((s: Setting) => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setMessage('Настройки успешно сохранены');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Ошибка сохранения настроек');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Настройки</h1>
          <p className="text-gray-400">Конфигурация системы и параметры</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes('успешно')
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {message}
          </div>
        )}

        {/* Telegram Settings */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-blue-500" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">Telegram</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Bot Token
              </label>
              <input
                type="text"
                value={settings.ADMIN_TELEGRAM_BOT_TOKEN || ''}
                onChange={(e) =>
                  updateSetting('ADMIN_TELEGRAM_BOT_TOKEN', e.target.value)
                }
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-gray-500 text-xs mt-1">
                Токен бота для отправки уведомлений администраторам
              </p>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Admin Telegram User ID
              </label>
              <input
                type="text"
                value={settings.ADMIN_TELEGRAM_USER_ID || ''}
                onChange={(e) =>
                  updateSetting('ADMIN_TELEGRAM_USER_ID', e.target.value)
                }
                placeholder="123456789"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-gray-500 text-xs mt-1">
                Telegram ID администратора для получения кодов входа
              </p>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Mail className="text-purple-500" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">Email</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.SMTP_HOST || ''}
                onChange={(e) => updateSetting('SMTP_HOST', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  SMTP Port
                </label>
                <input
                  type="text"
                  value={settings.SMTP_PORT || ''}
                  onChange={(e) => updateSetting('SMTP_PORT', e.target.value)}
                  placeholder="587"
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  SMTP Secure
                </label>
                <select
                  value={settings.SMTP_SECURE || 'true'}
                  onChange={(e) => updateSetting('SMTP_SECURE', e.target.value)}
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="true">TLS (true)</option>
                  <option value="false">No TLS (false)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                SMTP User
              </label>
              <input
                type="email"
                value={settings.SMTP_USER || ''}
                onChange={(e) => updateSetting('SMTP_USER', e.target.value)}
                placeholder="your-email@gmail.com"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                SMTP Password
              </label>
              <input
                type="password"
                value={settings.SMTP_PASSWORD || ''}
                onChange={(e) =>
                  updateSetting('SMTP_PASSWORD', e.target.value)
                }
                placeholder="••••••••••••"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                From Email
              </label>
              <input
                type="email"
                value={settings.EMAIL_FROM || ''}
                onChange={(e) => updateSetting('EMAIL_FROM', e.target.value)}
                placeholder="noreply@chargeflow.com"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-500" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">Платежи</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Минимальная сумма пополнения (сом)
              </label>
              <input
                type="number"
                value={settings.MIN_TOPUP_AMOUNT || ''}
                onChange={(e) =>
                  updateSetting('MIN_TOPUP_AMOUNT', e.target.value)
                }
                placeholder="100"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Сумма депозита за бронирование (сом)
              </label>
              <input
                type="number"
                value={settings.BOOKING_DEPOSIT_AMOUNT || ''}
                onChange={(e) =>
                  updateSetting('BOOKING_DEPOSIT_AMOUNT', e.target.value)
                }
                placeholder="50"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Комиссия системы (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.SYSTEM_FEE_PERCENT || ''}
                onChange={(e) =>
                  updateSetting('SYSTEM_FEE_PERCENT', e.target.value)
                }
                placeholder="5"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-[#0f2d26] border border-emerald-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <SettingsIcon className="text-amber-500" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">Система</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Название приложения
              </label>
              <input
                type="text"
                value={settings.APP_NAME || ''}
                onChange={(e) => updateSetting('APP_NAME', e.target.value)}
                placeholder="ChargeFlow"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                URL приложения
              </label>
              <input
                type="url"
                value={settings.APP_URL || ''}
                onChange={(e) => updateSetting('APP_URL', e.target.value)}
                placeholder="https://chargeflow.com"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Поддержка Email
              </label>
              <input
                type="email"
                value={settings.SUPPORT_EMAIL || ''}
                onChange={(e) =>
                  updateSetting('SUPPORT_EMAIL', e.target.value)
                }
                placeholder="support@chargeflow.com"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Поддержка Телефон
              </label>
              <input
                type="tel"
                value={settings.SUPPORT_PHONE || ''}
                onChange={(e) =>
                  updateSetting('SUPPORT_PHONE', e.target.value)
                }
                placeholder="+996 XXX XXX XXX"
                className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <Link
            href="/admin/dashboard"
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-center"
          >
            Назад к панели
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </div>
    </div>
  );
}
