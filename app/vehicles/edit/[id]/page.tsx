'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car, ChevronLeft, Save, Zap, Battery, Calendar, Plug, Check, X } from 'lucide-react';

const CONNECTOR_TYPES = [
  { value: 'CCS2', label: 'CCS2 (Combined Charging System)' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'Type2', label: 'Type 2 (Mennekes)' },
  { value: 'GB_T', label: 'GB/T (Китайский стандарт)' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

interface Toast {
  show: boolean;
  message: string;
  details: string;
}

export default function EditVehiclePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<Toast>({ show: false, message: '', details: '' });
  const [initialIsActive, setInitialIsActive] = useState(false);

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

  useEffect(() => {
    if (session && vehicleId) {
      fetchVehicle();
    }
  }, [session, vehicleId]);

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        const vehicle = data.vehicle;
        setInitialIsActive(vehicle.isActive);
        setFormData({
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year.toString(),
          connectorType: vehicle.connectorType,
          maxPowerKw: vehicle.maxPowerKw.toString(),
          batteryCapacityKwh: vehicle.batteryCapacityKwh.toString(),
          currentChargeLevel: vehicle.currentChargeLevel.toString(),
          isActive: vehicle.isActive,
        });
      } else {
        setError('Автомобиль не найден');
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      setError('Ошибка загрузки автомобиля');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

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

      const wasActive = formData.isActive;

      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления автомобиля');
      }

      // Если автомобиль стал активным, показываем уведомление
      if (formData.isActive && !initialIsActive) {
        const connectorLabel = CONNECTOR_TYPES.find(t => t.value === formData.connectorType)?.label.split(' ')[0] || formData.connectorType;
        setToast({
          show: true,
          message: '✅ Активный автомобиль обновлён',
          details: `Теперь при бронировании будет выбран ${connectorLabel} с мощностью ${formData.maxPowerKw} кВт`,
        });

        // Переходим к списку через 2 секунды
        setTimeout(() => {
          router.push('/vehicles');
        }, 2000);
      } else {
        // Успешно обновлено - переходим к списку сразу
        router.push('/vehicles');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
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
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/vehicles"
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Редактировать автомобиль</h1>
            <p className="text-gray-400 text-sm mt-1">Обновите информацию о вашем электромобиле</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand & Model */}
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Car className="text-emerald-400" size={20} />
              Основная информация
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Марка <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Tesla, Nissan, BYD..."
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm">
                  Модель <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Model 3, Leaf, Han..."
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm flex items-center gap-2">
                  <Calendar size={16} />
                  Год выпуска <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  required
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Charging Specs */}
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="text-emerald-400" size={20} />
              Характеристики зарядки
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm flex items-center gap-2">
                  <Plug size={16} />
                  Тип коннектора <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.connectorType}
                  onChange={(e) => setFormData({ ...formData, connectorType: e.target.value })}
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  required
                >
                  {CONNECTOR_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm flex items-center gap-2">
                  <Zap size={16} />
                  Максимальная мощность зарядки (кВт) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.maxPowerKw}
                  onChange={(e) => setFormData({ ...formData, maxPowerKw: e.target.value })}
                  placeholder="50, 150, 250..."
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm flex items-center gap-2">
                  <Battery size={16} />
                  Ёмкость батареи (кВт·ч) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.batteryCapacityKwh}
                  onChange={(e) => setFormData({ ...formData, batteryCapacityKwh: e.target.value })}
                  placeholder="60, 75, 100..."
                  className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm flex items-center gap-2">
                  <Battery size={16} />
                  Текущий уровень заряда (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.currentChargeLevel}
                    onChange={(e) => setFormData({ ...formData, currentChargeLevel: e.target.value })}
                    className="flex-1"
                  />
                  <div className="w-16 text-center bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-3 py-2 text-emerald-400 font-bold">
                    {formData.currentChargeLevel}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Vehicle */}
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mt-1 w-5 h-5 rounded border-emerald-900/30 bg-[#0a1f1a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <div>
                <div className="text-white font-medium mb-1">Активный автомобиль</div>
                <div className="text-gray-400 text-sm">
                  Активный автомобиль используется для подбора подходящих зарядных станций (опционально)
                </div>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link
              href="/vehicles"
              className="flex-1 bg-[#0f2d26] hover:bg-[#0f2d26]/80 border border-emerald-900/30 text-gray-300 py-4 rounded-full font-medium transition text-center"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-full font-medium transition flex items-center justify-center gap-2"
            >
              {saving ? (
                'Сохранение...'
              ) : (
                <>
                  <Save size={20} />
                  Сохранить изменения
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-[#0f2d26] border-2 border-emerald-500 rounded-2xl p-6 shadow-2xl shadow-emerald-500/20 max-w-md">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="text-emerald-400" size={24} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">{toast.message}</h4>
                </div>
              </div>
              <button
                onClick={() => setToast({ show: false, message: '', details: '' })}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-300 text-sm mb-4 ml-15">{toast.details}</p>
            <div className="bg-[#0a1f1a] rounded-lg p-4 border border-emerald-900/30 mb-4">
              <div className="flex items-center gap-3">
                <Car className="text-emerald-400" size={20} />
                <span className="text-white font-medium">
                  {formData.brand} {formData.model}
                </span>
              </div>
            </div>
            <div className="text-gray-400 text-sm text-center">
              Переход к списку автомобилей...
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
