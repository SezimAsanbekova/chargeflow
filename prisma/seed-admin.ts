import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdminSettings() {
  console.log('🌱 Seeding admin settings...');

  // Создаем настройки для админа
  const settings = [
    {
      key: 'ADMIN_TELEGRAM_BOT_TOKEN',
      value: 'YOUR_TELEGRAM_BOT_TOKEN_HERE',
    },
    {
      key: 'ADMIN_TELEGRAM_USER_ID',
      value: 'YOUR_TELEGRAM_USER_ID_HERE',
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
    console.log(`✅ Created/Updated setting: ${setting.key}`);
  }

  console.log('✅ Admin settings seeded successfully!');
}

seedAdminSettings()
  .catch((e) => {
    console.error('❌ Error seeding admin settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
