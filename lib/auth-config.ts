import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { sendEmail, getLoginNotificationEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import type { Adapter } from 'next-auth/adapters';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [CREDENTIALS] Missing credentials');
          throw new Error('Email и пароль обязательны');
        }

        console.log('🔐 [CREDENTIALS] Login attempt:', { email: credentials.email, timestamp: new Date().toISOString() });

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log('❌ [CREDENTIALS] User not found:', { email: credentials.email });
          throw new Error('Неверный email или пароль');
        }

        console.log('✅ [CREDENTIALS] User found:', { email: credentials.email, role: user.role, hasPassword: !!user.passwordHash });

        // Проверяем, является ли пользователь администратором
        if (user.role === 'admin') {
          console.log('❌ [CREDENTIALS] Admin trying to login via user endpoint:', { email: credentials.email });
          throw new Error('Этот аккаунт предназначен только для админ-панели. Войдите через /admin/signin');
        }

        // Проверяем, был ли аккаунт создан через Google (без пароля)
        if (!user.passwordHash) {
          console.log('❌ [CREDENTIALS] Google account, no password:', { email: credentials.email });
          throw new Error('Этот аккаунт создан через Google. Войдите через Google');
        }

        // Проверка блокировки аккаунта
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          console.log('🔒 [CREDENTIALS] Account locked:', { email: credentials.email, minutesLeft });
          throw new Error(`Аккаунт заблокирован. Попробуйте через ${minutesLeft} минут`);
        }

        // Проверка статуса
        if (user.status === 'blocked') {
          console.log('🚫 [CREDENTIALS] Account blocked by admin:', { email: credentials.email });
          throw new Error('Ваш аккаунт заблокирован администратором');
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          // Увеличиваем счетчик неудачных попыток
          const newAttempts = user.loginAttempts + 1;
          console.log('❌ [CREDENTIALS] Invalid password:', { email: credentials.email, attempts: newAttempts });
          
          const updateData: any = {
            loginAttempts: newAttempts,
          };

          // Блокируем на 1 час после 5 неудачных попыток
          if (newAttempts >= 5) {
            const lockUntil = new Date();
            lockUntil.setHours(lockUntil.getHours() + 1);
            updateData.lockedUntil = lockUntil;
            
            await prisma.user.update({
              where: { id: user.id },
              data: updateData,
            });

            console.log('🔒 [CREDENTIALS] Account locked due to failed attempts:', { email: credentials.email });
            throw new Error('Слишком много неудачных попыток входа. Аккаунт заблокирован на 1 час');
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          const attemptsLeft = 5 - newAttempts;
          throw new Error(`Неверный пароль. Осталось попыток: ${attemptsLeft}`);
        }

        console.log('✅ [CREDENTIALS] Password valid, resetting login attempts:', { email: credentials.email });

        // Успешный вход - сбрасываем счетчик попыток
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
          },
        });

        console.log('✅ [CREDENTIALS] Login successful:', { email: credentials.email, userId: user.id });

        // Не отправляем уведомление о входе при использовании credentials
        // (это может быть первый вход после регистрации)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google') {
        console.log('🔐 [GOOGLE] OAuth login attempt:', { email: user.email, timestamp: new Date().toISOString() });
        
        try {
          // Проверяем, существует ли пользователь
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Если пользователь существует и является администратором, блокируем вход
          if (existingUser && existingUser.role === 'admin') {
            console.log('❌ [GOOGLE] Admin trying to login via Google:', { email: user.email });
            return false;
          }

          if (!existingUser) {
            console.log('📝 [GOOGLE] Creating new user:', { email: user.email });
            
            // Создаем нового пользователя
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
                role: 'user',
                status: 'active',
                passwordHash: null,
              },
            });

            console.log('✅ [GOOGLE] User created:', { email: user.email, userId: newUser.id });

            // Создаем баланс для нового пользователя
            await prisma.userBalance.create({
              data: {
                userId: newUser.id,
                balance: 0,
              },
            });

            console.log('✅ [GOOGLE] User balance created:', { email: user.email, userId: newUser.id });

            user.id = newUser.id;
          } else {
            console.log('✅ [GOOGLE] Existing user login:', { email: user.email, userId: existingUser.id });
            user.id = existingUser.id;
            
            // Отправляем уведомление о входе
            try {
              const emailContent = getLoginNotificationEmail(
                existingUser.name || 'Пользователь',
                existingUser.email
              );
              await sendEmail({
                to: existingUser.email,
                ...emailContent,
              });
              console.log('📧 [GOOGLE] Login notification sent:', { email: user.email });
            } catch (emailError) {
              console.error('❌ [GOOGLE] Failed to send login notification:', emailError);
            }
          }

          console.log('✅ [GOOGLE] Login successful:', { email: user.email, userId: user.id });
          return true;
        } catch (error) {
          console.error('❌ [GOOGLE] Error in signIn callback:', error);
          return false;
        }
      }
      
      // Не отправляем уведомление о входе для credentials provider
      // чтобы избежать дублирования писем
      
      return true;
    },
    async jwt({ token, user, account, trigger }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
      }

      // Если это первый вход через Google, получаем ID пользователя
      if (trigger === 'signIn' && account?.provider === 'google') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }: any) {
      // Создаем баланс для нового пользователя
      try {
        const existingBalance = await prisma.userBalance.findUnique({
          where: { userId: user.id },
        });

        if (!existingBalance) {
          await prisma.userBalance.create({
            data: {
              userId: user.id,
              balance: 0,
            },
          });
        }
      } catch (error) {
        console.error('Error creating user balance:', error);
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
