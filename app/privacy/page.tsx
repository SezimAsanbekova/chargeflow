'use client';

import { Shield, Eye, Lock, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a1f1a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Политика конфиденциальности</h1>
          <p className="text-white/60">Последнее обновление: 3 июня 2026 г.</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Введение</h2>
                <p className="text-white/70 leading-relaxed">
                  ChargeFlow (&quot;мы&quot;, &quot;наш&quot; или &quot;Компания&quot;) уважает вашу конфиденциальность 
                  и обязуется защищать персональные данные, которые вы предоставляете нам. 
                  Эта политика конфиденциальности объясняет, как мы собираем, используем и защищаем 
                  вашу информацию при использовании нашего приложения для поиска и бронирования 
                  зарядных станций для электромобилей.
                </p>
              </div>
            </div>
          </section>

          {/* Data Collection */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Какие данные мы собираем</h2>
                <div className="space-y-3 text-white/70">
                  <p><strong className="text-white">Персональная информация:</strong> имя, email, номер телефона, адрес</p>
                  <p><strong className="text-white">Данные аккаунта:</strong> логин, пароль (в зашифрованном виде), история входов</p>
                  <p><strong className="text-white">Информация об автомобиле:</strong> марка, модель, год выпуска, тип разъема</p>
                  <p><strong className="text-white">Данные о зарядках:</strong> история зарядок, местоположение, время, стоимость</p>
                  <p><strong className="text-white">Платежная информация:</strong> данные для пополнения баланса (обрабатываются безопасно)</p>
                  <p><strong className="text-white">Технические данные:</strong> IP-адрес, тип устройства, версия приложения</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Как мы используем ваши данные</h2>
                <ul className="space-y-2 text-white/70 list-disc list-inside">
                  <li>Предоставление доступа к функциям приложения</li>
                  <li>Бронирование зарядных станций</li>
                  <li>Обработка платежей и управление балансом</li>
                  <li>Отправка уведомлений о статусе зарядки</li>
                  <li>Улучшение качества сервиса и пользовательского опыта</li>
                  <li>Техническая поддержка и решение проблем</li>
                  <li>Анализ использования приложения для развития сервиса</li>
                  <li>Соблюдение законодательных требований</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Защита данных</h2>
                <p className="text-white/70 leading-relaxed mb-3">
                  Мы принимаем следующие меры для защиты вашей информации:
                </p>
                <ul className="space-y-2 text-white/70 list-disc list-inside">
                  <li>Шифрование данных при передаче (SSL/TLS)</li>
                  <li>Шифрование паролей с использованием bcrypt</li>
                  <li>Ограниченный доступ к данным сотрудников</li>
                  <li>Регулярное обновление систем безопасности</li>
                  <li>Мониторинг и обнаружение угроз</li>
                  <li>Резервное копирование данных</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Trash2 className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Хранение и удаление данных</h2>
                <p className="text-white/70 leading-relaxed mb-3">
                  Мы храним ваши данные только столько, сколько необходимо для предоставления услуг 
                  и соблюдения законодательства. Вы можете запросить удаление своих данных в любой момент 
                  через настройки профиля или обратившись в службу поддержки.
                </p>
                <p className="text-white/70 leading-relaxed">
                  После удаления аккаунта ваши персональные данные будут anonymized или удалены 
                  в течение 30 дней, за исключением данных, которые мы обязаны хранить по закону.
                </p>
              </div>
            </div>
          </section>

          {/* Third Parties */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Передача данных третьим лицам</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              Мы не продаем ваши данные третьим лицам. Мы можем передавать данные только в следующих случаях:
            </p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>Платежным системам для обработки транзакций</li>
              <li>Операторам зарядных станций для бронирования</li>
              <li>По требованию закона или судебным решением</li>
              <li>При передаче бизнеса (с согласия регулирующих органов)</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Ваши права</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              Вы имеете право на:
            </p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>Доступ к вашим персональным данным</li>
              <li>Исправление неточных данных</li>
              <li>Удаление ваших данных (право на забвение)</li>
              <li>Ограничение обработки данных</li>
              <li>Возражение против обработки данных</li>
              <li>Переносимость данных</li>
              <li>Отзыв согласия на обработку</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Контакты</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              Если у вас есть вопросы по этой политике или обработке ваших данных, свяжитесь с нами:
            </p>
            <div className="space-y-2 text-white/70">
              <p><strong className="text-white">Email:</strong> support@chargeflow.kg</p>
              <p><strong className="text-white">Телефон:</strong> +996 555 123 456</p>
              <p><strong className="text-white">Адрес:</strong> Кыргызстан, г. Бишкек</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
