import { config } from 'dotenv';
config();

import { prisma } from '../lib/prisma';

async function checkAdminStats() {
  try {
    console.log('🔍 Проверка данных для админ-панели...\n');

    // Проверяем пользователей
    const totalUsers = await prisma.user.count({
      where: { role: 'user' },
    });
    console.log(`👥 Пользователей: ${totalUsers}`);

    // Проверяем станции
    const totalStations = await prisma.station.count();
    console.log(`🔌 Станций: ${totalStations}`);

    // Проверяем коннекторы
    const totalConnectors = await prisma.connector.count();
    const availableConnectors = await prisma.connector.count({
      where: { status: 'available' },
    });
    console.log(`🔌 Всего коннекторов: ${totalConnectors}`);
    console.log(`🟢 Свободных коннекторов: ${availableConnectors}`);

    // Проверяем активные сессии
    const activeSessions = await prisma.chargingSession.count({
      where: { status: 'active' },
    });
    console.log(`⚡ Активных сессий: ${activeSessions}`);

    // Проверяем зарядки за месяц
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthSessions = await prisma.chargingSession.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });
    console.log(`📊 Зарядок за месяц: ${monthSessions}`);

    // Проверяем последнюю активность
    const recentSessions = await prisma.chargingSession.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        connector: {
          include: {
            station: { select: { name: true } },
          },
        },
      },
    });

    console.log('\n📋 Последние зарядки:');
    recentSessions.forEach((session, i) => {
      console.log(
        `${i + 1}. ${session.user.name || 'Без имени'} - ${session.connector.station.name} (${session.status})`
      );
    });

    // Если нет станций, показываем подсказку
    if (totalStations === 0) {
      console.log('\n⚠️  У вас нет станций в БД!');
      console.log('Добавьте станции через админ-панель: http://localhost:3001/admin/stations');
    }

    // Если нет коннекторов
    if (totalConnectors === 0 && totalStations > 0) {
      console.log('\n⚠️  У станций нет коннекторов!');
      console.log('Добавьте коннекторы к станциям через админ-панель.');
    }

    console.log('\n✅ Проверка завершена!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminStats();
