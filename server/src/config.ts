import { config as dotenvConfig } from 'dotenv';
import path from 'path';
dotenvConfig({ path: path.resolve(__dirname, '../../.env') });
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url(),
  GOOGLE_REFRESH_TOKEN: z.string(),
  GOOGLE_CALENDAR_ID: z.string().default('primary'),

  ADMIN_EMAIL: z.string().email(),

  RESEND_API_KEY: z.string(),
  RESEND_FROM_EMAIL: z.string().email(),

  AVAILABILITY_START_HOUR: z.coerce.number().default(9),
  AVAILABILITY_END_HOUR: z.coerce.number().default(16),
  AVAILABILITY_END_MINUTE: z.coerce.number().default(30),
  AVAILABILITY_DAYS: z.string().default('1,2,3,4,5'),
  MEETING_DURATION_MINUTES: z.coerce.number().default(30),
  TIMEZONE: z.string().default('America/Costa_Rica'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isDev: parsed.data.NODE_ENV === 'development',
  availabilityDays: parsed.data.AVAILABILITY_DAYS.split(',').map(Number),
};
