# Используем официальный Node.js образ версии 22
FROM node:22-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# ===== DEPENDENCIES STAGE =====
FROM base AS deps
# Устанавливаем зависимости для production с увеличенным таймаутом
RUN npm ci --only=production --fetch-timeout=600000 --fetch-retries=5 && \
    npm cache clean --force

# ===== BUILD STAGE =====
FROM base AS builder

# Копируем исходный код ПЕРЕД установкой зависимостей
COPY . .

# Устанавливаем все зависимости (включая dev) с увеличенным таймаутом
RUN npm ci --fetch-timeout=600000 --fetch-retries=5

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем Next.js приложение
# Next.js собирает standalone версию для оптимизации размера
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Фиктивный DATABASE_URL для сборки (реальный будет передан при запуске)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

RUN npm run build

# ===== RUNNER STAGE =====
FROM node:22-alpine AS runner

WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Копируем необходимые файлы из builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "server.js"]
