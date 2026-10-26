'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, AlertCircle, Save, ExternalLink, Layers, Lock, CheckCircle2, UploadCloud, Paperclip, FileCheck, Trash2, Loader2, User, Calendar } from 'lucide-react';
import {
  actionItemSchema,
  ActionItemInput,
} from '@/lib/validations/action-item';
import {
  createActionItemAction,
  updateActionItemAction,
  getActionItemFormOptionsAction,
} from '@/app/actions/action-item-actions';
import { uploadGenericMeetingFileAction } from '@/app/actions/meeting-upload-actions';
import { ActionItem, ActionItemPriority, ActionItemStatus } from '@/lib/types';
import { isMeetingMatchTeam } from '@/lib/team-utils';
import {
  GoogleDriveIcon,
  extractDriveLink,
  cleanTextWithoutLink,
  normalizeUrl,
} from './google-drive-link-badge';
import {
  SearchableMeetingSelect,
  MeetingOption,
} from './searchable-meeting-select';
import { PicCombobox, getPicTeamDetails } from './pic-combobox';

interface ActionItemFormDialogProps {
  isOpen: boolean;
  meetingId?: string;
  currentMeeting?: any;
  lockMeeting?: boolean;
  actionItem?: ActionItem | null;
  availableMeetings?: Array<MeetingOption>;
  availableBiros?: { id: string; code: string; shortName: string; name: string }[];
  availableUsers?: Array<{
    id: string;
    name: string;
    email?: string | null;
    biroId?: string | null;
    teamId?: string | null;
    team?: { id?: string; code?: string; name?: string } | null;
    userTeams?: Array<{ role?: string | null; team: { id?: string; code?: string; name?: string } }>;
  }>;
  availableTeams?: Array<{ id: string; code: string; name: string; biroId?: string }>;
  lockedBiroCode?: string;
  lockedTeamCode?: string;
  onClose: () => void;
  onSuccess?: (item: any) => void;
}

export function ActionItemFormDialog({
  isOpen,
  meetingId,
  currentMeeting,
  lockMeeting,
  actionItem,
  availableMeetings = [],
  availableBiros = [],
  availableUsers = [],
  availableTeams = [],
  lockedBiroCode,
  lockedTeamCode,
  onClose,
  onSuccess,
}: ActionItemFormDialogProps) {
  const { data: session } = useSession();
  const effectiveLockedBiroCode =
    lockedBiroCode ||
    (session?.user?.role === 'STAFF' ? session.user.biroCode : undefined);
  const effectiveLockedTeamCode =
    lockedTeamCode ||
    (session?.user?.role === 'STAFF' ? session.user.teamCode : undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(actionItem);

  // Normalize currentMeeting into MeetingOption format
  const normalizedCurrentMeeting: MeetingOption | null = React.useMemo(() => {
    if (!currentMeeting?.id) return null;
    return {
      id: currentMeeting.id,
      meetingNumber: currentMeeting.meetingNumber || currentMeeting.id,
      title: currentMeeting.title || '',
      date: currentMeeting.date,
      primaryBiro: currentMeeting.primaryBiro,
      primaryTeamId: currentMeeting.primaryTeamId || currentMeeting.primaryTeam?.id,
      chairpersonId: currentMeeting.chairpersonId || currentMeeting.chairperson?.id,
      picName: currentMeeting.picName,
    } as any;
  }, [
    currentMeeting?.id,
    currentMeeting?.meetingNumber,
    currentMeeting?.title,
    currentMeeting?.date,
    currentMeeting?.primaryTeamId,
    currentMeeting?.primaryTeam?.id,
    currentMeeting?.chairpersonId,
    currentMeeting?.chairperson?.id,
    currentMeeting?.picName,
  ]);

  // Is meeting selection locked? (e.g. from a meeting page/dialog, editing item, or explicitly locked)
  const isMeetingLocked = Boolean(
    lockMeeting ||
    meetingId ||
    actionItem?.meetingId ||
    normalizedCurrentMeeting
  );

  // Resilient biros, users, teams & meetings state with auto-fetch
  const [birosList, setBirosList] = useState(availableBiros);
  const [usersList, setUsersList] = useState(availableUsers);
  const [teamsList, setTeamsList] = useState<Array<{ id: string; biroId?: string; code: string; name: string; description?: string | null }>>(availableTeams as any);
  const [meetingsList, setMeetingsList] = useState<Array<MeetingOption>>(availableMeetings);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    actionItem?.meetingId || meetingId || normalizedCurrentMeeting?.id || availableMeetings[0]?.id || ''
  );
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Ensure that if currentMeeting has chairperson, that user is included in users list
  const effectiveUsers = React.useMemo(() => {
    let list = [...usersList];
    const chair = currentMeeting?.chairperson;
    if (chair?.id && !list.some((u) => u.id === chair.id)) {
      list.unshift({
        id: chair.id,
        name: chair.name,
        email: chair.email,
        biroId: chair.biroId,
        teamId: chair.teamId,
      });
    }
    return list;
  }, [usersList, currentMeeting?.chairperson]);

  const isMatchTeamOption = (m: any, code: string) => {
    return isMeetingMatchTeam(m, code);
  };

  // Guaranteed unified meetings list including normalizedCurrentMeeting & scoped by team for staff
  const effectiveMeetings = React.useMemo(() => {
    let combined = meetingsList;
    if (normalizedCurrentMeeting && !meetingsList.some((m) => m.id === normalizedCurrentMeeting.id)) {
      combined = [normalizedCurrentMeeting, ...meetingsList];
    }
    if (!effectiveLockedTeamCode) return combined;
    return combined.filter((m: any) => {
      if (actionItem?.meetingId && m.id === actionItem.meetingId) return true;
      if (meetingId && m.id === meetingId) return true;
      return isMatchTeamOption(m, effectiveLockedTeamCode);
    });
  }, [normalizedCurrentMeeting, meetingsList, effectiveLockedTeamCode, actionItem?.meetingId, meetingId]);

  const findMeetingById = React.useCallback(
    (mId: string) => {
      if (!mId) return null;
      const mUpper = mId.toUpperCase();
      const inList = effectiveMeetings.find(
        (m) => m.id === mId || (m.meetingNumber && m.meetingNumber.toUpperCase() === mUpper)
      );
      if (inList) return inList;
      if (
        normalizedCurrentMeeting &&
        (normalizedCurrentMeeting.id === mId ||
          normalizedCurrentMeeting.meetingNumber?.toUpperCase() === mUpper)
      ) {
        return normalizedCurrentMeeting;
      }
      return null;
    },
    [effectiveMeetings, normalizedCurrentMeeting]
  );

  // Sync state if props change
  useEffect(() => {
    if (availableBiros.length > 0) {
      setBirosList(availableBiros);
    }
  }, [availableBiros.length]);

  useEffect(() => {
    if (availableUsers.length > 0) {
      setUsersList(availableUsers);
    }
  }, [availableUsers.length]);

  useEffect(() => {
    if (availableTeams && availableTeams.length > 0) {
      setTeamsList(availableTeams as any);
    }
  }, [availableTeams]);

  useEffect(() => {
    if (availableMeetings.length > 0) {
      setMeetingsList(availableMeetings);
    }
  }, [availableMeetings.length]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState<{
    url: string;
    name: string;
    size?: number;
  } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [picBiroId, setPicBiroId] = useState('');
  const [picTeamId, setPicTeamId] = useState('');
  const [picUserId, setPicUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<ActionItemPriority>('MEDIUM');
  const [status, setStatus] = useState<ActionItemStatus>('PENDING');

  // Tim Kerja Resmi Tindak Lanjut Sekretariat KEK (dengan fallback UUID riil database)
  const displayTeams = React.useMemo(() => {
    if (teamsList && teamsList.length > 0) {
      return teamsList;
    }
    return [
      { id: '1c2512e1-1859-42ca-874a-196848ab7acf', code: 'INV', name: 'Tim Investasi', biroId: 'db859e7e-d77e-4247-abf2-91e48a3d95bf' },
      { id: '663d7ff9-585a-4800-8840-389a5e322779', code: 'KS', name: 'Tim Kerja Sama', biroId: 'db859e7e-d77e-4247-abf2-91e48a3d95bf' },
      { id: 'a3b2e91a-566c-46e5-a740-1aa944793290', code: 'KOM', name: 'Tim Komunikasi', biroId: 'db859e7e-d77e-4247-abf2-91e48a3d95bf' },
      { id: 'c82de951-5fd8-4390-8cce-e663a13bedcc', code: 'SI', name: 'Tim Sistem Informasi', biroId: 'db859e7e-d77e-4247-abf2-91e48a3d95bf' },
      { id: 'f49c43a1-7256-436c-a1bf-68e7f3201732', code: 'HKM', name: 'Tim Hukum', biroId: 'db859e7e-d77e-4247-abf2-91e48a3d95bf' },
    ];
  }, [teamsList]);

  // Synchronize PIC and team automatically from a meeting (title is typed manually, not auto-linked)
  const applyMeetingDefaults = React.useCallback(
    (m: any, usersToSearch: any[] = effectiveUsers) => {
      if (!m) return;

      // 2. Sync team
      const num = m.meetingNumber?.toUpperCase() || '';
      let targetTeamId = m.primaryTeamId || m.primaryTeam?.id || '';
      if (!targetTeamId) {
        if (num.startsWith('INV-')) targetTeamId = displayTeams.find((t) => t.code === 'INV')?.id || '';
        else if (num.startsWith('KS-')) targetTeamId = displayTeams.find((t) => t.code === 'KS')?.id || '';
        else if (num.startsWith('KOM-')) targetTeamId = displayTeams.find((t) => t.code === 'KOM')?.id || '';
      }
      if (effectiveLockedTeamCode) {
        const teamForCode = displayTeams.find(
          (t) => t.code.toUpperCase() === effectiveLockedTeamCode.toUpperCase()
        );
        if (teamForCode) targetTeamId = teamForCode.id;
      }
      if (!targetTeamId && displayTeams.length > 0) {
        targetTeamId = displayTeams[0].id;
      }
      if (targetTeamId) {
        setPicTeamId(targetTeamId);
        const matchedT = displayTeams.find((t) => t.id === targetTeamId || t.code === targetTeamId);
        if (matchedT?.biroId) {
          setPicBiroId(matchedT.biroId);
        }
      }

      // 3. Sync PIC (User) automatically to chairperson / PIC from meeting registration
      const directChairId = m.chairpersonId || m.chairperson?.id;
      if (directChairId) {
        setPicUserId(directChairId);
      } else if (m.picName && usersToSearch.length > 0) {
        const cleanPicName = m.picName.trim().toLowerCase();
        const matchedUser =
          usersToSearch.find((u) => u.name.trim().toLowerCase() === cleanPicName) ||
          usersToSearch.find((u) => {
            const uName = u.name.trim().toLowerCase();
            return uName.includes(cleanPicName) || cleanPicName.includes(uName);
          });
        if (matchedUser) {
          setPicUserId(matchedUser.id);
        }
      }
    },
    [effectiveLockedTeamCode, displayTeams, effectiveUsers]
  );

  // Auto-fetch biros, users, teams & meetings when dialog opens if lists are empty
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingOptions(true);
    getActionItemFormOptionsAction()
      .then((res: any) => {
        if (!isMounted || !res?.success) return;
        if (res.biros && res.biros.length > 0) {
          setBirosList(res.biros);
        }
        if (res.users && res.users.length > 0) {
          setUsersList(res.users);
        }
        if (res.teams && res.teams.length > 0) {
          setTeamsList(res.teams);
        }
        if (res.meetings && res.meetings.length > 0) {
          setMeetingsList(res.meetings);
        }

        if (!actionItem) {
          const currentTargetId =
            selectedMeetingId || meetingId || normalizedCurrentMeeting?.id || res.meetings?.[0]?.id;
          const m =
            (res.meetings || []).find((x: any) => x.id === currentTargetId) ||
            normalizedCurrentMeeting;
          if (m) {
            applyMeetingDefaults(m, res.users || []);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingOptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Form fields reset & initialization (only runs when dialog opens or editing item changes)
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    setFieldErrors({});

    if (actionItem) {
      let dueStr = '';
      if (actionItem.dueDate) {
        const due = new Date(actionItem.dueDate);
        if (!isNaN(due.getTime())) {
          const yyyy = due.getFullYear();
          const mm = String(due.getMonth() + 1).padStart(2, '0');
          const dd = String(due.getDate()).padStart(2, '0');
          dueStr = `${yyyy}-${mm}-${dd}`;
        }
      }
      if (!dueStr) {
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const yyyy = nextWeek.getFullYear();
        const mm = String(nextWeek.getMonth() + 1).padStart(2, '0');
        const dd = String(nextWeek.getDate()).padStart(2, '0');
        dueStr = `${yyyy}-${mm}-${dd}`;
      }
      setDueDate(dueStr);

      setSelectedMeetingId(actionItem.meetingId || meetingId || normalizedCurrentMeeting?.id || '');
      setTitle(actionItem.title || '');
      const rawDesc = actionItem.description || '';
      const docMatch = rawDesc.match(/📎 (?:Dokumen Acuan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/);
      if (docMatch) {
        setUploadedDoc({ name: docMatch[1], url: docMatch[2] });
      } else {
        setUploadedDoc(null);
      }
      const driveMatch = rawDesc.match(/📎 (?:Drive Acuan|Google Drive Acuan|Tautan Google Drive|Link Terkait):\s*(\S+)/);
      if (driveMatch) {
        setDriveLink(normalizeUrl(driveMatch[1]));
      } else {
        const foundDrive = extractDriveLink(rawDesc);
        if (foundDrive) {
          setDriveLink(foundDrive);
        } else {
          setDriveLink('');
        }
      }
      let cleaned = cleanTextWithoutLink(rawDesc);
      cleaned = cleaned.replace(/📎 (?:Dokumen Acuan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/g, '').trim();
      cleaned = cleaned.replace(/📎 (?:Drive Acuan|Google Drive Acuan|Drive Bukti|Bukti Pelaksanaan|Link Terkait):\s*\[?[^\]\n]+\]?\(?[^\)\n]*\)?/g, '').trim();
      cleaned = cleaned.replace(/📝 (?:Catatan Capaian|Catatan Progres):\s*[^\n]+/g, '').trim();
      setDescription(cleaned);

      setPicBiroId(actionItem.picBiroId || displayTeams[0]?.biroId || '');
      setPicTeamId(actionItem.picTeamId || displayTeams[0]?.id || '');
      setPicUserId(actionItem.picUserId || '');
      setPriority(actionItem.priority || 'MEDIUM');
      setStatus(actionItem.status || 'PENDING');
    } else {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const yyyy = nextWeek.getFullYear();
      const mm = String(nextWeek.getMonth() + 1).padStart(2, '0');
      const dd = String(nextWeek.getDate()).padStart(2, '0');

      let initialMeetingId = meetingId || normalizedCurrentMeeting?.id || '';
      if (!initialMeetingId) {
        initialMeetingId = effectiveMeetings[0]?.id || availableMeetings[0]?.id || '';
      }
      setSelectedMeetingId(initialMeetingId);
      setTitle('');
      setDescription('');
      setDriveLink('');
      setUploadedDoc(null);
      setDueDate(`${yyyy}-${mm}-${dd}`);
      setPriority('MEDIUM');
      setStatus('PENDING');

      // Find initial meeting and automatically set PIC and Team (title remains empty for manual input)
      const currMeeting =
        findMeetingById(initialMeetingId) ||
        normalizedCurrentMeeting ||
        effectiveMeetings[0] ||
        availableMeetings[0];

      if (currMeeting) {
        applyMeetingDefaults(currMeeting, effectiveUsers);
      } else {
        setPicUserId('');
      }
    }
  }, [isOpen, actionItem?.id, meetingId]);

  // Ensure selected meeting is always from the scoped list when form opens
  useEffect(() => {
    if (!isOpen || isMeetingLocked || isEditing) return;
    if (effectiveMeetings.length > 0) {
      if (!selectedMeetingId || !effectiveMeetings.some((m) => m.id === selectedMeetingId)) {
        const firstM = effectiveMeetings[0];
        setSelectedMeetingId(firstM.id);
        applyMeetingDefaults(firstM, effectiveUsers);
      }
    }
  }, [isOpen, isMeetingLocked, isEditing, effectiveMeetings, selectedMeetingId, applyMeetingDefaults, effectiveUsers]);

  const currentMeetingObj = React.useMemo(() => {
    const targetMId = selectedMeetingId || meetingId || normalizedCurrentMeeting?.id;
    return findMeetingById(targetMId || '') || normalizedCurrentMeeting;
  }, [findMeetingById, selectedMeetingId, meetingId, normalizedCurrentMeeting]);

  const activeTitle = title || currentMeetingObj?.title || normalizedCurrentMeeting?.title || '';

  // Handle document upload for action item
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDoc(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'tindak-lanjut');
      const res = await uploadGenericMeetingFileAction(fd);
      if (res.success && res.data) {
        setUploadedDoc({
          url: res.data.url,
          name: res.data.name,
          size: res.data.size,
        });
      }
    } catch (err: any) {
      console.warn('Upload error:', err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    let finalDescription = description.trim();
    if (uploadedDoc) {
      finalDescription = finalDescription
        ? `${finalDescription}\n\n📎 Dokumen Terkait: [${uploadedDoc.name}](${uploadedDoc.url})`
        : `📎 Dokumen Terkait: [${uploadedDoc.name}](${uploadedDoc.url})`;
    }
    if (driveLink.trim()) {
      const formattedLink = normalizeUrl(driveLink);
      finalDescription = finalDescription
        ? `${finalDescription}\n\n📎 Link Terkait: ${formattedLink}`
        : `📎 Link Terkait: ${formattedLink}`;
    }

    const finalMeetingId = selectedMeetingId || meetingId || normalizedCurrentMeeting?.id;
    if (!finalMeetingId) {
      setFieldErrors((prev) => ({
        ...prev,
        meetingId: 'Silakan pilih agenda kegiatan yang relevan dengan tindak lanjut ini.',
      }));
      setErrorMessage('Agenda kegiatan sumber tindak lanjut wajib dipilih.');
      return;
    }

    const currentM = findMeetingById(finalMeetingId) || normalizedCurrentMeeting;
    const selectedUser = effectiveUsers.find((u) => u.id === picUserId);

    // Auto resolve team & biro (tidak lagi wajib diisi manual di form oleh pengguna)
    const userTeamDetails = selectedUser ? getPicTeamDetails(selectedUser, displayTeams) : null;
    let finalPicTeamId =
      picTeamId ||
      userTeamDetails?.id ||
      selectedUser?.teamId ||
      (currentM as any)?.primaryTeamId ||
      (currentM as any)?.primaryTeam?.id ||
      '';

    if (!finalPicTeamId && effectiveLockedTeamCode) {
      finalPicTeamId =
        displayTeams.find((t) => t.code.toUpperCase() === effectiveLockedTeamCode.toUpperCase())?.id || '';
    }
    if (!finalPicTeamId && displayTeams.length > 0) {
      finalPicTeamId = displayTeams[0].id;
    }

    const selectedTeamObj = displayTeams.find((t) => t.id === finalPicTeamId || t.code === finalPicTeamId);
    const finalPicBiroId =
      selectedUser?.biroId ||
      selectedTeamObj?.biroId ||
      picBiroId ||
      (currentM as any)?.primaryBiroId ||
      (currentM as any)?.primaryBiro?.id ||
      (normalizedCurrentMeeting as any)?.primaryBiroId ||
      (normalizedCurrentMeeting as any)?.primaryBiro?.id ||
      (effectiveLockedBiroCode
        ? birosList.find((b) => b.code.toUpperCase() === effectiveLockedBiroCode.toUpperCase())?.id
        : '') ||
      (birosList.find((b) => b.code.toUpperCase() === 'IKK')?.id) ||
      '';

    const finalTitle = title.trim().slice(0, 255);
    if (!finalTitle) {
      setFieldErrors((prev) => ({
        ...prev,
        title: 'Nama tindak lanjut wajib diisi.',
      }));
      setErrorMessage('Nama tindak lanjut wajib diisi.');
      return;
    }

    let finalDueDate = dueDate;
    if (!finalDueDate) {
      setFieldErrors((prev) => ({
        ...prev,
        dueDate: 'Tindak lanjut wajib diisi.',
      }));
      setErrorMessage('Tindak lanjut wajib diisi.');
      return;
    }

    // Zod client validation
    const rawData = {
      meetingId: finalMeetingId,
      title: finalTitle,
      description: finalDescription || null,
      picBiroId: finalPicBiroId,
      picTeamId: finalPicTeamId,
      picUserId: picUserId && picUserId.trim() !== '' ? picUserId : null,
      dueDate: finalDueDate,
      priority,
      status,
    };

    const parsed = actionItemSchema.safeParse(rawData);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = String(issue.path[0]);
        errs[fieldName] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: ActionItemInput = parsed.data;

      let res;
      if (isEditing && actionItem) {
        res = await updateActionItemAction({
          ...payload,
          id: actionItem.id,
        });
      } else {
        res = await createActionItemAction(payload);
      }

      if (res.success) {
        onClose();
        if (onSuccess) onSuccess(res.data);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan tindak lanjut.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold text-[#31889C] uppercase tracking-wider">
              {isEditing ? 'Perbarui Matriks' : 'Matriks Tindak Lanjut'}
            </span>
            <h2 className="text-[18px] font-bold text-slate-900">
              {isEditing ? 'Ubah Tindak Lanjut' : 'Tambah Tindak Lanjut'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 text-[13px]">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 text-[12px]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Nama Tindak Lanjut */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-800 flex items-center gap-1.5 text-[13px]">
                  <Layers className="w-4 h-4 text-[#31889C]" />
                  <span>1. Nama Tindak Lanjut</span>
                  <span className="text-red-500">*</span>
                </label>
                {(() => {
                  const targetMId = selectedMeetingId || meetingId || normalizedCurrentMeeting?.id;
                  const currM = effectiveMeetings.find(
                    (m) =>
                      m.id === targetMId ||
                      (m.meetingNumber && m.meetingNumber.toUpperCase() === targetMId?.toUpperCase())
                  ) || normalizedCurrentMeeting;
                  return currM ? (
                    <span className="text-[11px] font-semibold text-[#215865] bg-[#E8F5F7] px-2 py-0.5 rounded-full border border-[#BCE3EB]">
                      {currM.meetingNumber}
                    </span>
                  ) : null;
                })()}
              </div>

              {!isMeetingLocked && (
                <div className="mb-2.5">
                  <SearchableMeetingSelect
                    meetings={effectiveMeetings}
                    selectedMeetingId={selectedMeetingId || meetingId || normalizedCurrentMeeting?.id || ''}
                    onSelectMeeting={(mId) => {
                      setSelectedMeetingId(mId);
                      if (fieldErrors.meetingId) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.meetingId;
                          return next;
                        });
                      }
                      const selM = findMeetingById(mId);
                      if (selM) {
                        applyMeetingDefaults(selM, effectiveUsers);
                      }
                    }}
                    userBiroCode={effectiveLockedBiroCode}
                    userTeamCode={effectiveLockedTeamCode || undefined}
                    isLocked={false}
                    disabled={false}
                    isLoading={isLoadingOptions}
                    error={fieldErrors.meetingId}
                  />
                  {effectiveLockedTeamCode ? (
                    <p className="mt-1.5 text-[11px] text-[#215865] flex items-center gap-1.5 font-medium bg-[#E8F5F7]/80 px-2.5 py-1.5 rounded-lg border border-[#BCE3EB]/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                      <span>Daftar kegiatan disesuaikan untuk agenda penugasan {displayTeams.find((t) => t.code === effectiveLockedTeamCode)?.name || `Tim ${effectiveLockedTeamCode}`}.</span>
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Pilih agenda kegiatan yang menjadi sumber tindak lanjut ini.
                    </p>
                  )}
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.title;
                        return next;
                      });
                    }
                  }}
                  placeholder="Masukkan nama tindak lanjut..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] transition-all ${fieldErrors.title ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'
                    }`}
                  required
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-[11px] text-red-600 font-semibold">{fieldErrors.title}</p>
                )}
              </div>
            </div>

            {/* 2. PIC */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#31889C]" />
                  <span>2. PIC</span>
                </span>
                {picUserId && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-[#1E6B7B] font-bold bg-[#E8F5F7] px-2 py-0.5 rounded-full border border-[#BCE3EB]">
                    <CheckCircle2 className="w-3 h-3 text-[#31889C]" />
                    <span>PIC Terpilih</span>
                  </span>
                )}
              </label>
              <PicCombobox
                value={picUserId}
                onChange={(val) => {
                  setPicUserId(val);
                  const u = effectiveUsers.find((x) => x.id === val);
                  if (u) {
                    const tDetails = getPicTeamDetails(u, displayTeams);
                    if (tDetails?.id) {
                      setPicTeamId(tDetails.id);
                    } else if (u.teamId) {
                      setPicTeamId(u.teamId);
                    }
                    if (u.biroId) {
                      setPicBiroId(u.biroId);
                    }
                  }
                }}
                users={effectiveUsers}
                teams={displayTeams}
                biros={birosList}
                selectedBiroId={
                  picBiroId ||
                  displayTeams.find((t) => t.id === picTeamId)?.biroId ||
                  (effectiveLockedBiroCode
                    ? birosList.find((b) => b.code.toUpperCase() === effectiveLockedBiroCode.toUpperCase())?.id
                    : '') ||
                  'BIRO-IKK'
                }
                disabled={isLoadingOptions}
                placeholder="Pilih Pejabat / PIC Pelaksana..."
              />
            </div>

            {/* 3. Dokumen terkait */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 text-[13px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#31889C]" />
                  <span>3. Dokumen terkait</span>
                </span>
              </label>
              {uploadedDoc ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50/70">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {uploadedDoc.name}
                    </span>
                    {uploadedDoc.size ? (
                      <span className="text-[11px] text-slate-400 shrink-0">
                        ({(uploadedDoc.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedDoc(null)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer shrink-0"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="relative border border-dashed border-slate-300 hover:border-[#31889C] rounded-lg p-3 text-center transition-all bg-slate-50/50 hover:bg-[#F0F8FA]/30">
                  <input
                    type="file"
                    id="action-item-doc-upload"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleDocUpload}
                    disabled={isUploadingDoc}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-600 pointer-events-none">
                    {isUploadingDoc ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#31889C]" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-[#31889C]" />
                    )}
                    <span>{isUploadingDoc ? 'Mengunggah Berkas...' : 'Klik atau seret dokumen terkait di sini (PDF, Word, Excel, Paparan)'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Link terkait */}
            <div>
              <label className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <GoogleDriveIcon className="w-3.5 h-3.5" />
                <span>4. Link terkait</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/... atau https://docs.google.com/..."
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] text-slate-800 text-[13px] font-mono"
                />
                <div className="absolute left-3 top-2.5 pointer-events-none">
                  <GoogleDriveIcon className="w-4 h-4" />
                </div>
              </div>
              {driveLink.trim() && (
                <div className="mt-2 flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#E8F5F7] border border-[#BCE3EB]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <GoogleDriveIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11.5px] text-[#215865] truncate font-mono">
                      {normalizeUrl(driveLink)}
                    </span>
                  </div>
                  <a
                    href={normalizeUrl(driveLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#31889C] hover:bg-[#266F80] text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
                    title="Klik untuk langsung membuka dan menguji tautan"
                  >
                    <span>Buka Tautan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* 5. Catatan */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 text-[13px]">
                5. Catatan
              </label>
              <textarea
                rows={3}
                placeholder="Catatan arahan tindak lanjut, koordinasi, atau rincian pekerjaan yang perlu diselesaikan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] text-slate-800 text-[13px]"
              />
            </div>

            {/* Atur Tanggal Tindak Lanjut & Status Tindak Lanjut */}
            <div className={isEditing ? "grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100" : "pt-2 border-t border-slate-100"}>
              {/* Atur Tanggal Tindak Lanjut */}
              <div className={!isEditing ? "sm:w-1/2" : ""}>
                <label className="block font-bold text-slate-800 mb-1 text-[13px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#31889C]" />
                    <span>Atur Tanggal Tindak Lanjut</span>
                    <span className="text-red-500">*</span>
                  </span>
                  <span className="text-slate-400 font-normal text-xs"></span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (fieldErrors.dueDate) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.dueDate;
                        return next;
                      });
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] transition-all cursor-pointer ${fieldErrors.dueDate ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white'
                    }`}
                  required
                />
                {fieldErrors.dueDate && (
                  <p className="mt-1 text-[11px] text-red-600 font-semibold">{fieldErrors.dueDate}</p>
                )}
              </div>

              {/* Status Tindak Lanjut (Hanya tampil saat Edit) */}
              {isEditing && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1 text-[13px]">
                    Status Tindak Lanjut
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ActionItemStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
                  >
                    <option value="PENDING">Belum Dimulai</option>
                    <option value="IN_PROGRESS">Dalam Proses</option>
                    <option value="COMPLETED">Selesai</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Tindak Lanjut'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
