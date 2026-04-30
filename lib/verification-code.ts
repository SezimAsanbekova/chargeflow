// Утилита для работы с кодами верификации email

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

/**
 * Генерирует случайный 6-значный код
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Создает и отправляет код верификации на email
 */
export async function sendVerificationCode(
  email: string,
  type: 'login' | 'registration' | 'reset_password' = 'login'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Генерируем код
    const code = generateVerificationCode();

    // Срок действия: 10 минут
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Удаляем старые неиспользованные коды для этого email
    await prisma.emailVerificationCode.deleteMany({
      where: {
        email,
        type,
        isUsed: false,
      },
    });

    // Создаем новый код
    await prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        type,
        expiresAt,
        isUsed: false,
      },
    });

    // Отправляем email с кодом
    const subject = type === 'registration' 
      ? 'Код подтверждения регистрации ChargeFlow'
      : type === 'reset_password'
      ? 'Код для сброса пароля ChargeFlow'
      : 'Код подтверждения входа ChargeFlow';

    const logoUrl = `${process.env.NEXTAUTH_URL}/logo12.png`;

    const html = `
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
            .code-box {
              background: #f3f4f6;
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #10b981;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
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
              <h2>Код подтверждения</h2>
              
              <p>Ваш код для ${
                type === 'registration' 
                  ? 'завершения регистрации' 
                  : type === 'reset_password'
                  ? 'сброса пароля'
                  : 'входа в систему'
              }:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p style="text-align: center; color: #6b7280;">
                Код действителен в течение <strong>10 минут</strong>
              </p>
              
              <div class="warning">
                <strong>⚠️ Важно:</strong><br>
                Никогда не сообщайте этот код никому. Сотрудники ChargeFlow никогда не попросят вас предоставить этот код.
              </div>
              
              <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
            </div>
            
            <div class="footer">
              <p>Это автоматическое сообщение от ChargeFlow</p>
              <p>Если у вас есть вопросы: support@chargeflow.kg</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { 
      success: false, 
      error: 'Не удалось отправить код верификации' 
    };
  }
}

/**
 * Проверяет код верификации
 */
export async function verifyCode(
  email: string,
  code: string,
  type: 'login' | 'registration' | 'reset_password' = 'login',
  skipMarkAsUsed: boolean = false
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Ищем код
    const verificationCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email,
        code,
        type,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode) {
      return { valid: false, error: 'Неверный код' };
    }

    // Проверяем срок действия
    if (new Date() > verificationCode.expiresAt) {
      return { valid: false, error: 'Код истек. Запросите новый код' };
    }

    // Помечаем код как использованный только если не skipMarkAsUsed
    if (!skipMarkAsUsed) {
      await prisma.emailVerificationCode.update({
        where: { id: verificationCode.id },
        data: { isUsed: true },
      });
    }

    return { valid: true };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { 
      valid: false, 
      error: 'Ошибка проверки кода' 
    };
  }
}

/**
 * Удаляет все истекшие коды (для очистки БД)
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const result = await prisma.emailVerificationCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  
  return result.count;
}
