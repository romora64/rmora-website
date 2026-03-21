import { Resend } from 'resend';
import { config } from '../config';

const resend = new Resend(config.RESEND_API_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formatea una fecha YYYY-MM-DD como "lunes 16 de marzo de 2026" */
function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: config.TIMEZONE,
  });
}

/** Formatea hora HH:MM como "9:00 a. m." */
function formatTime(timeStr: string): string {
  const [h, min] = timeStr.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, min);
  return date.toLocaleTimeString('es-CR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: config.TIMEZONE,
  });
}

// ─── Email: confirmación de reunión al asistente ───────────────────────────────

export async function sendMeetingConfirmationToAttendee(params: {
  attendeeName: string;
  attendeeEmail: string;
  date: string;
  time: string;
  meetLink: string;
}): Promise<void> {
  const { attendeeName, attendeeEmail, date, time, meetLink } = params;
  const dateFormatted = formatDateLong(date);
  const timeFormatted = formatTime(time);

  await resend.emails.send({
    from: `Ronald Mora <${config.RESEND_FROM_EMAIL}>`,
    to: attendeeEmail,
    subject: `Confirmación de reunión — ${dateFormatted}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <h2 style="font-size: 22px; margin-bottom: 8px;">Reunión confirmada</h2>
        <p>Estimado/a <strong>${attendeeName}</strong>,</p>
        <p>Su solicitud de reunión ha sido recibida y el evento ha sido creado en el calendario.</p>
        <table style="border-collapse: collapse; margin: 24px 0; width: 100%;">
          <tr>
            <td style="padding: 8px 16px 8px 0; color: #555; white-space: nowrap;">Fecha</td>
            <td style="padding: 8px 0;"><strong>${dateFormatted}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 16px 8px 0; color: #555; white-space: nowrap;">Hora</td>
            <td style="padding: 8px 0;"><strong>${timeFormatted} (hora de Costa Rica)</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 16px 8px 0; color: #555; white-space: nowrap;">Enlace</td>
            <td style="padding: 8px 0;">
              <a href="${meetLink}" style="color: #1565C0;">${meetLink}</a>
            </td>
          </tr>
        </table>
        <p style="font-size: 14px; color: #555;">
          Recibirá un recordatorio por correo 60 minutos antes de la reunión.<br>
          Si necesita cancelar o reprogramar, por favor contácteme con anticipación.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
        <p style="font-size: 13px; color: #888;">
          Ronald Mora &mdash; <a href="https://rmora.org" style="color: #1565C0;">rmora.org</a>
        </p>
      </div>
    `,
  });
}

// ─── Email: notificación de nueva reunión al admin ────────────────────────────

export async function sendMeetingNotificationToAdmin(params: {
  attendeeName: string;
  attendeeEmail: string;
  date: string;
  time: string;
  notes?: string;
  meetLink: string;
}): Promise<void> {
  const { attendeeName, attendeeEmail, date, time, notes, meetLink } = params;
  const dateFormatted = formatDateLong(date);
  const timeFormatted = formatTime(time);

  await resend.emails.send({
    from: `rmora.org <${config.RESEND_FROM_EMAIL}>`,
    to: config.ADMIN_EMAIL,
    subject: `Nueva reunión agendada — ${attendeeName}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <h2 style="font-size: 20px; margin-bottom: 8px;">Nueva reunión agendada</h2>
        <table style="border-collapse: collapse; margin: 16px 0; width: 100%;">
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #555; white-space: nowrap;">Solicitante</td>
            <td style="padding: 6px 0;"><strong>${attendeeName}</strong> &lt;${attendeeEmail}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #555; white-space: nowrap;">Fecha</td>
            <td style="padding: 6px 0;"><strong>${dateFormatted}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #555; white-space: nowrap;">Hora</td>
            <td style="padding: 6px 0;"><strong>${timeFormatted}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #555; white-space: nowrap;">Meet</td>
            <td style="padding: 6px 0;"><a href="${meetLink}" style="color: #1565C0;">${meetLink}</a></td>
          </tr>
          ${
            notes
              ? `<tr>
            <td style="padding: 6px 16px 6px 0; color: #555; white-space: nowrap; vertical-align: top;">Notas</td>
            <td style="padding: 6px 0;">${notes}</td>
          </tr>`
              : ''
          }
        </table>
      </div>
    `,
  });
}

// ─── Email: notificación de nuevo mensaje de contacto al admin ────────────────

export async function sendContactMessageNotificationToAdmin(params: {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}): Promise<void> {
  const { senderName, senderEmail, subject, message } = params;

  await resend.emails.send({
    from: `rmora.org <${config.RESEND_FROM_EMAIL}>`,
    to: config.ADMIN_EMAIL,
    subject: `Nuevo mensaje: ${subject}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <h2 style="font-size: 20px; margin-bottom: 8px;">Nuevo mensaje de contacto</h2>
        <table style="border-collapse: collapse; margin: 16px 0; width: 100%;">
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #555; white-space: nowrap;">De</td>
            <td style="padding: 6px 0;"><strong>${senderName}</strong> &lt;${senderEmail}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #555; white-space: nowrap;">Asunto</td>
            <td style="padding: 6px 0;"><strong>${subject}</strong></td>
          </tr>
        </table>
        <div style="background: #f5f5f5; padding: 16px; margin-top: 8px; white-space: pre-wrap; font-size: 15px;">
          ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      </div>
    `,
  });
}
