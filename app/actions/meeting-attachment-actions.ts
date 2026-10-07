'use server';

import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/authorization';
import { revalidatePath } from 'next/cache';

export interface MeetingAttachmentItem {
  id: string;
  meetingId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  category: string;
  createdAt: string | Date;
  isInvitation?: boolean;
}

/**
 * Server Action: Upload a meeting material/attachment file
 * Accessible to both ADMIN and STAFF for follow-ups and meeting presentations.
 */
export async function uploadMeetingAttachmentAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  data?: MeetingAttachmentItem;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak valid. Silakan login terlebih dahulu.' };
    }

    const file = formData.get('file') as File | null;
    const meetingId = (formData.get('meetingId') as string)?.trim();
    const category = ((formData.get('category') as string) || 'BAHAN_RAPAT').trim();

    if (!meetingId) {
      return { success: false, error: 'ID Rapat tidak ditemukan.' };
    }

    if (!file) {
      return { success: false, error: 'Tidak ada berkas yang dipilih.' };
    }

    // Maximum file size: 35MB
    const MAX_SIZE = 35 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: 'Ukuran berkas melebihi batas maksimum 35MB. Silakan kompresi berkas terlebih dahulu.',
      };
    }

    const originalName = file.name || 'berkas_rapat';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    const allowedExtensions = [
      'pdf',
      'pptx',
      'ppt',
      'docx',
      'doc',
      'xlsx',
      'xls',
      'csv',
      'txt',
      'png',
      'jpg',
      'jpeg',
      'webp',
      'svg',
    ];

    if (!allowedExtensions.includes(ext)) {
      return {
        success: false,
        error:
          'Format berkas tidak didukung. Harap unggah PDF, Presentasi PPTX/PPT, Dokumen Word, Spreadsheet Excel, Gambar (PNG/JPG), atau Teks.',
      };
    }

    // Save to public/uploads/materials/<meetingId>/
    const sanitizedMeetingId = meetingId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'materials', sanitizedMeetingId);
    await fs.mkdir(uploadDir, { recursive: true });

    const baseName = path
      .basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 45);

    const uniqueId = `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const storedFileName = `${baseName}_${Date.now()}.${ext}`;
    const destinationPath = path.join(uploadDir, storedFileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destinationPath, buffer);

    const fileUrl = `/uploads/materials/${sanitizedMeetingId}/${storedFileName}`;
    const uploaderName = currentUser.name || currentUser.email || 'Staff Notulis';

    // Insert into lampiran_rapat in Neon PostgreSQL safely with raw query
    await prisma.$executeRawUnsafe(
      `INSERT INTO lampiran_rapat (id_lampiran, id_rapat, nama_berkas, url_berkas, ukuran_berkas, tipe_berkas, nama_pengunggah, kategori, dibuat_pada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      uniqueId,
      meetingId,
      originalName,
      fileUrl,
      file.size,
      file.type || `application/${ext}`,
      uploaderName,
      category
    );

    const newAttachment: MeetingAttachmentItem = {
      id: uniqueId,
      meetingId,
      fileName: originalName,
      fileUrl,
      fileSize: file.size,
      fileType: file.type || `application/${ext}`,
      uploadedBy: uploaderName,
      category,
      createdAt: new Date().toISOString(),
      isInvitation: false,
    };

    try {
      revalidatePath(`/semua-rapat/${meetingId}`);
      revalidatePath(`/semua-rapat`);
      revalidatePath('/');
    } catch {}

    return {
      success: true,
      data: newAttachment,
    };
  } catch (error: any) {
    console.error('Error uploading meeting attachment:', error);
    return {
      success: false,
      error: error?.message || 'Gagal mengunggah berkas lampiran rapat.',
    };
  }
}

/**
 * Server Action: Fetch all attachments for a meeting
 * Includes both uploaded materials from lampiran_rapat and official invitation letter
 */
export async function getMeetingAttachmentsAction(meetingId: string): Promise<{
  success: boolean;
  error?: string;
  data: MeetingAttachmentItem[];
}> {
  try {
    const rawRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT 
        id_lampiran AS "id", 
        id_rapat AS "meetingId", 
        nama_berkas AS "fileName", 
        url_berkas AS "fileUrl", 
        ukuran_berkas AS "fileSize", 
        tipe_berkas AS "fileType", 
        nama_pengunggah AS "uploadedBy", 
        kategori AS "category", 
        dibuat_pada AS "createdAt"
       FROM lampiran_rapat 
       WHERE id_rapat = $1 
       ORDER BY dibuat_pada ASC`,
      meetingId
    );

    const attachments: MeetingAttachmentItem[] = (rawRows || []).map((row) => ({
      id: String(row.id),
      meetingId: String(row.meetingId),
      fileName: String(row.fileName),
      fileUrl: String(row.fileUrl),
      fileSize: Number(row.fileSize || 0),
      fileType: String(row.fileType || 'application/octet-stream'),
      uploadedBy: String(row.uploadedBy || 'Pengguna'),
      category: String(row.category || 'BAHAN_RAPAT'),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      isInvitation: false,
    }));

    // Check if meeting has an invitation document
    const meetingRow: any[] = await prisma.$queryRawUnsafe(
      `SELECT dokumen_undangan_url, nama_dokumen_undangan, ukuran_dokumen_undangan, dibuat_pada 
       FROM rapat 
       WHERE id_rapat = $1`,
      meetingId
    );

    if (meetingRow && meetingRow.length > 0 && meetingRow[0].dokumen_undangan_url) {
      const inv = meetingRow[0];
      attachments.unshift({
        id: 'INVITATION_DOC',
        meetingId,
        fileName: inv.nama_dokumen_undangan || 'Surat Undangan Resmi.pdf',
        fileUrl: inv.dokumen_undangan_url,
        fileSize: Number(inv.ukuran_dokumen_undangan || 0),
        fileType: 'application/pdf',
        uploadedBy: 'Sekretariat Jenderal',
        category: 'SURAT_UNDANGAN',
        createdAt: inv.dibuat_pada ? new Date(inv.dibuat_pada).toISOString() : new Date().toISOString(),
        isInvitation: true,
      });
    }

    return {
      success: true,
      data: attachments,
    };
  } catch (error: any) {
    console.error('Error fetching meeting attachments:', error);
    return {
      success: false,
      error: error?.message || 'Gagal memuat berkas lampiran rapat.',
      data: [],
    };
  }
}

/**
 * Server Action: Delete an attachment file
 * Permitted for both Admin and Staff to manage meeting materials.
 */
export async function deleteMeetingAttachmentAction(
  attachmentId: string,
  meetingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Sesi tidak valid. Silakan login terlebih dahulu.' };
    }

    if (attachmentId === 'INVITATION_DOC') {
      // Clear invitation document from rapat table
      await prisma.$executeRawUnsafe(
        `UPDATE rapat 
         SET dokumen_undangan_url = NULL, nama_dokumen_undangan = NULL, ukuran_dokumen_undangan = NULL 
         WHERE id_rapat = $1`,
        meetingId
      );
    } else {
      // Find file URL to unlink
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT url_berkas FROM lampiran_rapat WHERE id_lampiran = $1`,
        attachmentId
      );

      if (rows && rows.length > 0) {
        const fileUrl = rows[0].url_berkas;
        if (fileUrl && fileUrl.startsWith('/uploads/materials/')) {
          try {
            const diskPath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
            await fs.unlink(diskPath);
          } catch (unlinkErr) {
            console.warn('Could not delete file from disk:', unlinkErr);
          }
        }
      }

      await prisma.$executeRawUnsafe(
        `DELETE FROM lampiran_rapat WHERE id_lampiran = $1`,
        attachmentId
      );
    }

    try {
      revalidatePath(`/semua-rapat/${meetingId}`);
      revalidatePath(`/semua-rapat`);
      revalidatePath('/');
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting meeting attachment:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menghapus berkas lampiran rapat.',
    };
  }
}
