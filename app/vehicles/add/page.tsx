'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car, ChevronLeft, Save, Zap, Battery, Calendar, Plug } from 'lucide-react';

const CONNECTOR_TYPES = [
  { value: 'CCS2', label: 'CCS2 (Combined Charging System)' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'Type2', label: 'Type 2 (Mennekes)' },
  { value: 'GB_T', label: 'GB/T (Китайский стандарт)' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

export default function AddVehiclePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showConnectorSelector, setShowConnectorSelector] = useState(false);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: CURRENT_YEAR.toString(),
    connectorType: 'CCS2',
    maxPowerKw: '',
    batteryCapacityKwh: '',
    currentChargeLevel: '80',
    isActive: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Валидация
      if (!formData.brand || !formData.model || !formData.maxPowerKw || !formData.batteryCapacityKwh) {
        throw new Error('Заполните все обязательные поля');
      }

      if (parseFloat(formData.maxPowerKw) <= 0) {
        throw new Error('Максимальная мощность должна быть больше 0');
      }

      if (parseFloat(formData.batteryCapacityKwh) <= 0) {
        throw new Error('Ёмкость батареи должна быть больше 0');
      }

      if (parseFloat(formData.currentChargeLevel) < 0 || parseFloat(formData.currentChargeLevel) > 100) {
        throw new Error('Уровень заряда должен быть от 0 до 100');
      }

      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка добавления автомобиля');
      }

      // Успешно добавлено - переходим к списку
      router.push('/vehicles');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/vehicles"
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Добавить автомобиль</h1>
            <p className="text-gray-400 text-xs mt-0.5">Заполните информацию о вашем электромобиле</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Brand & Model */}
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-4">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Car className="text-emerald-400" size={18} />
              Основная информация
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 mb-1.5 text-xs">
                  Марка <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Tesla, Nissan, BYD..."
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 text-xs">
                  Модель <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Model 3, Leaf, Han..."
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 text-xs flex items-center gap-1.5">
                  <Calendar size={14} />
                  Год выпуска <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.year}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Только цифры
                      if (value.length <= 4) {
                        setFormData({ ...formData, year: value });
                      }
                    }}
                    onBlur={(e) => {
                      const year = parseInt(e.target.value);
                      if (e.target.value.length === 4 && (year < 1990 || year > 2026)) {
                        setError('Год должен быть от 1990 до 2026');
                      } else {
                        setError('');
                      }
                    }}
                    placeholder="2024"
                    maxLength={4}
                    className="w-full bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-lg px-3 py-2.5 pr-10 text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowYearSelector(!showYearSelector)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-emerald-600/20 rounded-lg transition"
                  >
                    <Calendar size={16} className="text-emerald-400" />
                  </button>
                </div>
                
                {showYearSelector && (
                  <div className="mt-2 bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2">
                      {YEARS.map((year) => {
                        const isSelected = formData.year === year.toString();
                        const isCurrent = year === CURRENT_YEAR;
                        
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, year: year.toString() });
                              setShowYearSelector(false);
                            }}
                            className={`p-2 rounded-lg text-center text-sm font-medium transition ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : isCurrent
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500'
                                : 'bg-[#0f2d26] text-gray-300 hover:bg-emerald-600/20 border border-emerald-900/30'
                            }`}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charging Specs */}
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-4">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Zap className="text-emerald-400" size={18} />
              Характеристики зарядки
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 mb-1.5 text-xs flex items-center gap-1.5">
                  <Plug size={14} />
                  Тип коннектора <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowConnectorSelector(!showConnectorSelector)}
                  className="w-full px-3 py-2.5 bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-lg text-left text-white text-sm hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition flex items-center justify-between"
                >
                  <span>
                    {CONNECTOR_TYPES.find(t => t.value === formData.connectorType)?.label || 'Выберите тип'}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-emerald-400 transition-transform flex-shrink-0 ${showConnectorSelector ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showConnectorSelector && (
                  <div className="mt-2 bg-[#0a1f1a] border-2 border-emerald-900/30 rounded-lg p-2">
                    <div className="space-y-1">
                      {CONNECTOR_TYPES.map((type) => {
                        const isSelected = formData.connectorType === type.value;
                        
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, connectorType: type.value });
                              setShowConnectorSelector(false);
                            }}
                            className={`w-full p-3 rounded-lg text-left text-sm font-medium transition flex items-center gap-2 ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'bg-[#0f2d26] text-gray-300 hover:bg-emerald-600/20 border border-emerald-900/30'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className={isSelected ? '' : 'ml-7'}>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 text-xs flex items-center gap-1.5">
                  <Zap size={14} />
                  Макс. мощность (кВт) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.maxPowerKw}
                  onChange={(e) => setFormData({ ...formData, maxPowerKw: e.target.value })}
                  placeholder="50, 150, 250..."
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 text-xs flex items-center gap-1.5">
                  <Battery size={14} />
                  Ёмкость батареи (кВт·ч) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.batteryCapacityKwh}
                  onChange={(e) => setFormData({ ...formData, batteryCapacityKwh: e.target.value })}
                  placeholder="60, 75, 100..."
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 text-xs flex items-center gap-1.5">
                  <Battery size={14} />
                  Уровень заряда (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.currentChargeLevel}
                    onChange={(e) => setFormData({ ...formData, currentChargeLevel: e.target.value })}
                    className="flex-1"
                  />
                  <div className="w-14 text-center bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-2 py-1.5 text-emerald-400 font-bold text-sm">
                    {formData.currentChargeLevel}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Vehicle */}
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-4">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-emerald-900/30 bg-[#0a1f1a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <div>
                <div className="text-white font-medium text-sm mb-0.5">Активный автомобиль</div>
                <div className="text-gray-400 text-xs">
                  Используется для подбора станций
                </div>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/vehicles"
              className="flex-1 bg-[#0f2d26] hover:bg-[#0f2d26]/80 border border-emerald-900/30 text-gray-300 py-3 rounded-full font-medium transition text-center text-sm"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-full font-medium transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                'Сохранение...'
              ) : (
                <>
                  <Save size={18} />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
