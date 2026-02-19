import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { users, refreshTokens } from '../../db/schema.js';
import { env } from '../../config/env.js';
import { AuthError, ConflictError } from '../../shared/errors.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

const SALT_ROUNDS = 12;

function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

async function storeRefreshToken(userId: string, rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });
  return rawToken;
}

function formatUser(user: { id: string; name: string; email: string; businessName: string | null }) {
  return { id: user.id, name: user.name, email: user.email, business_name: user.businessName };
}

/** Registra novo usuário e retorna tokens */
export async function register(input: RegisterInput) {
  const existing = db.select().from(users).where(eq(users.email, input.email)).get();
  if (existing) throw new ConflictError('Email já cadastrado');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash,
      businessName: input.business_name || null,
    })
    .returning()
    .get();

  const accessToken = signAccessToken(user.id);
  const refreshToken = await storeRefreshToken(user.id, generateRefreshToken());

  return { user: formatUser(user), access_token: accessToken, refresh_token: refreshToken };
}

/** Autentica usuário e retorna tokens */
export async function login(input: LoginInput) {
  const user = db.select().from(users).where(eq(users.email, input.email)).get();
  if (!user) throw new AuthError('Credenciais inválidas');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AuthError('Credenciais inválidas');

  const accessToken = signAccessToken(user.id);
  const refreshToken = await storeRefreshToken(user.id, generateRefreshToken());

  return { user: formatUser(user), access_token: accessToken, refresh_token: refreshToken };
}

/** Rotaciona refresh token */
export async function refresh(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const stored = db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.revoked, false)))
    .get();

  if (!stored) throw new AuthError('Refresh token inválido ou revogado');
  if (new Date(stored.expiresAt) < new Date()) {
    db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, stored.id)).run();
    throw new AuthError('Refresh token expirado');
  }

  // Revoke old token
  db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, stored.id)).run();

  const user = db.select().from(users).where(eq(users.id, stored.userId)).get();
  if (!user) throw new AuthError('Usuário não encontrado');

  const accessToken = signAccessToken(user.id);
  const newRefreshToken = await storeRefreshToken(user.id, generateRefreshToken());

  return { access_token: accessToken, refresh_token: newRefreshToken };
}

/** Revoga todos os refresh tokens do usuário */
export function logout(userId: string) {
  db.update(refreshTokens)
    .set({ revoked: true })
    .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.revoked, false)))
    .run();
}

/** Verifica access token e retorna userId */
export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    return payload.sub as string;
  } catch {
    throw new AuthError('Token inválido ou expirado');
  }
}
