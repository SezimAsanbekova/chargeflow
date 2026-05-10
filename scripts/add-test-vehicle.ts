import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestVehicle() {
  console.log('🚗 Добавление тестового автомобиля...\n');

  // Находим первого пользователя
  const user = await prisma.user.findFirst({
    where: {
      role: 'user'
    }
  });

  if (!user) {
    console.error('❌ Пользователь не найден!');
    await prisma.$disconnect();
    return;
  }

  console.log(`👤 Пользователь: ${user.email}`);

  // Проверяем, есть ли уже автомобиль
  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      userId: user.id
    }
  });

  if (existingVehicle) {
    console.log(`✅ У пользователя уже есть автомобиль: ${existingVehicle.brand} ${existingVehicle.model}`);
    await prisma.$disconnect();
    return;
  }

  // Создаем тестовый автомобиль
  const vehicle = await prisma.vehicle.create({
    data: {
      userId: user.id,
      brand: 'Tesla',
      model: 'Model 3',
      year: 2023,
      batteryCapacityKwh: 75,
      connectorType: 'CCS2',
      maxPowerKw: 250,
      currentChargeLevel: 80
    }
  });

  console.log(`✅ Автомобиль создан: ${vehicle.brand} ${vehicle.model}`);

  await prisma.$disconnect();
}

addTestVehicle().catch(console.error);
