import { prisma } from './prisma';

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

/**
 * Отправка сообщения через Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    console.log('📱 Sending Telegram message to chat:', chatId);

    // Получаем токен бота из настроек
    const botTokenSetting = await prisma.setting.findUnique({
      where: { key: 'ADMIN_TELEGRAM_BOT_TOKEN' },
    });

    if (!botTokenSetting?.value) {
      console.error('❌ Telegram bot token not found in settings');
      console.error('💡 Hint: Check if key "ADMIN_TELEGRAM_BOT_TOKEN" exists in settings table');
      return false;
    }

    const botToken = botTokenSetting.value.trim(); // Убираем пробелы
    console.log('✅ Bot token found');

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const payload: TelegramMessage = {
      chat_id: chatId.trim(), // Убираем пробелы
      text: message,
      parse_mode: 'HTML',
    };

    console.log('📤 Calling Telegram API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Telegram API error:', error);
      return false;
    }

    const result = await response.json();
    console.log('✅ Telegram API response:', result);

    return true;
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error);
    return false;
  }
}

/**
 * Генерация 6-значного кода
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Отправка кода верификации администратору
 */
export async function sendAdminVerificationCode(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📱 Sending admin verification code for:', email);

    // Получаем Telegram ID администратора из настроек
    const telegramIdSetting = await prisma.setting.findUnique({
      where: { key: 'ADMIN_TELEGRAM_USER_ID' },
    });

    if (!telegramIdSetting?.value) {
      console.error('❌ Admin Telegram ID not found in settings');
      return { success: false, error: 'Admin Telegram ID not configured in settings. Please add ADMIN_TELEGRAM_USER_ID to settings table.' };
    }

    const telegramId = telegramIdSetting.value.trim(); // Убираем пробелы
    console.log('✅ Telegram ID found:', telegramId);

    // Генерируем код
    const code = generateVerificationCode();
    console.log('✅ Verification code generated:', code);

    // Сохраняем код в базу данных
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Код действителен 10 минут

    await prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        expiresAt,
        type: 'login',
        isUsed: false,
      },
    });

    console.log('✅ Code saved to database');

    // Отправляем код в Telegram
    const message = `
🔐 <b>Код входа в админ-панель</b>

Ваш код: <code>${code}</code>

Код действителен 10 минут.

Если это были не вы, проигнорируйте это сообщение.
    `.trim();

    console.log('📤 Sending message to Telegram...');
    const sent = await sendTelegramMessage(telegramId, message);

    if (!sent) {
      console.error('❌ Failed to send Telegram message');
      return { success: false, error: 'Failed to send Telegram message. Check bot token and chat ID.' };
    }

    console.log('✅ Message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending admin verification code:', error);
    return { success: false, error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Проверка кода верификации
 */
export async function verifyAdminCode(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Находим код в базе данных
    const verificationCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email,
        code,
        type: 'login',
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode) {
      return { success: false, error: 'Invalid or expired code' };
    }

    // Помечаем код как использованный
    await prisma.emailVerificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Error verifying admin code:', error);
    return { success: false, error: 'Server error' };
  }
}
