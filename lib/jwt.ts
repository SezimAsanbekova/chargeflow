import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  // Падаем сразу: без надёжного секрета admin-токены можно подделать.
  throw new Error(
    'JWT_SECRET is not set or too short (min 32 chars). Set a strong JWT_SECRET in the environment.'
  );
}

// Узкий тип после проверки выше — гарантированно string.
const SECRET: string = JWT_SECRET;

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type?: 'admin' | 'user';
}

/**
 * Создание JWT токена
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  return jwt.sign(payload, SECRET, {
    expiresIn: '7d',
  });
}

/**
 * Проверка JWT токена
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}
