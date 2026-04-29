import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // Создаем тестового пользователя
  const user = await prisma.user.upsert({
    where: { phone: '+79991234567' },
    update: {},
    create: {
      phone: '+79991234567',
      passwordHash: '$2a$10$example_hash', // В реальности используйте bcrypt
      role: 'user',
      status: 'active',
      isPhoneVerified: true,
    },
  })
  console.log('✅ Создан пользователь:', user.phone)

  // Создаем баланс пользователя
  const balance = await prisma.userBalance.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      balance: 1000.00,
    },
  })
  console.log('✅ Создан баланс:', balance.balance)

  // Создаем транспорт
  const vehicle = await prisma.vehicle.create({
    data: {
      userId: user.id,
      brand: 'Tesla',
      model: 'Model 3',
      year: 2023,
      connectorType: 'CCS2',
      maxPowerKw: 250,
      batteryCapacityKwh: 75,
      currentChargeLevel: 45.5,
      isActive: true,
    },
  })
  console.log('✅ Создан автомобиль:', vehicle.brand, vehicle.model)

  // Создаем станцию
  const station = await prisma.station.create({
    data: {
      name: 'Зарядная станция "Центральная"',
      address: 'г. Москва, ул. Тверская, д. 1',
      latitude: 55.755826,
      longitude: 37.617300,
      status: 'active',
      workingHours: {
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' },
      },
    },
  })
  console.log('✅ Создана станция:', station.name)

  // Создаем коннекторы
  const connector1 = await prisma.connector.create({
    data: {
      stationId: station.id,
      type: 'CCS2',
      powerKw: 150,
      pricePerKwh: 15.50,
      status: 'available',
    },
  })

  const connector2 = await prisma.connector.create({
    data: {
      stationId: station.id,
      type: 'Type2',
      powerKw: 22,
      pricePerKwh: 12.00,
      status: 'available',
    },
  })
  console.log('✅ Создано коннекторов:', 2)

  // Создаем фото станции
  await prisma.stationPhoto.create({
    data: {
      stationId: station.id,
      imageUrl: 'https://example.com/station1.jpg',
    },
  })
  console.log('✅ Добавлено фото станции')

  // Создаем настройки
  await prisma.setting.createMany({
    data: [
      { key: 'booking_deposit_amount', value: '500' },
      { key: 'booking_cancel_minutes', value: '15' },
      { key: 'max_booking_duration_hours', value: '2' },
      { key: 'min_balance_for_charging', value: '100' },
    ],
  })
  console.log('✅ Созданы настройки системы')

  // Создаем вторую станцию
  const station2 = await prisma.station.create({
    data: {
      name: 'Зарядная станция "Парковая"',
      address: 'г. Москва, Парковая ул., д. 15',
      latitude: 55.751244,
      longitude: 37.618423,
      status: 'active',
      workingHours: {
        monday: { open: '06:00', close: '22:00' },
        tuesday: { open: '06:00', close: '22:00' },
        wednesday: { open: '06:00', close: '22:00' },
        thursday: { open: '06:00', close: '22:00' },
        friday: { open: '06:00', close: '22:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '08:00', close: '20:00' },
      },
    },
  })

  await prisma.connector.createMany({
    data: [
      {
        stationId: station2.id,
        type: 'CHAdeMO',
        powerKw: 50,
        pricePerKwh: 13.00,
        status: 'available',
      },
      {
        stationId: station2.id,
        type: 'GB_T',
        powerKw: 60,
        pricePerKwh: 14.00,
        status: 'available',
      },
    ],
  })
  console.log('✅ Создана вторая станция с коннекторами')

  console.log('🎉 Заполнение базы данных завершено!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
