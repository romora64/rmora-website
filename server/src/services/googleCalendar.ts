import { google } from 'googleapis';
import { config } from '../config';

function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

export interface CreateMeetingEventParams {
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
}

export interface MeetingEventResult {
  calendarEventId: string;
  meetLink: string;
}

/**
 * Crea un evento en Google Calendar con Google Meet auto-generado.
 * Retorna el eventId y el Meet link.
 */
export async function createMeetingEvent(
  params: CreateMeetingEventParams,
): Promise<MeetingEventResult> {
  const { date, time, attendeeName, attendeeEmail, notes } = params;
  const calendar = getCalendarClient();

  // Construir DateTime con zona horaria de Costa Rica
  const startDateTime = `${date}T${time}:00`;
  const [h, m] = time.split(':').map(Number);
  const endMinutes = h * 60 + m + config.MEETING_DURATION_MINUTES;
  const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
  const endM = (endMinutes % 60).toString().padStart(2, '0');
  const endDateTime = `${date}T${endH}:${endM}:00`;

  const event = await calendar.events.insert({
    calendarId: config.GOOGLE_CALENDAR_ID,
    conferenceDataVersion: 1, // habilita auto-generación de Meet link
    requestBody: {
      summary: `Reunión con ${attendeeName}`,
      description: notes ?? '',
      start: {
        dateTime: startDateTime,
        timeZone: config.TIMEZONE,
      },
      end: {
        dateTime: endDateTime,
        timeZone: config.TIMEZONE,
      },
      attendees: [
        { email: attendeeEmail, displayName: attendeeName },
        { email: config.ADMIN_EMAIL, self: true },
      ],
      conferenceData: {
        createRequest: {
          requestId: `rmora-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    },
  });

  const eventData = event.data;
  const calendarEventId = eventData.id!;
  const meetLink =
    eventData.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ??
    eventData.hangoutLink ??
    '';

  return { calendarEventId, meetLink };
}

/**
 * Cancela un evento de Google Calendar.
 */
export async function cancelMeetingEvent(calendarEventId: string): Promise<void> {
  const calendar = getCalendarClient();
  await calendar.events.delete({
    calendarId: config.GOOGLE_CALENDAR_ID,
    eventId: calendarEventId,
    sendUpdates: 'all',
  });
}
