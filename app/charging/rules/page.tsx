'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';

export default function ChargingRulesPage() {
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
          <h1 className="text-2xl font-bold">Правила зарядок</h1>
        </div>

        {/* Rules */}
        <div className="space-y-4">
          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">1. Бронирование</h3>
                <p className="text-gray-400 text-sm">
                  Забронируйте станцию заранее, чтобы гарантировать доступность. Бронирование действует 15 минут после указанного времени.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">2. Депозит</h3>
                <p className="text-gray-400 text-sm">
                  При бронировании удерживается депозит 100 сом. Он возвращается после завершения зарядки или отмены бронирования за 1 час до начала.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">3. Начало зарядки</h3>
                <p className="text-gray-400 text-sm">
                  Отсканируйте QR-код на станции или запустите зарядку через приложение. Убедитесь, что кабель надежно подключен.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">4. Оплата</h3>
                <p className="text-gray-400 text-sm">
                  Оплата производится по факту потребленной энергии. Тарифы зависят от типа разъема и мощности станции.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">5. Завершение</h3>
                <p className="text-gray-400 text-sm">
                  После завершения зарядки отключите кабель и освободите место для других пользователей. Штраф за превышение времени - 50 сом/час.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">6. Безопасность</h3>
                <p className="text-gray-400 text-sm">
                  Не оставляйте автомобиль без присмотра на длительное время. Сообщайте о неисправностях станций через приложение.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <FileText className="text-emerald-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-white font-bold mb-2">Нужна помощь?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Если у вас возникли вопросы или проблемы, свяжитесь с нашей службой поддержки.
              </p>
              <Link
                href="/support"
                className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-medium transition"
              >
                Связаться с поддержкой
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
