/**
 * Utility functions for matching meetings with Biro and Tim Kerja
 */

export interface MatchableMeeting {
  id?: string;
  code?: string | null;
  meetingNumber?: string | null;
  primaryTeamCode?: string | null;
  primaryTeamId?: string | null;
  primaryTeamName?: string | null;
  primaryTeam?: { id?: string; code?: string; name?: string } | null;
  title?: string | null;
}

/**
 * Checks if a meeting belongs to a specific team code (e.g. 'INV', 'KS', 'KOM', 'SI', 'HKM', 'POKJA', or 'ALL')
 */
export function isMeetingMatchTeam(
  meeting: MatchableMeeting,
  teamCode: string
): boolean {
  if (!teamCode) return true;
  const c = teamCode.toUpperCase().trim();
  if (c === 'ALL' || c === 'IKK' || c === 'BIRO-IKK') return true;

  // 1. Direct match on primary team code
  const pCode = (
    meeting.primaryTeamCode ||
    meeting.primaryTeam?.code ||
    ''
  ).toUpperCase().trim();

  if (pCode === c) return true;
  if (c === 'HKM' && (pCode === 'HUKUM' || pCode === 'HKM')) return true;
  if (c === 'HUKUM' && (pCode === 'HKM' || pCode === 'HUKUM')) return true;

  // 2. Direct match on meeting number prefix (e.g. INV-001, KS-002, KOM-001, SI-001, HUKUM-001, HKM-001, POKJA-001)
  const mCode = (meeting.code || meeting.meetingNumber || '').toUpperCase().trim();
  if (mCode.startsWith(`${c}-`)) return true;
  if ((c === 'HKM' || c === 'HUKUM') && (mCode.startsWith('HUKUM-') || mCode.startsWith('HKM-'))) return true;

  // 3. Exact matching on teamId if code passed was an ID
  const pId = (meeting.primaryTeamId || meeting.primaryTeam?.id || '').trim();
  if (pId && pId.toUpperCase() === c) return true;

  // 4. Semantic match by team name (SAFE: matching specific whole keywords, never broad 2-letter substring includes!)
  const pName = (meeting.primaryTeamName || meeting.primaryTeam?.name || '').toLowerCase();
  if (c === 'INV' && (pName.includes('investasi') || pId === 'TIM-001')) return true;
  if (c === 'KS' && (pName.includes('kerja sama') || pName.includes('kerjasama') || pId === 'TIM-003')) return true;
  if (c === 'KOM' && (pName.includes('komunikasi') || pId === 'TIM-002')) return true;
  if (c === 'SI' && (pName.includes('sistem informasi') || pId === 'TIM-004')) return true;
  if ((c === 'HKM' || c === 'HUKUM') && (pName.includes('hukum') || pId === 'TIM-005')) return true;
  if (c === 'POKJA' && pName.includes('pokja')) return true;

  return false;
}
