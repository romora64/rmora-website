/**
 * Script para obtener un nuevo refresh token de Google Calendar.
 * Ejecutar con: node scripts/get-refresh-token.mjs
 */

import { createServer } from 'http';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:9999/oauth/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',          // fuerza nuevo refresh_token
  scope: ['https://www.googleapis.com/auth/calendar'],
});

console.log('\n══════════════════════════════════════════════════');
console.log('  Abre esta URL en el navegador y autoriza el acceso:');
console.log('══════════════════════════════════════════════════\n');
console.log(authUrl);
console.log('\n══════════════════════════════════════════════════');
console.log('  Esperando callback en http://localhost:9999 ...');
console.log('══════════════════════════════════════════════════\n');

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:9999');
  const code = url.searchParams.get('code');

  if (!code) {
    res.end('No se recibió código de autorización.');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.end('<h2>✅ ¡Autorización exitosa! Revisa la terminal.</h2>');

    console.log('\n══════════════════════════════════════════════════');
    console.log('  ✅ NUEVO REFRESH TOKEN OBTENIDO');
    console.log('══════════════════════════════════════════════════');
    console.log('\nAgrega esto en tu archivo .env:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n══════════════════════════════════════════════════\n');
  } catch (err) {
    res.end(`<h2>Error: ${err.message}</h2>`);
    console.error('Error al obtener tokens:', err.message);
  }

  server.close();
});

server.listen(9999);
