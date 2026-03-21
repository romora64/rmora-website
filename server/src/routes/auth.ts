import { Router } from 'express';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getAuthUrl, exchangeCode } from '../services/googleOAuth';
import { signToken } from '../services/jwt';
import { db } from '../db';
import { users } from '../db/schema';
import { config } from '../config';

const router = Router();

// GET /api/auth/google — redirige a Google para autenticación
router.get('/google', (_req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 min
    sameSite: 'lax',
  });
  res.redirect(getAuthUrl(state));
});

// GET /api/auth/google/callback — Google redirige aquí con el code
router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${config.CLIENT_URL}/admin/login?error=google_denied`);
  }

  const storedState = req.cookies?.oauth_state;
  if (!state || !storedState || state !== storedState) {
    return res.redirect(`${config.CLIENT_URL}/admin/login?error=state_mismatch`);
  }

  res.clearCookie('oauth_state');

  try {
    const profile = await exchangeCode(code as string);

    if (profile.email.toLowerCase() !== config.ADMIN_EMAIL.toLowerCase()) {
      return res.redirect(`${config.CLIENT_URL}/admin/login?error=unauthorized`);
    }

    // Upsert en tabla users
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.openId, profile.sub))
      .limit(1);

    let userId: number;

    if (existing.length > 0) {
      await db
        .update(users)
        .set({ name: profile.name, email: profile.email, lastSignedIn: new Date() })
        .where(eq(users.openId, profile.sub));
      userId = existing[0].id;
    } else {
      const result = await db.insert(users).values({
        openId: profile.sub,
        name: profile.name,
        email: profile.email,
        loginMethod: 'google',
        role: 'admin',
        lastSignedIn: new Date(),
      });
      userId = Number(result[0].insertId);
    }

    const token = signToken({ userId, email: profile.email, role: 'admin' });

    res.cookie('session', token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return res.redirect(`${config.CLIENT_URL}/admin`);
  } catch (err) {
    console.error('Error en OAuth callback:', err);
    return res.redirect(`${config.CLIENT_URL}/admin/login?error=auth_failed`);
  }
});

export default router;
