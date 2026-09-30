import { JSONContent } from '@tiptap/react';

export interface ExtractedActionItem {
  title: string;
  description?: string;
  picBiroCode: string;
  dueDate: string; // YYYY-MM-DD
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface ExtractedMeetingData {
  title: string;
  biroCode: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  classification: string;
  meetingNumber?: string;
  chairpersonName?: string;
  secretaryName?: string;
  attendees: string;
  agendaText: string;
  discussionText: string;
  decisionsText: string;
  conclusionText: string;
  agendaJson: JSONContent;
  discussionJson: JSONContent;
  decisionsJson: JSONContent;
  conclusionJson: JSONContent;
  actionItems: ExtractedActionItem[];
  rawTextSummary?: string;
}

const MONTH_MAP: Record<string, string> = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12',
};

export function parseIndonesianDate(text: string): string | null {
  const namedMatch = text.match(
    /(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i
  );
  if (namedMatch) {
    const day = namedMatch[1].padStart(2, '0');
    const month = MONTH_MAP[namedMatch[2].toLowerCase()] || '01';
    const year = namedMatch[3];
    return `${year}-${month}-${day}`;
  }

  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  const slashMatch = text.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  return null;
}

export function parseMeetingTime(text: string): { startTime: string; endTime: string } {
  const match = text.match(
    /(\d{1,2})[:.](\d{2})\s*(?:-|s\.?d\.?|sampai)\s*(\d{1,2})[:.](\d{2})/i
  );
  if (match) {
    const startTime = `${match[1].padStart(2, '0')}:${match[2]}`;
    const endTime = `${match[3].padStart(2, '0')}:${match[4]}`;
    return { startTime, endTime };
  }
  return { startTime: '09:00', endTime: '12:00' };
}

/**
 * Converts formatted text (bullet points, numbered lists, or paragraphs) into valid TipTap JSONContent
 */
export function textToTipTapDoc(text: string, titlePrefix?: string): JSONContent {
  if (!text || !text.trim()) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '-' }],
        },
      ],
    };
  }

  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const content: any[] = [];

  if (titlePrefix) {
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: titlePrefix }],
    });
  }

  const listItems: any[] = [];

  for (const line of rawLines) {
    const isNumbered = /^(?:\d+[\.\)]|[a-zA-Z][\.\)])\s*(.+)/.exec(line);
    const isBullet = /^[-*•]\s*(.+)/.exec(line);

    if (isNumbered || isBullet) {
      const cleanText = (isNumbered ? isNumbered[1] : isBullet![1]).trim();
      listItems.push({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: cleanText }],
          },
        ],
      });
    } else {
      if (listItems.length > 0) {
        content.push({
          type: 'orderedList',
          content: [...listItems],
        });
        listItems.length = 0;
      }
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      });
    }
  }

  if (listItems.length > 0) {
    content.push({
      type: 'orderedList',
      content: [...listItems],
    });
  }

  return {
    type: 'doc',
    content:
      content.length > 0
        ? content
        : [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
}

/**
 * Intelligent Rule-based NLP Extractor for Indonesian Meeting Minutes & Official Documents.
 */
export function extractMeetingFromText(text: string): ExtractedMeetingData {
  // 1. Title / Topik
  let title = '';
  const tentangMatch = text.match(
    /(?:TENTANG|JUDUL|AGENDA|PERIHAL)\s*:\s*\n*([^\n\r]+(?:\n\s*[^\n\r]+)*?)(?=\n\s*(?:[I|V|X]+\.|\bDASAR\b|\bWAKTU\b|\bHARI\b|\bPESERTA\b|\bI\b))/i
  );
  if (tentangMatch) {
    title = tentangMatch[1].replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    const rapatMatch = text.match(/(?:RAPAT\s+[A-Z0-9\s,.-]{10,140})/);
    if (rapatMatch) {
      title = rapatMatch[0].trim();
    } else {
      const firstLines = text
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 5 && !/NOTULA|CATATAN|MINUTES/i.test(s));
      title = firstLines[0] || 'Rapat Koordinasi KEK';
    }
  }

  // 2. Date
  const date = parseIndonesianDate(text) || new Date().toISOString().split('T')[0];

  // 3. Time
  const { startTime, endTime } = parseMeetingTime(text);

  // 4. Location
  let location = 'Ruang Rapat Gedung Posko KEK & Hybrid Zoom';
  const locMatch = text.match(/(?:Tempat|Lokasi|Media)\s*:\s*([^\n\r]+)/i);
  if (locMatch) {
    location = locMatch[1].trim();
  }

  // 5. Meeting / Invitation Number
  let meetingNumber = '';
  const numMatch = text.match(/(?:NOMOR|NO\.?)\s*:\s*([^\n\r]+)/i);
  if (numMatch) {
    meetingNumber = numMatch[1].trim();
  }

  // 6. Chairperson & Secretary
  let chairpersonName = '';
  const chairMatch = text.match(
    /(?:Pimpinan Rapat|Ketua Sidang|Ketua Rapat|Dipimpin Oleh)\s*:\s*([^\n\r]+)/i
  );
  if (chairMatch) {
    chairpersonName = chairMatch[1].replace(/\([^\)]+\)/g, '').trim();
  }

  let secretaryName = '';
  const secMatch = text.match(
    /(?:Notulis|Sekretaris|Pencatat)\s*:\s*([^\n\r]+)/i
  );
  if (secMatch) {
    secretaryName = secMatch[1].replace(/\([^\)]+\)/g, '').trim();
  }

  // 7. Bureau (Biro)
  let biroCode = 'IKK';
  const biroLineMatch = text.match(
    /(?:Biro\s+(?:Pemrakarsa|Penyelenggara|Pelaksana)?)\s*:\s*([^\n\r]+)/i
  );
  const biroSearchScope = biroLineMatch ? biroLineMatch[1] : text;

  if (/\bPKS\b|Perencanaan/i.test(biroSearchScope)) biroCode = 'PKS';
  else if (/\bPPT\b|Pengembangan\s+Kawasan/i.test(biroSearchScope)) biroCode = 'PPT';
  else if (/\bKSK\b|Kajian\s+Strategis|Pengawasan/i.test(biroSearchScope)) biroCode = 'KSK';
  else if (/\bIKK\b|Fasilitasi|Informasi/i.test(biroSearchScope)) biroCode = 'IKK';
  else if (/\bHUKUM\b/i.test(biroSearchScope)) biroCode = 'HUKUM';

  // 8. Classification
  let classification = 'STRATEGIS';
  if (/DARURAT|ESKALASI|MENDESAK/i.test(text)) classification = 'DARURAT';
  else if (/REGULER|BERKALA|RUTIN/i.test(text)) classification = 'REGULER';

  // 9. Section Extraction
  const sections: Record<string, string> = {};

  const sectionKeywords = [
    { key: 'attendees', regex: /(?:PESERTA RAPAT|DAFTAR HADIR|HADIR)/i },
    { key: 'agenda', regex: /(?:AGENDA RAPAT|SUSUNAN ACARA|TOPIK PEMBAHASAN)/i },
    {
      key: 'discussion',
      regex: /(?:HASIL PEMBAHASAN|PEMBAHASAN|JALANNYA RAPAT|CATATAN DISKUSI)/i,
    },
    {
      key: 'decisions',
      regex: /(?:KEPUTUSAN DAN KESEPAKATAN|POIN KEPUTUSAN|KEPUTUSAN RAPAT|KESEPAKATAN)/i,
    },
    {
      key: 'conclusion',
      regex: /(?:KESIMPULAN DAN PENUTUP|KESIMPULAN|PENUTUP)/i,
    },
    {
      key: 'actionItems',
      regex: /(?:BUTIR TINDAK LANJUT|ACTION ITEMS|MATRIKS TINDAK LANJUT|TINDAK LANJUT)/i,
    },
  ];

  const foundSections: { key: string; index: number; heading: string }[] = [];
  for (const sk of sectionKeywords) {
    const match = sk.regex.exec(text);
    if (match) {
      foundSections.push({ key: sk.key, index: match.index, heading: match[0] });
    }
  }

  foundSections.sort((a, b) => a.index - b.index);

  for (let i = 0; i < foundSections.length; i++) {
    const current = foundSections[i];
    const startIndex = current.index + current.heading.length;
    const endIndex = i + 1 < foundSections.length ? foundSections[i + 1].index : text.length;
    let content = text.slice(startIndex, endIndex).trim();
    content = content
      .replace(/^\s*\([^\)]+\)/, '')
      .replace(/^[:\-\s]+/, '')
      .trim();
    sections[current.key] = content;
  }

  // Format Attendees
  let attendeesText = '';
  if (sections.attendees) {
    const names = sections.attendees
      .split('\n')
      .map((line) => line.replace(/^(?:\d+[\.\)]|[-*•])\s*/, '').trim())
      .filter((line) => line.length > 2 && !/^(?:I|II|III|IV|V|VI|VII)\./.test(line));
    attendeesText = names.join(', ');
  }
  if (!attendeesText) {
    attendeesText = chairpersonName
      ? `${chairpersonName}, Staf Tim Kerja`
      : 'Staf dan Pejabat Terkait';
  }

  // Format Action Items
  const actionItems: ExtractedActionItem[] = [];
  if (sections.actionItems) {
    const rawItems = sections.actionItems
      .split('\n')
      .map((line) => line.replace(/^(?:\d+[\.\)]|[-*•])\s*/, '').trim())
      .filter((line) => line.length > 3 && !/^\(ACTION ITEMS\)$/i.test(line));

    for (const item of rawItems) {
      let pic = biroCode;
      const picMatch = item.match(/PIC\s*:\s*(?:Biro\s+)?([A-Z]{3,5})/i);
      if (picMatch) {
        pic = picMatch[1].toUpperCase();
      } else {
        if (/PKS/i.test(item)) pic = 'PKS';
        else if (/PPT/i.test(item)) pic = 'PPT';
        else if (/KSK/i.test(item)) pic = 'KSK';
        else if (/IKK/i.test(item)) pic = 'IKK';
      }

      let dueDate = '';
      const dueMatch = parseIndonesianDate(item);
      if (dueMatch) {
        dueDate = dueMatch;
      } else {
        const d = new Date(date);
        d.setDate(d.getDate() + 7);
        dueDate = d.toISOString().split('T')[0];
      }

      let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
      if (/URGENT|DARURAT|SEGERA/i.test(item)) priority = 'URGENT';
      else if (/HIGH|TINGGI|PRIORITAS/i.test(item)) priority = 'HIGH';
      else if (/LOW|RENDAH/i.test(item)) priority = 'LOW';

      const cleanTitle = item
        .replace(/\(PIC[^\)]+\)/i, '')
        .replace(/\(Tenggat[^\)]+\)/i, '')
        .replace(/\(Prioritas[^\)]+\)/i, '')
        .replace(/\s+\./g, '.')
        .trim();

      if (cleanTitle.length > 5) {
        actionItems.push({
          title: cleanTitle,
          picBiroCode: pic,
          dueDate,
          priority,
        });
      }
    }
  }

  // Prepare TipTap JSON for sections
  const agendaJson = textToTipTapDoc(sections.agenda || `Pembahasan terkait ${title}`);
  const discussionJson = textToTipTapDoc(
    sections.discussion || 'Pemaparan substansi teknis dan diskusi bersama pihak terkait.',
    `Rapat membahas terkait ${title.toLowerCase()}, adapun hasil rapat sebagaimana berikut:`
  );
  const decisionsJson = textToTipTapDoc(
    sections.decisions || 'Seluruh peserta rapat menyepakati tindak lanjut dan koordinasi intensif.'
  );
  const conclusionJson = textToTipTapDoc(
    sections.conclusion || 'Rapat koordinasi berjalan lancar dan menghasilkan komitmen bersama.'
  );

  return {
    title,
    date,
    startTime,
    endTime,
    location,
    classification,
    meetingNumber,
    chairpersonName,
    secretaryName,
    biroCode,
    attendees: attendeesText,
    agendaText: sections.agenda || '',
    discussionText: sections.discussion || '',
    decisionsText: sections.decisions || '',
    conclusionText: sections.conclusion || '',
    agendaJson,
    discussionJson,
    decisionsJson,
    conclusionJson,
    actionItems,
  };
}

/**
 * Hybrid Extractor: Tries Gemini API if GEMINI_API_KEY is configured in env,
 * otherwise falls back seamlessly to the smart Indonesian rule engine.
 */
export async function extractMeetingDocumentSmart(rawText: string): Promise<ExtractedMeetingData> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (geminiApiKey) {
    try {
      const prompt = `Anda adalah asisten AI profesional untuk Sekretariat Dewan Nasional Kawasan Ekonomi Khusus (KEK) Republik Indonesia.
Tolong ekstrak teks notula/dokumen rapat berikut menjadi JSON terstruktur persis dengan schema:
{
  "title": "string (Judul rapat lengkap)",
  "biroCode": "IKK | PKS | PPT | KSK (pilih salah satu biro KEK yang paling sesuai)",
  "date": "YYYY-MM-DD (tanggal rapat)",
  "startTime": "HH:MM (waktu mulai, misal 09:00)",
  "endTime": "HH:MM (waktu selesai, misal 12:00)",
  "location": "string (lokasi rapat/zoom)",
  "classification": "STRATEGIS | REGULER | DARURAT",
  "meetingNumber": "string atau null (nomor undangan bila ada)",
  "chairpersonName": "string atau null (nama pimpinan rapat)",
  "secretaryName": "string atau null (nama notulis)",
  "attendees": "string (nama peserta dipisahkan koma)",
  "agendaText": "string (daftar agenda bernomor)",
  "discussionText": "string (pembahasan rinci)",
  "decisionsText": "string (poin keputusan)",
  "conclusionText": "string (kesimpulan & penutup)",
  "actionItems": [
    {
      "title": "string (judul tugas tindak lanjut)",
      "picBiroCode": "IKK | PKS | PPT | KSK",
      "dueDate": "YYYY-MM-DD",
      "priority": "LOW | MEDIUM | HIGH | URGENT"
    }
  ]
}

Hanya kembalikan JSON valid tanpa markdown formatting backtick.

Teks dokumen rapat:
${rawText.slice(0, 15000)}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const outputText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (outputText) {
          const parsed = JSON.parse(outputText);
          return {
            title: parsed.title || 'Rapat Koordinasi KEK',
            biroCode: parsed.biroCode || 'IKK',
            date: parsed.date || new Date().toISOString().split('T')[0],
            startTime: parsed.startTime || '09:00',
            endTime: parsed.endTime || '12:00',
            location: parsed.location || 'Ruang Rapat Gedung Posko KEK & Hybrid Zoom',
            classification: parsed.classification || 'STRATEGIS',
            meetingNumber: parsed.meetingNumber || undefined,
            chairpersonName: parsed.chairpersonName || undefined,
            secretaryName: parsed.secretaryName || undefined,
            attendees: parsed.attendees || 'Staf dan Pejabat Terkait',
            agendaText: parsed.agendaText || '',
            discussionText: parsed.discussionText || '',
            decisionsText: parsed.decisionsText || '',
            conclusionText: parsed.conclusionText || '',
            agendaJson: textToTipTapDoc(parsed.agendaText || 'Agenda Rapat'),
            discussionJson: textToTipTapDoc(parsed.discussionText || 'Pembahasan'),
            decisionsJson: textToTipTapDoc(parsed.decisionsText || 'Keputusan'),
            conclusionJson: textToTipTapDoc(parsed.conclusionText || 'Kesimpulan'),
            actionItems: parsed.actionItems || [],
          };
        }
      }
    } catch (aiErr) {
      console.warn('Gemini extraction failed, falling back to local NLP engine:', aiErr);
    }
  }

  // Default: Smart Indonesian NLP Rule Engine
  return extractMeetingFromText(rawText);
}
