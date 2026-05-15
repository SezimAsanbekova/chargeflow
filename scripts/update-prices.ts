import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function updatePrices() {
  try {
    console.log('🔍 Проверяем текущие цены коннекторов...\n');

    // Получаем все коннекторы
    const connectors = await prisma.connector.findMany({
      include: {
        station: true
      }
    });

    console.log(`Найдено коннекторов: ${connectors.length}\n`);

    for (const connector of connectors) {
      console.log(`Коннектор ID: ${connector.id}`);
      console.log(`  Станция: ${connector.station.name}`);
      console.log(`  Тип: ${connector.type}`);
      console.log(`  Мощность: ${connector.powerKw} кВт`);
      console.log(`  Цена за кВт⋅ч: ${connector.pricePerKwh} сом`);
      console.log(`  Цена за минуту (текущая): ${connector.pricePerMinute} сом`);

      // Если pricePerMinute = 0, устанавливаем разумную цену
      if (Number(connector.pricePerMinute) === 0) {
        // Рассчитываем цену за минуту на основе мощности
        // Например: 50 кВт станция = 5 сом/мин, 150 кВт = 10 сом/мин
        const powerKw = Number(connector.powerKw);
        let pricePerMinute = 0;

        if (powerKw < 50) {
          pricePerMinute = 3; // Медленная зарядка
        } else if (powerKw < 100) {
          pricePerMinute = 5; // Быстрая зарядка
        } else if (powerKw < 150) {
          pricePerMinute = 8; // Очень быстрая зарядка
        } else {
          pricePerMinute = 10; // Ультра-быстрая зарядка
        }

        console.log(`  ✅ Обновляем цену за минуту на: ${pricePerMinute} сом`);

        await prisma.connector.update({
          where: { id: connector.id },
          data: { pricePerMinute }
        });
      } else {
        console.log(`  ℹ️  Цена уже установлена, пропускаем`);
      }
      console.log('');
    }

    console.log('✅ Обновление завершено!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePrices();
