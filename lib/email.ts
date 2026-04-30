// Утилита для отправки email уведомлений через Nodemailer
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Создаем транспорт для отправки email
const createTransporter = () => {
  // Проверяем наличие настроек email
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email настройки не найдены. Письма будут логироваться в консоль.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true для 465, false для других портов
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const transporter = createTransporter();

  // Если транспорт не настроен, логируем в консоль
  if (!transporter) {
    console.log('📧 Email (не отправлен, только лог):');
    console.log('To:', to);
    console.log('Subject:', subject);
    return { success: true, mode: 'console' };
  }

  try {
    // Отправляем реальное письмо
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"ChargeFlow" <noreply@chargeflow.kg>',
      to,
      subject,
      html,
    });

    console.log('✅ Email успешно отправлен:', info.messageId);
    console.log('To:', to);
    console.log('Subject:', subject);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    return { success: false, error };
  }
}

export function getLoginNotificationEmail(name: string, email: string) {
  const date = new Date().toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const logoUrl = `${process.env.NEXTAUTH_URL}/logo12.png`;

  return {
    subject: 'Вход в аккаунт ChargeFlow',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #10b981;
              display: inline-flex;
              align-items: center;
              gap: 10px;
            }
            .logo img {
              width: 40px;
              height: 40px;
              vertical-align: middle;
            }
            .content {
              margin-bottom: 30px;
            }
            .info-box {
              background: #f3f4f6;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="${logoUrl}" alt="ChargeFlow">
                ChargeFlow
              </div>
            </div>
            
            <div class="content">
              <h2>Здравствуйте, ${name || 'Пользователь'}!</h2>
              
              <p>Мы заметили вход в ваш аккаунт ChargeFlow.</p>
              
              <div class="info-box">
                <strong>Детали входа:</strong><br>
                📧 Email: ${email}<br>
                🕐 Время: ${date}<br>
                🌐 Сервис: ChargeFlow
              </div>
              
              <p>Если это были вы, можете проигнорировать это письмо.</p>
              
              <p>Если это были не вы, немедленно:</p>
              <ul>
                <li>Смените пароль</li>
                <li>Свяжитесь с нашей службой поддержки</li>
              </ul>
              
              <a href="${process.env.NEXTAUTH_URL}/profile" class="button">
                Перейти в профиль
              </a>
            </div>
            
            <div class="footer">
              <p>Это автоматическое уведомление от ChargeFlow</p>
              <p>Если у вас есть вопросы, свяжитесь с нами: support@chargeflow.kg</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getRegistrationEmail(name: string, email: string) {
  const logoUrl = `${process.env.NEXTAUTH_URL}/logo12.png`;

  return {
    subject: 'Добро пожаловать в ChargeFlow!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #10b981;
              display: inline-flex;
              align-items: center;
              gap: 10px;
            }
            .logo img {
              width: 40px;
              height: 40px;
              vertical-align: middle;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .features {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="${logoUrl}" alt="ChargeFlow">
                ChargeFlow
              </div>
            </div>
            
            <div class="content">
              <h2>Добро пожаловать, ${name || 'Пользователь'}!</h2>
              
              <p>Спасибо за регистрацию в ChargeFlow - вашем надежном помощнике для зарядки электромобилей.</p>
              
              <div class="features">
                <strong>Что вы можете делать:</strong>
                <ul>
                  <li>🗺️ Находить ближайшие зарядные станции</li>
                  <li>📅 Бронировать станции заранее</li>
                  <li>⚡ Отслеживать процесс зарядки</li>
                  <li>💳 Удобная оплата</li>
                  <li>📊 История всех зарядок</li>
                </ul>
              </div>
              
              <p>Начните с добавления вашего электромобиля в профиле!</p>
              
              <a href="${process.env.NEXTAUTH_URL}/profile" class="button">
                Перейти в профиль
              </a>
            </div>
            
            <div class="footer">
              <p>С уважением, команда ChargeFlow</p>
              <p>Если у вас есть вопросы: support@chargeflow.kg</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
