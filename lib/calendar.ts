/**
 * Calendar Integration Utilities for Google Calendar and iCalendar (.ics)
 * Supports automated event generation, attendee email invitations,
 * and shareable WhatsApp / email calendar links.
 */

export interface CalendarEventData {
  id?: string;
  meetingNumber: string;
  title: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  meetingUrl?: string;
  zoomUrl?: string;
  meetingIdZoom?: string;
  passcodeZoom?: string;
  meetingType?: 'OFFLINE' | 'ONLINE' | 'HYBRID' | string;
  biroName?: string;
  chairpersonName?: string;
  secretaryName?: string;
  attendees?: Array<{
    name: string;
    email: string;
  }>;
}

/**
 * Utility to extract virtual meeting (Zoom/Teams/Meet) details from
 * a location string or explicit parameters.
 */
export function extractVirtualMeetingDetails(
  locationOrText?: string,
  providedZoomUrl?: string,
  providedMeetingId?: string,
  providedPasscode?: string
): {
  zoomUrl?: string;
  meetingId?: string;
  passcode?: string;
  cleanPhysicalLocation: string;
  isVirtual: boolean;
} {
  const text = locationOrText || '';
  let zoomUrl = providedZoomUrl?.trim() || '';

  // Match URL if not directly provided
  if (!zoomUrl) {
    const urlMatch = text.match(/https?:\/\/[^\s\)\],]+/i);
    if (urlMatch) {
      zoomUrl = urlMatch[0];
    }
  }

  // Extract Meeting ID if present
  let meetingId = providedMeetingId?.trim() || '';
  if (!meetingId) {
    const idMatch = text.match(/(?:Meeting ID|ID Rapat|ID Zoom|ID)\s*[:=]?\s*([0-9\s]{9,14})/i);
    if (idMatch) {
      meetingId = idMatch[1].trim();
    }
  }

  // Extract Passcode if present
  let passcode = providedPasscode?.trim() || '';
  if (!passcode) {
    const passMatch = text.match(/(?:Passcode|Password|Sandi|Pass)\s*[:=]?\s*([a-zA-Z0-9]+)/i);
    if (passMatch) {
      passcode = passMatch[1].trim();
    }
  }

  // Derive clean physical location by stripping zoom links / labels
  let cleanPhysical = text
    .replace(/https?:\/\/[^\s\)\],]+/gi, '')
    .replace(/(?:Meeting ID|ID Rapat|ID Zoom|ID)\s*[:=]?\s*[0-9\s]{9,14}/gi, '')
    .replace(/(?:Passcode|Password|Sandi|Pass)\s*[:=]?\s*[a-zA-Z0-9]+/gi, '')
    .replace(/\s*&\s*Zoom\b/gi, '')
    .replace(/\s*•\s*Zoom\b/gi, '')
    .replace(/\s*\(Zoom:[^\)]*\)/gi, '')
    .replace(/\s*Zoom:[^,\n]*/gi, '')
    .replace(/[,;&•\s]+$/g, '')
    .replace(/^[,;&•\s]+/g, '')
    .trim();

  const isVirtual = !!zoomUrl || text.toLowerCase().includes('zoom') || text.toLowerCase().includes('daring') || text.toLowerCase().includes('online');

  if (!cleanPhysical && isVirtual) {
    cleanPhysical = 'Daring / Online (Zoom Cloud Meeting)';
  }

  return {
    zoomUrl: zoomUrl || undefined,
    meetingId: meetingId || undefined,
    passcode: passcode || undefined,
    cleanPhysicalLocation: cleanPhysical || text,
    isVirtual,
  };
}

/**
 * Normalizes time string (e.g. "09:00", "09.00 WIB", "09:00 - 12:00")
 * and extracts HH:MM components.
 */
function parseTimeString(timeStr: string, defaultHour: number, defaultMinute: number = 0): { hour: number; minute: number } {
  if (!timeStr) return { hour: defaultHour, minute: defaultMinute };
  const clean = timeStr.replace(/WIB/gi, '').trim();
  const match = clean.match(/(\d{1,2})[:.](\d{1,2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return { hour: Math.min(Math.max(h, 0), 23), minute: Math.min(Math.max(m, 0), 59) };
    }
  }
  return { hour: defaultHour, minute: defaultMinute };
}

/**
 * Formats a Date and Time into YYYYMMDDTHHmmss for Asia/Jakarta timezone
 */
export function formatLocalCalendarTimestamp(
  dateInput: Date | string,
  timeStr: string,
  fallbackHour: number = 9
): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  const { hour, minute } = parseTimeString(timeStr, fallbackHour);
  const hourStr = String(hour).padStart(2, '0');
  const minStr = String(minute).padStart(2, '0');

  return `${year}${month}${day}T${hourStr}${minStr}00`;
}

/**
 * Formats a Date and Time into UTC ISO string format (YYYYMMDDTHHmmssZ)
 * assuming the source is in WIB (UTC+7).
 */
export function formatUtcCalendarTimestamp(
  dateInput: Date | string,
  timeStr: string,
  fallbackHour: number = 9
): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  const { hour, minute } = parseTimeString(timeStr, fallbackHour);

  // Set date in local WIB (UTC+7)
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  // Create date representing WIB and convert to UTC
  // WIB is UTC+7, so UTC time = WIB hour - 7
  const utcDate = new Date(Date.UTC(year, month, day, hour - 7, minute, 0));

  const uYear = utcDate.getUTCFullYear();
  const uMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const uDay = String(utcDate.getUTCDate()).padStart(2, '0');
  const uHour = String(utcDate.getUTCHours()).padStart(2, '0');
  const uMin = String(utcDate.getUTCMinutes()).padStart(2, '0');
  const uSec = String(utcDate.getUTCSeconds()).padStart(2, '0');

  return `${uYear}${uMonth}${uDay}T${uHour}${uMin}${uSec}Z`;
}

/**
 * Generates direct Google Calendar Event URL with pre-filled details & attendees
 * URL format: https://calendar.google.com/calendar/render?action=TEMPLATE&...
 */
export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  const startUtc = formatUtcCalendarTimestamp(event.date, event.startTime, 9);
  const endUtc = formatUtcCalendarTimestamp(event.date, event.endTime, 12);

  const title = `[${event.meetingNumber}] ${event.title}`;

  // Virtual / Zoom details extraction
  const virtual = extractVirtualMeetingDetails(
    event.location,
    event.zoomUrl,
    event.meetingIdZoom,
    event.passcodeZoom
  );
  const activeZoom = event.zoomUrl || virtual.zoomUrl;
  const activeMeetingId = event.meetingIdZoom || virtual.meetingId;
  const activePasscode = event.passcodeZoom || virtual.passcode;

  // Build structured event description
  const descriptionParts: string[] = [
    `UNDANGAN RAPAT KOORDINASI RESMI`,
    `Sekretariat Dewan Nasional Kawasan Ekonomi Khusus (KEK) RI`,
    `----------------------------------------------------`,
    `Nomor Rapat: ${event.meetingNumber}`,
    `Agenda: ${event.title}`,
    `Waktu: ${event.startTime} - ${event.endTime} WIB`,
    `Lokasi / Ruang: ${virtual.cleanPhysicalLocation || event.location}`,
  ];

  // Auto-inject Zoom meeting link into Google Calendar invitation description
  if (activeZoom) {
    descriptionParts.push(`\n----------------------------------------------------`);
    descriptionParts.push(`🎥 TAUTAN RAPAT VIRTUAL (ZOOM):`);
    descriptionParts.push(`👉 ${activeZoom}`);
    if (activeMeetingId) {
      descriptionParts.push(`Meeting ID: ${activeMeetingId}`);
    }
    if (activePasscode) {
      descriptionParts.push(`Passcode: ${activePasscode}`);
    }
    descriptionParts.push(`----------------------------------------------------`);
  }

  if (event.biroName) {
    descriptionParts.push(`Biro Penyelenggara: ${event.biroName}`);
  }
  if (event.chairpersonName) {
    descriptionParts.push(`Pimpinan Sidang: ${event.chairpersonName}`);
  }
  if (event.secretaryName) {
    descriptionParts.push(`Notulis: ${event.secretaryName}`);
  }

  if (event.meetingUrl) {
    descriptionParts.push(`\nPortal Risalah & Notula Digital:`);
    descriptionParts.push(event.meetingUrl);
  }

  // Filter valid attendee email addresses
  const validEmails = (event.attendees || [])
    .map((a) => a.email.trim())
    .filter((email) => email && email.includes('@') && !email.endsWith('.invalid'));

  // Calendar Location: If online-only and zoom exists, set location directly to Zoom link
  let calendarLocation = event.location;
  if (activeZoom && (!virtual.cleanPhysicalLocation || virtual.cleanPhysicalLocation.toLowerCase().includes('daring') || virtual.cleanPhysicalLocation.toLowerCase().includes('online'))) {
    calendarLocation = activeZoom;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: descriptionParts.join('\n'),
    location: calendarLocation,
    ctz: 'Asia/Jakarta',
  });

  if (validEmails.length > 0) {
    // In Google Calendar, `add` parameter allows pre-populating invited guests
    params.set('add', validEmails.join(','));
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates RFC 5545 compliant iCalendar (.ics) content
 * Compatible with Google Calendar, Microsoft Outlook, Apple iCal, etc.
 */
export function generateIcsCalendar(event: CalendarEventData): string {
  const uid = event.id ? `${event.id}@kek.go.id` : `MTG-${Date.now()}@kek.go.id`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const startUtc = formatUtcCalendarTimestamp(event.date, event.startTime, 9);
  const endUtc = formatUtcCalendarTimestamp(event.date, event.endTime, 12);

  const cleanTitle = `[${event.meetingNumber}] ${event.title}`.replace(/\r?\n/g, ' ');
  const cleanLocation = event.location.replace(/\r?\n/g, ', ');

  const virtual = extractVirtualMeetingDetails(
    event.location,
    event.zoomUrl,
    event.meetingIdZoom,
    event.passcodeZoom
  );
  const activeZoom = event.zoomUrl || virtual.zoomUrl;

  const descriptionLines = [
    `UNDANGAN RAPAT KOORDINASI RESMI KEK`,
    `Nomor: ${event.meetingNumber}`,
    `Agenda: ${event.title}`,
    `Waktu: ${event.startTime} - ${event.endTime} WIB`,
    `Lokasi: ${event.location}`,
    activeZoom ? `Tautan Zoom: ${activeZoom}` : '',
    event.biroName ? `Biro: ${event.biroName}` : '',
    event.meetingUrl ? `Portal Rapat: ${event.meetingUrl}` : '',
  ]
    .filter(Boolean)
    .join('\\n');

  let attendeeLines = '';
  if (event.attendees && event.attendees.length > 0) {
    attendeeLines = event.attendees
      .filter((a) => a.email && a.email.includes('@'))
      .map(
        (a) =>
          `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${a.name.replace(/[,;]/g, '')}:mailto:${a.email}`
      )
      .join('\r\n');
    if (attendeeLines) attendeeLines += '\r\n';
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sekretariat Dewan Nasional KEK//Sistem Notula Rapat//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Jakarta',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0700',
    'TZOFFSETTO:+0700',
    'TZNAME:WIB',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${descriptionLines}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'ORGANIZER;CN=Sekretariat Dewan KEK:mailto:sekretariat@kek.go.id',
    attendeeLines.trim(),
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat Rapat Koordinasi KEK dalam 30 Menit',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Generates an official WhatsApp / messaging invitation template
 * with the direct Google Calendar link, meeting portal URL, and automatic Zoom link.
 */
export function generateWhatsAppMeetingShareText(event: CalendarEventData, gcalUrl: string): string {
  const d = typeof event.date === 'string' ? new Date(event.date) : event.date;
  const formattedDate = d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const attendeeCount = event.attendees?.length || 0;

  const virtual = extractVirtualMeetingDetails(
    event.location,
    event.zoomUrl,
    event.meetingIdZoom,
    event.passcodeZoom
  );
  const activeZoom = event.zoomUrl || virtual.zoomUrl;
  const activeMeetingId = event.meetingIdZoom || virtual.meetingId;
  const activePasscode = event.passcodeZoom || virtual.passcode;

  let zoomSection = '';
  if (activeZoom) {
    zoomSection = `\n💻 *Tautan Rapat Virtual (Zoom):*\n🔗 ${activeZoom}\n`;
    if (activeMeetingId) {
      zoomSection += `🆔 *Meeting ID:* ${activeMeetingId}\n`;
    }
    if (activePasscode) {
      zoomSection += `🔑 *Passcode:* ${activePasscode}\n`;
    }
  }

  return `*UNDANGAN RAPAT KOORDINASI SEKRETARIAT DEWAN NASIONAL KEK*
--------------------------------------------------
*Nomor:* ${event.meetingNumber}
*Agenda:* ${event.title}

📅 *Hari, Tanggal:* ${formattedDate}
⏰ *Waktu:* ${event.startTime} - ${event.endTime} WIB
📍 *Lokasi Fisik:* ${virtual.cleanPhysicalLocation || event.location}
${zoomSection}${event.chairpersonName ? `👤 *Pimpinan Sidang:* ${event.chairpersonName}\n` : ''}${event.biroName ? `🏢 *Penyelenggara:* ${event.biroName}\n` : ''}👥 *Peserta Terdaftar:* ${attendeeCount} Pejabat/Staf

--------------------------------------------------
*Tambahkan ke Google Calendar Anda:*
🔗 ${gcalUrl}

*Akses Dokumen Risalah & Notula Digital:*
🔗 ${event.meetingUrl || 'Portal Sistem KEK'}

_Pesan otomatis dikirim melalui Sistem Log & Notula Rapat Sekretariat Dewan Nasional KEK RI._`;
}
