/**
 * Helper types and utilities for PIC Deliverables & Progress Tracking
 */

export interface PicDeliverableLink {
  url: string;
  title?: string;
}

export interface PicDeliverableParsedData {
  notes?: string;
  linkUrl?: string;
  linkTitle?: string;
  links?: PicDeliverableLink[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  updatedAt?: string;
  updatedByName?: string;
}

/**
 * Helper to parse deliverable description safely.
 * Supports JSON structure, falls back to plain text / url extraction.
 */
export function parsePicDeliverableDescription(
  desc?: string | null
): PicDeliverableParsedData {
  if (!desc || !desc.trim()) {
    return { notes: '', linkUrl: '', linkTitle: '', links: [] };
  }

  const trimmed = desc.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      let links: PicDeliverableLink[] = [];
      if (Array.isArray(parsed.links)) {
        links = parsed.links
          .filter((l: any) => l && typeof l.url === 'string' && l.url.trim().length > 0)
          .map((l: any) => ({
            url: l.url.trim(),
            title: typeof l.title === 'string' ? l.title.trim() : '',
          }));
      } else if (parsed.linkUrl && typeof parsed.linkUrl === 'string' && parsed.linkUrl.trim().length > 0) {
        links = [{ url: parsed.linkUrl.trim(), title: parsed.linkTitle || '' }];
      }

      return {
        notes: parsed.notes || '',
        linkUrl: links[0]?.url || parsed.linkUrl || '',
        linkTitle: links[0]?.title || parsed.linkTitle || '',
        links,
        fileUrl: parsed.fileUrl || '',
        fileName: parsed.fileName || '',
        fileSize: typeof parsed.fileSize === 'number' ? parsed.fileSize : undefined,
        fileType: parsed.fileType || '',
        updatedAt: parsed.updatedAt || '',
        updatedByName: parsed.updatedByName || '',
      };
    } catch {
      // Fall through to plain text parsing
    }
  }

  // Fallback: extract URL from raw string if present
  const urlMatches = desc.match(/(https?:\/\/[^\s]+)/g);
  const links: PicDeliverableLink[] = urlMatches
    ? urlMatches.map((u, i) => ({
        url: u,
        title: urlMatches.length > 1 ? `Tautan ${i + 1}` : '',
      }))
    : [];

  return {
    notes: desc,
    linkUrl: links[0]?.url || '',
    linkTitle: links[0]?.title || '',
    links,
  };
}
