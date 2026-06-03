'use client';

import { FileText, CheckCircle, AlertTriangle, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold mb-2">Условия использования</h1>
          <p className="text-white/60">Последнее обновление: 3 июня 2026 г.</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Введение</h2>
                <p className="text-white/70 leading-relaxed">
                  Добро пожаловать в ChargeFlow — приложение для поиска и бронирования зарядных 
                  станций для электромобилей. Используя наше приложение, вы соглашаетесь соблюдать 
                  эти условия использования. Пожалуйста, внимательно прочитайте их перед использованием сервиса.
                </p>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Принятие условий</h2>
                <p className="text-white/70 leading-relaxed">
                  Регистрация в приложении или его использование означает, что вы прочитали, поняли 
                  и согласились с этими условиями. Если вы не согласны с какими-либо положениями, 
                  пожалуйста, не используйте приложение.
                </p>
              </div>
            </div>
          </section>

          {/* Service Description */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Описание сервиса</h2>
                <p className="text-white/70 leading-relaxed mb-3">
                  ChargeFlow предоставляет следующие услуги:
                </p>
                <ul className="space-y-2 text-white/70 list-disc list-inside">
                  <li>Поиск зарядных станций на карте</li>
                  <li>Просмотр информации о станциях (тип разъема, мощность, стоимость)</li>
                  <li>Бронирование зарядных станций</li>
                  <li>Управление балансом и пополнение счета</li>
                  <li>Просмотр истории зарядок</li>
                  <li>Управление профилем и автомобилем</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Обязанности пользователя</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              Используя ChargeFlow, вы обязуетесь:
            </p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>Предоставлять достоверную и актуальную информацию при регистрации</li>
              <li>Обеспечивать конфиденциальность своего аккаунта и пароля</li>
              <li>Не передавать свой аккаунт третьим лицам</li>
              <li>Использовать сервис только в законных целях</li>
              <li>Соблюдать правила использования зарядных станций</li>
              <li>Оплачивать услуги в соответствии с тарифами</li>
              <li>Своевременно освобождать зарядное место после завершения зарядки</li>
              <li>Сообщать о любых проблемах или ошибках в приложении</li>
            </ul>
          </section>

          {/* Prohibited Actions */}
          <section className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Запрещенные действия</h2>
                <p className="text-white/70 leading-relaxed mb-3">
                  Вам запрещено:
                </p>
                <ul className="space-y-2 text-white/70 list-disc list-inside">
                  <li>Использовать приложение для мошенничества или незаконных действий</li>
                  <li>Пытаться взломать или нарушить работу приложения</li>
                  <li>Создавать фейковые аккаунты или бронирования</li>
                  <li>Бронировать станции без намерения использовать их</li>
                  <li>Копировать или модифицировать приложение</li>
                  <li>Использовать автоматизированные скрипты для злоупотребления сервисом</li>
                  <li>Распространять вредоносный код через приложение</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Payments */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Оплата и тарифы</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              Условия оплаты:
            </p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>Стоимость зарядки зависит от тарифа конкретной станции</li>
              <li>Цена указывается в сомах за кВт⋅ч</li>
              <li>Пополнение баланса происходит через безопасные платежные системы</li>
              <li>Средства списываются только после фактической зарядки</li>
              <li>Возврат средств возможен в случае технической ошибки</li>
              <li>Мы оставляем за собой право изменять тарифы с предварительным уведомлением</li>
            </ul>
          </section>

          {/* Cancellation */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Отмена бронирования</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              Правила отмены:
            </p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>Вы можете отменить бронирование бесплатно за 15 минут до начала</li>
              <li>При отмене менее чем за 15 минут может взиматься штраф</li>
              <li>Неявка на бронирование без отмены может привести к ограничению доступа</li>
              <li>Повторные неявки могут привести к блокировке аккаунта</li>
            </ul>
          </section>

          {/* Liability */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Ответственность</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              ChargeFlow не несет ответственности за:
            </p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>Технические проблемы на зарядных станциях</li>
              <li>Несоответствие фактической мощности заявленной</li>
              <li>Потерю или повреждение вашего автомобиля на парковке</li>
              <li>Прямые или косвенные убытки от использования приложения</li>
              <li>Действия третьих лиц (операторов станций)</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-3">
              Мы стремимся обеспечить качество сервиса, но не можем гарантировать бесперебойную работу 
              всех зарядных станций.
            </p>
          </section>

          {/* Account Termination */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Прекращение использования</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              Мы оставляем за собой право:
            </p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>Приостановить или заблокировать аккаунт при нарушении условий</li>
              <li>Прекратить предоставление услуг с предварительным уведомлением</li>
              <li>Изменять условия использования с уведомлением пользователей</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-3">
              Вы можете удалить свой аккаунт в любой момент через настройки профиля.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Интеллектуальная собственность</h2>
            <p className="text-white/70 leading-relaxed">
              Все права на приложение ChargeFlow, его дизайн, код, контент и торговую марку 
              принадлежат Компании. Вы не имеете права использовать, копировать или распространять 
              материалы приложения без письменного разрешения.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Изменения условий</h2>
            <p className="text-white/70 leading-relaxed">
              Мы можем обновлять эти условия использования. Об изменениях будет уведомлено через 
              приложение или email. Продолжение использования после изменений означает согласие 
              с новыми условиями.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Применимое право</h2>
            <p className="text-white/70 leading-relaxed">
              Эти условия регулируются законодательством Кыргызской Республики. Любые споры 
              решаются в соответствии с законодательством КР.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Контакты</h2>
            <p className="text-white/70 leading-relaxed mb-3">
              Если у вас есть вопросы по этим условиям, свяжитесь с нами:
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
