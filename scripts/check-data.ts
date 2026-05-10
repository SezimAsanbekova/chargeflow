import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Проверка данных в базе...\n');

  // Проверяем пользователей
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      email: true,
      name: true,
    }
  });
  console.log(`👥 Пользователей: ${users.length}`);
  users.forEach(u => console.log(`  - ${u.email} (${u.name || 'без имени'})`));

  // Проверяем станции
  const stations = await prisma.station.findMany({
    take: 5,
    include: {
      connectors: true
    }
  });
  console.log(`\n⚡ Станций: ${stations.length}`);
  stations.forEach(s => {
    console.log(`  - ${s.name} (коннекторов: ${s.connectors.length})`);
    s.connectors.forEach(c => {
      console.log(`    • ${c.type}: ${c.powerKw} кВт, ${c.pricePerKwh} сом/кВт⋅ч, статус: ${c.status}`);
    });
  });

  // Проверяем автомобили
  const vehicles = await prisma.vehicle.findMany({
    take: 10,
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  });
  console.log(`\n🚗 Автомобилей: ${vehicles.length}`);
  vehicles.forEach(v => {
    console.log(`  - ${v.brand} ${v.model} (${v.year}) - ${v.user.email}`);
  });

  // Проверяем балансы
  const balances = await prisma.userBalance.findMany({
    take: 5,
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  });
  console.log(`\n💰 Балансов: ${balances.length}`);
  balances.forEach(b => {
    console.log(`  - ${b.user.email}: ${Number(b.balance)} сом`);
  });

  await prisma.$disconnect();
}

checkData().catch(console.error);
