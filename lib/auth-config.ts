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
          throw new Error('Email и пароль обязательны');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Неверный email или пароль');
        }

        // Проверка блокировки аккаунта
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Аккаунт заблокирован. Попробуйте через ${minutesLeft} минут`);
        }

        // Проверка статуса
        if (user.status === 'blocked') {
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

            throw new Error('Слишком много неудачных попыток входа. Аккаунт заблокирован на 1 час');
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          const attemptsLeft = 5 - newAttempts;
          throw new Error(`Неверный пароль. Осталось попыток: ${attemptsLeft}`);
        }

        // Успешный вход - сбрасываем счетчик попыток
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
          },
        });

        // Отправляем уведомление о входе
        try {
          const emailContent = getLoginNotificationEmail(
            user.name || 'Пользователь',
            user.email
          );
          await sendEmail({
            to: user.email,
            ...emailContent,
          });
        } catch (emailError) {
          console.error('Failed to send login notification:', emailError);
        }

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
        try {
          // Проверяем, существует ли пользователь
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
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

            // Создаем баланс для нового пользователя
            await prisma.userBalance.create({
              data: {
                userId: newUser.id,
                balance: 0,
              },
            });

            user.id = newUser.id;
          } else {
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
            } catch (emailError) {
              console.error('Failed to send login notification:', emailError);
            }
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      
      // Для credentials provider отправляем уведомление
      if (account?.provider === 'credentials' && user?.email) {
        try {
          const emailContent = getLoginNotificationEmail(
            user.name || 'Пользователь',
            user.email
          );
          await sendEmail({
            to: user.email,
            ...emailContent,
          });
        } catch (emailError) {
          console.error('Failed to send login notification:', emailError);
        }
      }
      
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
