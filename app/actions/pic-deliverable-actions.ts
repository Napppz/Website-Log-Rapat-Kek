'use server';

import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { revalidatePath } from 'next/cache';
import {
  getNextActionItemId,
  getNextActionItemLogId,
  getNextNotificationId,
} from '@/lib/id-generator';
import { createNotificationRecord } from '@/app/actions/notification-actions';
import { ActionItemStatus, ActionItemPriority } from '@prisma/client';

import {
  PicDeliverableParsedData,
  parsePicDeliverableDescription,
} from '@/lib/pic-deliverables';

function safeRevalidateMeeting(meetingId: string) {
  try {
    revalidatePath(`/semua-rapat/${meetingId}`);
    revalidatePath(`/semua-rapat`);
    revalidatePath(`/tindak-lanjut`);
    revalidatePath(`/`);
  } catch (err) {
    console.warn('Revalidation warning:', err);
  }
}

/**
 * Server Action: Submit progress, clickable link, and physical file for a PIC deliverable
 */
export async function submitPicProgressAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak valid. Silakan login terlebih dahulu.' };
    }

    const actionItemId = (formData.get('actionItemId') as string)?.trim();
    const meetingId = (formData.get('meetingId') as string)?.trim();
    const outputType = ((formData.get('outputType') as string) || '').trim();
    const notes = ((formData.get('notes') as string) || '').trim();
    const linkUrl = ((formData.get('linkUrl') as string) || '').trim();
    const linkTitle = ((formData.get('linkTitle') as string) || '').trim();
    const rawProgress = formData.get('progress') as string;
    const rawStatus = (formData.get('status') as string)?.trim() || 'IN_PROGRESS';
    const syncToMeeting = formData.get('syncToMeeting') === 'true';
    const file = formData.get('file') as File | null;

    if (!actionItemId) {
      return { success: false, error: 'ID penugasan PIC tidak ditemukan.' };
    }

    const existing = await prisma.actionItem.findUnique({
      where: { id: actionItemId },
      include: {
        picUser: true,
        picBiro: true,
        picTeam: true,
        meeting: true,
      },
    });

    if (!existing) {
      return { success: false, error: 'Penugasan PIC tidak ditemukan di database.' };
    }

    const effectiveMeetingId = meetingId || existing.meetingId;

    // Parse existing deliverable data so we don't accidentally wipe prior file/link if not replaced
    const prevData = parsePicDeliverableDescription(existing.description);

    let uploadedFileUrl = prevData.fileUrl || '';
    let uploadedFileName = prevData.fileName || '';
    let uploadedFileSize = prevData.fileSize;
    let uploadedFileType = prevData.fileType || '';

    // Handle physical file upload if provided
    if (file && file.size > 0 && typeof file.name === 'string') {
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB
      if (file.size > MAX_SIZE) {
        return {
          success: false,
          error: 'Ukuran berkas melebihi batas 100MB. Silakan gunakan tautan Google Drive atau kompres berkas.',
        };
      }

      const originalName = file.name;
      const ext = originalName.split('.').pop()?.toLowerCase() || 'dat';
      const sanitizedMeetingId = effectiveMeetingId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'materials',
        sanitizedMeetingId
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const baseName = path
        .basename(originalName, path.extname(originalName))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 45);

      const uniqueId = `ATT-PIC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const storedFileName = `${baseName}_${Date.now()}.${ext}`;
      const destinationPath = path.join(uploadDir, storedFileName);

      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(destinationPath, Buffer.from(arrayBuffer));

      uploadedFileUrl = `/uploads/materials/${sanitizedMeetingId}/${storedFileName}`;
      uploadedFileName = originalName;
      uploadedFileSize = file.size;
      uploadedFileType = file.type || `application/${ext}`;

      // Also record into lampiran_rapat table for full tracking
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO lampiran_rapat (id_lampiran, id_rapat, nama_berkas, url_berkas, ukuran_berkas, tipe_berkas, nama_pengunggah, kategori, dibuat_pada)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          uniqueId,
          effectiveMeetingId,
          originalName,
          uploadedFileUrl,
          file.size,
          uploadedFileType,
          currentUser.name || 'PIC Terkait',
          'OUTPUT_PIC'
        );
      } catch (attErr) {
        console.warn('Could not insert raw lampiran_rapat (non-fatal):', attErr);
      }
    }

    // Determine Status & Progress (Belum Dimulai, Dalam Proses, Selesai)
    let statusEnum: ActionItemStatus = ActionItemStatus.IN_PROGRESS;
    if (rawStatus === 'COMPLETED' || rawStatus === 'Selesai') {
      statusEnum = ActionItemStatus.COMPLETED;
    } else if (rawStatus === 'PENDING' || rawStatus === 'Belum Dimulai' || rawStatus === 'BELUM_DIMULAI') {
      statusEnum = ActionItemStatus.PENDING;
    } else {
      statusEnum = ActionItemStatus.IN_PROGRESS;
    }

    let progressNum = parseInt(rawProgress || '0', 10);
    if (isNaN(progressNum)) {
      progressNum = statusEnum === ActionItemStatus.COMPLETED ? 100 : statusEnum === ActionItemStatus.PENDING ? 0 : 50;
    }
    if (statusEnum === ActionItemStatus.COMPLETED && progressNum < 100) {
      progressNum = 100;
    }
    if (statusEnum === ActionItemStatus.PENDING) {
      progressNum = 0;
    }

    // Parse multiple links if provided as linksJson
    const linksJsonRaw = (formData.get('linksJson') as string)?.trim();
    let parsedLinks: Array<{ url: string; title?: string }> = [];
    if (linksJsonRaw) {
      try {
        const rawArr = JSON.parse(linksJsonRaw);
        if (Array.isArray(rawArr)) {
          parsedLinks = rawArr
            .filter((l: any) => l && typeof l.url === 'string' && l.url.trim().length > 0)
            .map((l: any) => ({
              url: l.url.trim(),
              title: typeof l.title === 'string' ? l.title.trim() : '',
            }));
        }
      } catch {}
    }

    if (parsedLinks.length === 0 && linkUrl) {
      parsedLinks = [{ url: linkUrl, title: linkTitle || 'Tautan Hasil Kegiatan' }];
    }

    // Build JSON description: either LINK or NOTE
    let finalNotes = '';
    let finalLinkUrl = '';
    let finalLinkTitle = '';

    if (outputType === 'LINK') {
      finalLinkUrl = parsedLinks[0]?.url || linkUrl;
      finalLinkTitle = parsedLinks[0]?.title || linkTitle || 'Tautan Hasil Kegiatan';
      finalNotes = '';
    } else if (outputType === 'NOTE') {
      finalNotes = notes;
      finalLinkUrl = '';
      finalLinkTitle = '';
      parsedLinks = [];
    } else {
      finalNotes = notes || prevData.notes || '';
      finalLinkUrl = parsedLinks[0]?.url || linkUrl || prevData.linkUrl || '';
      finalLinkTitle = parsedLinks[0]?.title || linkTitle || prevData.linkTitle || (linkUrl ? 'Tautan Hasil Kegiatan' : '');
      if (parsedLinks.length === 0 && prevData.links && prevData.links.length > 0) {
        parsedLinks = prevData.links;
      }
    }

    const updatedDescriptionObj: PicDeliverableParsedData = {
      notes: finalNotes,
      linkUrl: finalLinkUrl,
      linkTitle: finalLinkTitle,
      links: parsedLinks,
      fileUrl: uploadedFileUrl,
      fileName: uploadedFileName,
      fileSize: uploadedFileSize,
      fileType: uploadedFileType,
      updatedAt: new Date().toISOString(),
      updatedByName: currentUser.name || 'PIC',
    };

    const newDescriptionJson = JSON.stringify(updatedDescriptionObj);

    // Update ActionItem
    const updatedActionItem = await prisma.actionItem.update({
      where: { id: actionItemId },
      data: {
        status: statusEnum,
        description: newDescriptionJson,
        completedAt: statusEnum === ActionItemStatus.COMPLETED ? new Date() : null,
      },
      include: {
        picUser: true,
        picBiro: true,
        picTeam: true,
      },
    });

    // Resolve valid user ID for ActionItemLog to prevent foreign key violation
    let validUserId: string | null = null;
    if (currentUser?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { id: true },
      });
      if (dbUser) {
        validUserId = dbUser.id;
      } else if (currentUser.email) {
        const dbUserByEmail = await prisma.user.findUnique({
          where: { email: currentUser.email.toLowerCase().trim() },
          select: { id: true },
        });
        if (dbUserByEmail) {
          validUserId = dbUserByEmail.id;
        }
      }
    }
    if (!validUserId && existing.picUserId) {
      const dbPicUser = await prisma.user.findUnique({
        where: { id: existing.picUserId },
        select: { id: true },
      });
      if (dbPicUser) {
        validUserId = dbPicUser.id;
      }
    }

    // Create ActionItemLog
    const nextLogId = await getNextActionItemLogId();
    await prisma.actionItemLog.create({
      data: {
        id: nextLogId,
        actionItemId,
        userId: validUserId,
        previousStatus: existing.status,
        newStatus: statusEnum,
        notes: outputType === 'LINK'
          ? (parsedLinks.length > 1
              ? `Melampirkan ${parsedLinks.length} tautan hasil kegiatan: ${parsedLinks.map((l) => l.url).join(', ')}`
              : finalLinkUrl
              ? `Melampirkan tautan hasil: ${finalLinkUrl}`
              : 'Pembaruan tautan hasil kegiatan')
          : (finalNotes || 'Pembaruan catatan hasil kegiatan'),
        progress: progressNum,
      },
    });

    // Sync to Meeting record if requested or if it's a press release / drive link
    if (syncToMeeting && (parsedLinks.length > 0 || linkUrl)) {
      const linksToSync = parsedLinks.length > 0 ? parsedLinks : [{ url: linkUrl, title: linkTitle }];

      for (const itemLink of linksToSync) {
        if (!itemLink.url) continue;
        const isDrive = itemLink.url.includes('drive.google.com');

        // 1. Store as a MeetingAttachment so it appears in the meeting's documents
        try {
          const existingAttachment = await prisma.meetingAttachment.findFirst({
            where: {
              meetingId: effectiveMeetingId,
              fileUrl: itemLink.url,
            },
          });

          if (!existingAttachment) {
            await prisma.meetingAttachment.create({
              data: {
                meetingId: effectiveMeetingId,
                fileName:
                  itemLink.title ||
                  (isDrive ? 'Google Drive Luaran PIC' : existing.title || 'Tautan Luaran PIC'),
                fileUrl: itemLink.url,
                fileType: 'link',
                uploadedBy: currentUser.name || 'PIC',
                category: isDrive ? 'DRIVE' : 'MATERIAL',
              },
            });
          }
        } catch (attachErr) {
          console.warn('Could not create meeting attachment for link:', attachErr);
        }
      }

      // 2. Also attach physical file if uploaded
      if (uploadedFileUrl) {
        try {
          const existingFileAttachment = await prisma.meetingAttachment.findFirst({
            where: {
              meetingId: effectiveMeetingId,
              fileUrl: uploadedFileUrl,
            },
          });
          if (!existingFileAttachment) {
            await prisma.meetingAttachment.create({
              data: {
                meetingId: effectiveMeetingId,
                fileName: uploadedFileName || 'Berkas Luaran PIC',
                fileUrl: uploadedFileUrl,
                fileSize: uploadedFileSize || null,
                fileType: uploadedFileType || null,
                uploadedBy: currentUser.name || 'PIC',
                category: 'MATERIAL',
              },
            });
          }
        } catch (fileAttachErr) {
          console.warn('Could not create meeting attachment for file:', fileAttachErr);
        }
      }

      // 3. Update only valid columns on model Meeting (materialDocUrl, progressStatus)
      try {
        const meetingUpdatePayload: Record<string, any> = {};

        const effectiveUrl = finalLinkUrl || linkUrl;
        if (!existing.meeting.materialDocUrl && effectiveUrl) {
          const isDriveUrl = effectiveUrl.includes('drive.google.com');
          meetingUpdatePayload.materialDocUrl = effectiveUrl;
          meetingUpdatePayload.materialDocName =
            finalLinkTitle ||
            linkTitle ||
            (isDriveUrl ? 'Google Drive Luaran PIC' : existing.title || 'Tautan Luaran PIC');
        }

        if (existing.meeting.progressStatus === 'Belum Dimulai' || existing.meeting.progressStatus === 'Start') {
          meetingUpdatePayload.progressStatus = 'Dalam Proses';
        }

        if (Object.keys(meetingUpdatePayload).length > 0) {
          await prisma.meeting.update({
            where: { id: effectiveMeetingId },
            data: meetingUpdatePayload,
          });
        }
      } catch (meetErr) {
        console.warn('Could not update meeting progress/material status:', meetErr);
      }
    }

    // Create notification for pimpinan / creator (scoped to team)
    try {
      const effectiveTeamId = existing.picTeamId || existing.meeting?.primaryTeamId || null;
      await createNotificationRecord({
        title: `Update Output PIC: ${existing.title}`,
        message: `${currentUser.name || 'PIC'} memperbarui capaian (${progressNum}%): "${(notes || 'Progres diperbarui').slice(0, 80)}"`,
        type: 'action_item',
        link: `/semua-rapat/${effectiveMeetingId}`,
        teamId: effectiveTeamId,
        isRead: false,
      });
    } catch {}

    safeRevalidateMeeting(effectiveMeetingId);

    return {
      success: true,
      data: {
        ...updatedActionItem,
        parsedData: updatedDescriptionObj,
      },
    };
  } catch (error: any) {
    console.error('Error submitting PIC progress:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menyimpan pembaruan progres PIC.',
    };
  }
}

/**
 * Server Action: Create an additional PIC deliverable in a meeting
 */
export async function createPicDeliverableAction(input: {
  meetingId: string;
  title: string;
  picUserId?: string | null;
  picName?: string | null;
  dueDate?: string | null;
  priority?: ActionItemPriority;
  notes?: string | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
}): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak valid. Silakan login terlebih dahulu.' };
    }

    const {
      meetingId,
      title,
      picUserId,
      dueDate,
      priority = ActionItemPriority.HIGH,
      notes,
      linkUrl,
      linkTitle,
    } = input;

    if (!meetingId || !title?.trim()) {
      return { success: false, error: 'ID Kegiatan dan Judul Luaran wajib diisi.' };
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { primaryBiro: true, primaryTeam: true },
    });

    if (!meeting) {
      return { success: false, error: 'Kegiatan tidak ditemukan.' };
    }

    let targetBiroId = meeting.primaryBiroId;
    let targetTeamId = meeting.primaryTeamId;

    if (picUserId) {
      const picUser = await prisma.user.findUnique({
        where: { id: picUserId },
        select: { id: true, biroId: true, teamId: true },
      });
      if (picUser) {
        if (picUser.biroId) targetBiroId = picUser.biroId;
        if (picUser.teamId) targetTeamId = picUser.teamId;
      }
    }

    const initialDescObj: PicDeliverableParsedData = {
      notes: notes?.trim() || '',
      linkUrl: linkUrl?.trim() || '',
      linkTitle: linkTitle?.trim() || '',
      updatedAt: new Date().toISOString(),
      updatedByName: currentUser.name || 'Admin/Staff',
    };

    const nextActionId = await getNextActionItemId();
    const effectiveDueDate = dueDate ? new Date(dueDate) : meeting.date;

    const actionItem = await prisma.actionItem.create({
      data: {
        id: nextActionId,
        meetingId,
        title: title.trim(),
        description: JSON.stringify(initialDescObj),
        picBiroId: targetBiroId,
        picTeamId: targetTeamId,
        picUserId: picUserId || null,
        dueDate: effectiveDueDate,
        status: ActionItemStatus.IN_PROGRESS,
        priority: priority || ActionItemPriority.HIGH,
      },
      include: {
        picUser: true,
        picBiro: true,
        picTeam: true,
      },
    });

    // Notify assigned PIC user if present (scoped to team)
    if (picUserId && picUserId !== currentUser.id) {
      try {
        await createNotificationRecord({
          userId: picUserId,
          teamId: meeting.primaryTeamId || null,
          title: `Penugasan Output Baru: ${title}`,
          message: `Anda ditugaskan mengerjakan luaran "${title}" pada kegiatan "${meeting.title}".`,
          type: 'action_item',
          link: `/semua-rapat/${meetingId}`,
          isRead: false,
        });
      } catch {}
    }

    safeRevalidateMeeting(meetingId);

    return {
      success: true,
      data: {
        ...actionItem,
        parsedData: initialDescObj,
      },
    };
  } catch (error: any) {
    console.error('Error creating PIC deliverable:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menambahkan penugasan output PIC.',
    };
  }
}

/**
 * Server Action: Initialize PIC deliverables for all participants in a meeting
 * Useful for meetings created earlier without deliverables.
 */
export async function initializeMeetingPicDeliverablesAction(meetingId: string): Promise<{
  success: boolean;
  error?: string;
  count?: number;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak valid.' };
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        primaryBiro: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true, biroId: true, teamId: true },
            },
          },
        },
        actionItems: {
          select: { picUserId: true },
        },
      },
    });

    if (!meeting) {
      return { success: false, error: 'Kegiatan tidak ditemukan.' };
    }

    const existingPicUserIds = new Set(
      meeting.actionItems.map((a) => a.picUserId).filter(Boolean)
    );

    let createdCount = 0;

    for (const part of meeting.participants) {
      if (part.user && !existingPicUserIds.has(part.user.id)) {
        const nextId = await getNextActionItemId();
        const initialDesc: PicDeliverableParsedData = {
          notes: `Penugasan pelaporan capaian dan luaran kegiatan oleh ${part.user.name}.`,
          linkUrl: '',
          linkTitle: '',
          updatedAt: new Date().toISOString(),
          updatedByName: currentUser.name || 'Sistem',
        };

        await prisma.actionItem.create({
          data: {
            id: nextId,
            meetingId: meeting.id,
            title: `Output & Pelaporan PIC: ${part.user.name}`,
            description: JSON.stringify(initialDesc),
            picBiroId: part.user.biroId || meeting.primaryBiroId,
            picTeamId: part.user.teamId || meeting.primaryTeamId,
            picUserId: part.user.id,
            dueDate: meeting.date,
            status: ActionItemStatus.IN_PROGRESS,
            priority: ActionItemPriority.HIGH,
          },
        });

        createdCount++;
      }
    }

    safeRevalidateMeeting(meetingId);

    return {
      success: true,
      count: createdCount,
    };
  } catch (error: any) {
    console.error('Error initializing PIC deliverables:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menginisialisasi penugasan PIC.',
    };
  }
}

/**
 * Server Action: Hapus penugasan tugas PIC
 */
export async function deletePicDeliverableAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { deleteActionItemAction } = await import('@/app/actions/action-item-actions');
    const res = await deleteActionItemAction(id);
    return {
      success: res.success,
      error: res.error,
    };
  } catch (err: any) {
    console.error('Error deleting PIC deliverable:', err);
    return {
      success: false,
      error: err?.message || 'Gagal menghapus penugasan PIC.',
    };
  }
}
