#!/usr/bin/env node

/**
 * Скрипт для генерации bcrypt хеша пароля
 * Использование: node scripts/generate-password-hash.js "ваш_пароль"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Ошибка: Пароль не указан');
  console.log('\nИспользование:');
  console.log('  node scripts/generate-password-hash.js "ваш_пароль"');
  console.log('\nПример:');
  console.log('  node scripts/generate-password-hash.js "MySecurePassword123!"');
  process.exit(1);
}

console.log('🔐 Генерация хеша пароля...\n');

const hash = bcrypt.hashSync(password, 10);

console.log('✅ Хеш сгенерирован:\n');
console.log(hash);
console.log('\n📋 SQL для обновления пароля:\n');
console.log(`UPDATE users`);
console.log(`SET password_hash = '${hash}'`);
console.log(`WHERE email = 'admin@example.com' AND role = 'admin';`);
console.log('\n✅ Готово!');
