'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Car, Plus, Edit2, Trash2, Check, ChevronLeft, Battery, Zap, Calendar, X } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  connectorType: string;
  maxPowerKw: number;
  batteryCapacityKwh: number;
  currentChargeLevel: number;
  isActive: boolean;
  createdAt: string;
}

interface Toast {
  show: boolean;
  message: string;
  details: string;
  vehicle?: Vehicle;
}

interface DeleteModal {
  show: boolean;
  vehicle: Vehicle | null;
}

export default function VehiclesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<Toast>({ show: false, message: '', details: '' });
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ show: false, vehicle: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchVehicles();
    }
  }, [session]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles);
      } else {
        setError('Ошибка загрузки автомобилей');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Ошибка загрузки автомобилей');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/set-active`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        const updatedVehicle = data.vehicle;
        
        // Показываем уведомление
        setToast({
          show: true,
          message: '✅ Активный автомобиль обновлён',
          details: `Теперь при бронировании будет выбран ${getConnectorLabel(updatedVehicle.connectorType)} с мощностью ${updatedVehicle.maxPowerKw} кВт`,
          vehicle: updatedVehicle,
        });

        // Скрываем уведомление через 5 секунд
        setTimeout(() => {
          setToast({ show: false, message: '', details: '' });
        }, 5000);

        fetchVehicles(); // Обновляем список
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка установки активного автомобиля');
      }
    } catch (error) {
      console.error('Error setting active vehicle:', error);
      setError('Ошибка установки активного автомобиля');
    }
  };

  const handleDeactivate = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      if (response.ok) {
        fetchVehicles(); // Обновляем список
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка деактивации автомобиля');
      }
    } catch (error) {
      console.error('Error deactivating vehicle:', error);
      setError('Ошибка деактивации автомобиля');
    }
  };

  const handleDelete = async (vehicleId: string, vehicleName: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteModal({ show: false, vehicle: null });
        fetchVehicles(); // Обновляем список
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка удаления автомобиля');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setError('Ошибка удаления автомобиля');
    } finally {
      setDeleting(false);
    }
  };

  const getConnectorLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      CCS2: 'CCS2',
      CHAdeMO: 'CHAdeMO',
      Type2: 'Type 2',
      GB_T: 'GB/T',
    };
    return labels[type] || type;
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Мои автомобили</h1>
              <p className="text-gray-400 text-sm mt-1">
                {vehicles.length === 0
                  ? 'У вас пока нет автомобилей'
                  : `${vehicles.length} ${vehicles.length === 1 ? 'автомобиль' : 'автомобилей'}`}
              </p>
            </div>
          </div>
          <Link
            href="/vehicles/add"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-medium transition flex items-center gap-2"
          >
            <Plus size={20} />
            Добавить
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Vehicles List */}
        {vehicles.length === 0 ? (
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="text-emerald-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Добавьте свой первый автомобиль</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Добавьте информацию о вашем электромобиле, чтобы мы могли подобрать подходящие зарядные станции
            </p>
            <Link
              href="/vehicles/add"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-medium transition"
            >
              <Plus size={20} />
              Добавить автомобиль
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`bg-[#0f2d26] border rounded-2xl p-6 transition ${
                  vehicle.isActive
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'border-emerald-900/30 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Car className="text-emerald-400" size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        {vehicle.isActive && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                            <Check size={14} />
                            Активный
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar size={16} />
                        <span>{vehicle.year} год</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/vehicles/edit/${vehicle.id}`}
                      className="w-10 h-10 bg-[#0a1f1a] hover:bg-emerald-500/20 border border-emerald-900/30 hover:border-emerald-500/50 rounded-lg flex items-center justify-center transition"
                    >
                      <Edit2 size={18} className="text-emerald-400" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ show: true, vehicle })}
                      className="w-10 h-10 bg-[#0a1f1a] hover:bg-red-500/20 border border-red-900/30 hover:border-red-500/50 rounded-lg flex items-center justify-center transition"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-[#0a1f1a] rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Коннектор</div>
                    <div className="text-white font-medium">{getConnectorLabel(vehicle.connectorType)}</div>
                  </div>
                  <div className="bg-[#0a1f1a] rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                      <Zap size={12} />
                      Мощность
                    </div>
                    <div className="text-white font-medium">{vehicle.maxPowerKw} кВт</div>
                  </div>
                  <div className="bg-[#0a1f1a] rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                      <Battery size={12} />
                      Батарея
                    </div>
                    <div className="text-white font-medium">{vehicle.batteryCapacityKwh} кВт·ч</div>
                  </div>
                  <div className="bg-[#0a1f1a] rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Заряд</div>
                    <div className="text-emerald-400 font-medium">{vehicle.currentChargeLevel}%</div>
                  </div>
                </div>

                {/* Set Active Button */}
                {!vehicle.isActive && (
                  <button
                    onClick={() => handleSetActive(vehicle.id)}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 py-3 rounded-lg font-medium transition"
                  >
                    Сделать активным
                  </button>
                )}
                
                {/* Deactivate Button */}
                {vehicle.isActive && (
                  <button
                    onClick={() => handleDeactivate(vehicle.id)}
                    className="w-full bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/30 hover:border-gray-500/50 text-gray-400 py-3 rounded-lg font-medium transition"
                  >
                    Снять активность
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Car className="text-emerald-400" size={18} />
            </div>
            Об активном автомобиле
          </h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <Check className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
              <span>Активный автомобиль используется для подбора подходящих зарядных станций</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
              <span>Вы можете переключаться между автомобилями в любое время</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
              <span>Активный автомобиль опционален - можете не выбирать, если не нужно</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.vehicle && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f2d26] border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="text-red-400" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-red-400">Удалить автомобиль?</h2>
              </div>
              <button
                onClick={() => setDeleteModal({ show: false, vehicle: null })}
                className="text-gray-400 hover:text-white transition"
                disabled={deleting}
              >
                <X size={24} />
              </button>
            </div>

            {/* Vehicle Info */}
            <div className="bg-[#0a1f1a] rounded-lg p-4 mb-4 border border-red-900/30">
              <div className="flex items-center gap-3 mb-3">
                <Car className="text-red-400" size={20} />
                <div>
                  <div className="text-white font-bold">Марка: {deleteModal.vehicle.brand}</div>
                  <div className="text-white font-bold">Модель: {deleteModal.vehicle.model}</div>
                  <div className="text-gray-400 text-sm">Год: {deleteModal.vehicle.year}</div>
                </div>
              </div>
            </div>

            {/* Confirmation Text */}
            <p className="text-gray-300 text-center mb-6">
              Вы уверены?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, vehicle: null })}
                disabled={deleting}
                className="flex-1 bg-[#0a1f1a] hover:bg-[#0a1f1a]/80 text-gray-300 py-3 rounded-lg font-medium transition disabled:opacity-50"
              >
                Нет
              </button>
              <button
                onClick={() => handleDelete(deleteModal.vehicle!.id, `${deleteModal.vehicle!.brand} ${deleteModal.vehicle!.model}`)}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
              >
                {deleting ? 'Удаление...' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {toast.vehicle && (
              <div className="bg-[#0a1f1a] rounded-lg p-4 border border-emerald-900/30">
                <div className="flex items-center gap-3 mb-3">
                  <Car className="text-emerald-400" size={20} />
                  <span className="text-white font-medium">
                    {toast.vehicle.brand} {toast.vehicle.model}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Коннектор</div>
                    <div className="text-emerald-400 font-medium">
                      {getConnectorLabel(toast.vehicle.connectorType)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Мощность</div>
                    <div className="text-emerald-400 font-medium">{toast.vehicle.maxPowerKw} кВт</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Батарея</div>
                    <div className="text-white font-medium">{toast.vehicle.batteryCapacityKwh} кВт·ч</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Заряд</div>
                    <div className="text-white font-medium">{toast.vehicle.currentChargeLevel}%</div>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setToast({ show: false, message: '', details: '' })}
              className="w-full mt-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2 rounded-lg font-medium transition text-sm"
            >
              OK
            </button>
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
