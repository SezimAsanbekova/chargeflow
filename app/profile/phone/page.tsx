'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';

export default function PhonePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setPhone(data.phone || '');
        }
      } catch (error) {
        console.error('Error fetching phone:', error);
      }
    };

    if (session) {
      fetchPhone();
    }
  }, [session]);

  const formatPhone = (value: string) => {
    // Удаляем все нецифровые символы
    const numbers = value.replace(/\D/g, '');
    
    // Форматируем как +996 XXX XXX XXX
    if (numbers.startsWith('996')) {
      const formatted = numbers.slice(3);
      if (formatted.length <= 3) {
        return `+996 ${formatted}`;
      } else if (formatted.length <= 6) {
        return `+996 ${formatted.slice(0, 3)} ${formatted.slice(3)}`;
      } else {
        return `+996 ${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6, 9)}`;
      }
    }
    
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Валидация
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length !== 12 || !numbers.startsWith('996')) {
      setError('Введите корректный номер телефона');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при сохранении');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err) {
      setError('Не удалось сохранить номер телефона');
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

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/profile"
            className="w-10 h-10 bg-[#0f2d26] border border-emerald-900/30 rounded-full flex items-center justify-center hover:border-emerald-500/50 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Номер телефона</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Phone className="text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-white font-medium">Телефон</p>
                <p className="text-gray-400 text-sm">Для связи и уведомлений</p>
              </div>
            </div>

            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+996 ___ ___ ___"
              className="w-full bg-[#0a1f1a] border border-emerald-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />

            {error && (
              <p className="mt-3 text-red-400 text-sm">{error}</p>
            )}

            {success && (
              <p className="mt-3 text-emerald-400 text-sm">✓ Номер телефона сохранен</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-full font-medium transition"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-4">
          <p className="text-gray-400 text-sm">
            💡 Номер телефона используется для:
          </p>
          <ul className="mt-2 space-y-1 text-gray-400 text-sm">
            <li>• Уведомлений о зарядке</li>
            <li>• Связи с поддержкой</li>
            <li>• Подтверждения бронирований</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
