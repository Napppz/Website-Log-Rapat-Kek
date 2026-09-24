/**
 * Tiptap JSON and HTML to Structured PDF Blocks Parser
 * Converts rich text (Tiptap JSON AST or HTML strings) into structured
 * format suitable for deterministic PDF rendering.
 */

export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export type ParsedBlock =
  | { type: 'heading'; level: number; segments: TextSegment[] }
  | { type: 'paragraph'; segments: TextSegment[] }
  | { type: 'bullet'; level: number; segments: TextSegment[] }
  | { type: 'ordered'; number: number; level: number; segments: TextSegment[] }
  | { type: 'blockquote'; segments: TextSegment[] };

function extractSegmentsFromNode(node: any): TextSegment[] {
  if (!node) return [];

  if (node.type === 'text') {
    const text = node.text || '';
    if (!text) return [];

    const marks: string[] = (node.marks || []).map((m: any) => m.type || '');
    return [
      {
        text,
        bold: marks.includes('bold'),
        italic: marks.includes('italic'),
        underline: marks.includes('underline'),
      },
    ];
  }

  if (Array.isArray(node.content)) {
    return node.content.flatMap((child: any) => extractSegmentsFromNode(child));
  }

  return [];
}

function parseTiptapJson(doc: any): ParsedBlock[] {
  if (!doc || !Array.isArray(doc.content)) return [];

  const blocks: ParsedBlock[] = [];

  for (const item of doc.content) {
    if (!item) continue;

    if (item.type === 'heading') {
      const level = item.attrs?.level || 1;
      const segments = extractSegmentsFromNode(item);
      if (segments.length > 0) {
        blocks.push({ type: 'heading', level, segments });
      }
    } else if (item.type === 'paragraph') {
      const segments = extractSegmentsFromNode(item);
      // Even empty paragraphs or with text
      if (segments.length > 0) {
        blocks.push({ type: 'paragraph', segments });
      }
    } else if (item.type === 'bulletList' && Array.isArray(item.content)) {
      item.content.forEach((li: any) => {
        const segments = extractSegmentsFromNode(li);
        if (segments.length > 0) {
          blocks.push({ type: 'bullet', level: 1, segments });
        }
      });
    } else if (item.type === 'orderedList' && Array.isArray(item.content)) {
      item.content.forEach((li: any, idx: number) => {
        const segments = extractSegmentsFromNode(li);
        if (segments.length > 0) {
          blocks.push({ type: 'ordered', number: idx + 1, level: 1, segments });
        }
      });
    } else if (item.type === 'blockquote') {
      const segments = extractSegmentsFromNode(item);
      if (segments.length > 0) {
        blocks.push({ type: 'blockquote', segments });
      }
    }
  }

  return blocks;
}

function parseHtmlString(html: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  if (!html || typeof html !== 'string') return blocks;

  // Split into rough block tags
  const blockRegex = /<(h[1-6]|p|li|blockquote)>([\s\S]*?)<\/\1>/gi;
  let match;
  let orderedIndex = 1;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const rawContent = match[2];

    // Helper to extract basic inline tags (strong/b, em/i, u)
    const segments: TextSegment[] = [];
    const inlineRegex = /<(strong|b|em|i|u)>([\s\S]*?)<\/\1>|([^<]+)/gi;
    let inlineMatch;

    while ((inlineMatch = inlineRegex.exec(rawContent)) !== null) {
      if (inlineMatch[3]) {
        // Plain text
        const t = inlineMatch[3].trim();
        if (t) segments.push({ text: t });
      } else if (inlineMatch[1] && inlineMatch[2]) {
        const iTag = inlineMatch[1].toLowerCase();
        const t = inlineMatch[2].replace(/<[^>]+>/g, '').trim();
        if (t) {
          segments.push({
            text: t,
            bold: iTag === 'strong' || iTag === 'b',
            italic: iTag === 'em' || iTag === 'i',
            underline: iTag === 'u',
          });
        }
      }
    }

    if (segments.length === 0) {
      const stripped = rawContent.replace(/<[^>]+>/g, '').trim();
      if (stripped) {
        segments.push({ text: stripped });
      }
    }

    if (segments.length > 0) {
      if (tag.startsWith('h')) {
        const level = parseInt(tag[1], 10) || 2;
        blocks.push({ type: 'heading', level, segments });
      } else if (tag === 'li') {
        blocks.push({ type: 'bullet', level: 1, segments });
      } else if (tag === 'blockquote') {
        blocks.push({ type: 'blockquote', segments });
      } else {
        blocks.push({ type: 'paragraph', segments });
      }
    }
  }

  // Fallback if no HTML tags matched
  if (blocks.length === 0 && html.trim()) {
    const lines = html.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const stripped = line.replace(/<[^>]+>/g, '').trim();
      if (stripped) {
        if (/^\d+\.\s+/.test(stripped)) {
          blocks.push({
            type: 'ordered',
            number: orderedIndex++,
            level: 1,
            segments: [{ text: stripped.replace(/^\d+\.\s+/, '') }],
          });
        } else if (/^[-*•]\s+/.test(stripped)) {
          blocks.push({
            type: 'bullet',
            level: 1,
            segments: [{ text: stripped.replace(/^[-*•]\s+/, '') }],
          });
        } else {
          blocks.push({ type: 'paragraph', segments: [{ text: stripped }] });
        }
      }
    }
  }

  return blocks;
}

/**
 * Universal parser: accepts JSON object, stringified JSON, HTML string, or plain text.
 */
export function parseRichText(input: any): ParsedBlock[] {
  if (!input) return [];

  // If already a Tiptap JSON object
  if (typeof input === 'object') {
    if (input.type === 'doc') {
      return parseTiptapJson(input);
    }
    // If wrapped in other properties
    if (input.content && Array.isArray(input.content)) {
      return parseTiptapJson(input);
    }
  }

  // If input is string
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];

    // Try parsing as JSON first
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type === 'doc' || Array.isArray(parsed.content)) {
          return parseTiptapJson(parsed);
        }
      } catch {
        // Not valid JSON, continue to HTML/plain text parser
      }
    }

    return parseHtmlString(trimmed);
  }

  return [];
}
