import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { ReportSummaryResult } from './report-service';

export async function generateReportPdf(data: ReportSummaryResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: `Laporan Berkala - ${data.period.label}`,
          Author: 'SIM-RAPAT KEK RI',
          Subject: 'Laporan Berkala Aktivitas Rapat & Tindak Lanjut',
          Creator: 'SIM-RAPAT KEK RI',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
      const leftMargin = 40;
      const rightMargin = 40;
      const printableWidth = pageWidth - leftMargin - rightMargin; // 515.28
      const maxContentY = 770;

      const ensureSpace = (neededHeight: number) => {
        if (doc.y + neededHeight > maxContentY) {
          doc.addPage();
          drawHeaderMinimal();
        }
      };

      const drawHeaderMinimal = () => {
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#64748B')
          .text(
            'SIM-RAPAT KEK RI • LAPORAN BERKALA',
            leftMargin,
            24,
            { width: printableWidth, align: 'left' }
          );
        doc
          .strokeColor('#CBD5E1')
          .lineWidth(0.5)
          .moveTo(leftMargin, 34)
          .lineTo(leftMargin + printableWidth, 34)
          .stroke();
        doc.y = 44;
      };

      // ─────────────────────────────────────────────────────────────────────────
      // 1. KOP RESMI
      // ─────────────────────────────────────────────────────────────────────────
      const logoPath = path.join(process.cwd(), 'public', 'logo-kek.png');
      const hasLogo = fs.existsSync(logoPath);

      if (hasLogo) {
        try {
          doc.image(logoPath, leftMargin, 36, { width: 70, height: 30 });
        } catch {
          // ignore logo load error
        }
      }

      const headerTextX = hasLogo ? leftMargin + 80 : leftMargin;
      const headerTextWidth = hasLogo ? printableWidth - 80 : printableWidth;

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0F172A')
        .text('DEWAN NASIONAL KAWASAN EKONOMI KHUSUS', headerTextX, 34, {
          width: headerTextWidth,
        })
        .fontSize(9.5)
        .fillColor('#1E293B')
        .text('REPUBLIK INDONESIA', headerTextX, 48, {
          width: headerTextWidth,
        })
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#64748B')
        .text(
          'Sistem Informasi Manajemen Rapat & Tindak Lanjut (SIM-RAPAT KEK RI)',
          headerTextX,
          61,
          { width: headerTextWidth }
        );

      doc.y = 78;
      doc
        .strokeColor('#D97706')
        .lineWidth(2)
        .moveTo(leftMargin, doc.y)
        .lineTo(leftMargin + printableWidth, doc.y)
        .stroke();

      doc.y += 3;
      doc
        .strokeColor('#0F172A')
        .lineWidth(0.5)
        .moveTo(leftMargin, doc.y)
        .lineTo(leftMargin + printableWidth, doc.y)
        .stroke();

      doc.y += 10;

      // ─────────────────────────────────────────────────────────────────────────
      // 2. JUDUL DOKUMEN & METADATA PERIODE
      // ─────────────────────────────────────────────────────────────────────────
      const titleBoxY = doc.y;
      doc
        .rect(leftMargin, titleBoxY, printableWidth, 48)
        .fillColor('#F8FAFC')
        .fill()
        .rect(leftMargin, titleBoxY, printableWidth, 48)
        .strokeColor('#CBD5E1')
        .lineWidth(1)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0F172A')
        .text('LAPORAN BERKALA AKTIVITAS RAPAT & TINDAK LANJUT', leftMargin, titleBoxY + 8, {
          width: printableWidth,
          align: 'center',
        });

      const biroText =
        data.biro === 'ALL'
          ? 'Semua Biro'
          : `Biro: ${data.biro}`;

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#475569')
        .text(`Periode: ${data.period.label}   |   Filter: ${biroText}`, leftMargin, titleBoxY + 28, {
          width: printableWidth,
          align: 'center',
        });

      doc.y = titleBoxY + 56;

      // ─────────────────────────────────────────────────────────────────────────
      // 3. RINGKASAN KPI UTAMA (9 KPI CARDS)
      // ─────────────────────────────────────────────────────────────────────────
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0F172A')
        .text('RINGKASAN KPI UTAMA', leftMargin, doc.y);

      doc.y += 6;

      const kpis = [
        { label: 'Total Rapat', val: String(data.kpi.totalMeetings), color: '#2563EB' },
        { label: 'Total Tindak Lanjut', val: String(data.kpi.totalActionItems), color: '#4F46E5' },
        { label: 'Completion Rate', val: `${data.kpi.completionRate}%`, color: '#059669' },
        { label: 'Selesai (Completed)', val: String(data.kpi.completedActionItems), color: '#16A34A' },
        { label: 'Berjalan (In Progress)', val: String(data.kpi.inProgressActionItems), color: '#D97706' },
        { label: 'Menunggu (Pending)', val: String(data.kpi.pendingActionItems), color: '#475569' },
        { label: 'Terlambat (Overdue)', val: String(data.kpi.overdueActionItems), color: '#DC2626' },
        { label: 'Rapat Ada Notulen', val: String(data.kpi.meetingsWithMinutes), color: '#0284C7' },
        { label: 'Rapat Tanpa Notulen', val: String(data.kpi.meetingsWithoutMinutes), color: '#9333EA' },
      ];

      const cardCols = 3;
      const cardGap = 6;
      const cardW = (printableWidth - cardGap * (cardCols - 1)) / cardCols;
      const cardH = 34;
      const startGridY = doc.y;

      kpis.forEach((item, idx) => {
        const col = idx % cardCols;
        const row = Math.floor(idx / cardCols);
        const cardX = leftMargin + col * (cardW + cardGap);
        const cardY = startGridY + row * (cardH + cardGap);

        doc
          .rect(cardX, cardY, cardW, cardH)
          .fillColor('#FFFFFF')
          .fill()
          .rect(cardX, cardY, cardW, cardH)
          .strokeColor('#E2E8F0')
          .lineWidth(0.8)
          .stroke();

        // Accent strip on left
        doc
          .rect(cardX, cardY, 3, cardH)
          .fillColor(item.color)
          .fill();

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#64748B')
          .text(item.label, cardX + 7, cardY + 5, { width: cardW - 12 });

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0F172A')
          .text(item.val, cardX + 7, cardY + 16, { width: cardW - 12 });
      });

      doc.y = startGridY + 3 * (cardH + cardGap) + 10;

      // ─────────────────────────────────────────────────────────────────────────
      // 4. REKAPITULASI PER BIRO (5 BIRO RESMI)
      // ─────────────────────────────────────────────────────────────────────────
      ensureSpace(120);

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0F172A')
        .text('REKAPITULASI PERFORMA PER BIRO', leftMargin, doc.y);

      doc.y += 6;

      const biroColW = [85, 45, 60, 48, 52, 52, 55, 65]; // sum = 462, stretch to printableWidth
      // Scale columns to fit printableWidth (515.28)
      const sumCols = biroColW.reduce((a, b) => a + b, 0);
      const scaledBiroW = biroColW.map((w) => (w / sumCols) * printableWidth);

      const tableHeaderY = doc.y;
      doc
        .rect(leftMargin, tableHeaderY, printableWidth, 18)
        .fillColor('#1E293B')
        .fill();

      const headers = [
        'Biro',
        'Rapat',
        'Tdk Lanjut',
        'Selesai',
        'Berjalan',
        'Menunggu',
        'Terlambat',
        'Compl. Rate',
      ];

      let curX = leftMargin;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
      headers.forEach((h, i) => {
        const align = i === 0 ? 'left' : 'center';
        const pad = i === 0 ? 5 : 0;
        doc.text(h, curX + pad, tableHeaderY + 4, {
          width: scaledBiroW[i] - pad * 2,
          align,
        });
        curX += scaledBiroW[i];
      });

      doc.y = tableHeaderY + 18;

      data.biroSummary.forEach((b, rowIdx) => {
        ensureSpace(18);
        const rowY = doc.y;
        const bg = rowIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

        doc
          .rect(leftMargin, rowY, printableWidth, 16)
          .fillColor(bg)
          .fill()
          .rect(leftMargin, rowY, printableWidth, 16)
          .strokeColor('#E2E8F0')
          .lineWidth(0.5)
          .stroke();

        let cellX = leftMargin;
        const rowVals = [
          b.code,
          String(b.totalMeetings),
          String(b.totalActionItems),
          String(b.completed),
          String(b.inProgress),
          String(b.pending),
          String(b.overdue),
          `${b.completionRate}%`,
        ];

        doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B');
        rowVals.forEach((val, i) => {
          const align = i === 0 ? 'left' : 'center';
          const pad = i === 0 ? 5 : 0;
          if (i === 6 && b.overdue > 0) {
            doc.fillColor('#DC2626').font('Helvetica-Bold');
          } else if (i === 7 && b.completionRate > 0) {
            doc.fillColor('#059669').font('Helvetica-Bold');
          } else if (i === 0) {
            doc.fillColor('#0F172A').font('Helvetica-Bold');
          } else {
            doc.fillColor('#1E293B').font('Helvetica');
          }

          doc.text(val, cellX + pad, rowY + 3.5, {
            width: scaledBiroW[i] - pad * 2,
            align,
          });
          cellX += scaledBiroW[i];
        });

        doc.y = rowY + 16;
      });

      // Total Row
      ensureSpace(20);
      const totalRowY = doc.y;
      doc
        .rect(leftMargin, totalRowY, printableWidth, 18)
        .fillColor('#FEF3C7')
        .fill()
        .rect(leftMargin, totalRowY, printableWidth, 18)
        .strokeColor('#FCD34D')
        .lineWidth(1)
        .stroke();

      let tCellX = leftMargin;
      const totalVals = [
        'TOTAL',
        String(data.biroTotalRow.totalMeetings),
        String(data.biroTotalRow.totalActionItems),
        String(data.biroTotalRow.completed),
        String(data.biroTotalRow.inProgress),
        String(data.biroTotalRow.pending),
        String(data.biroTotalRow.overdue),
        `${data.biroTotalRow.completionRate}%`,
      ];

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#78350F');
      totalVals.forEach((val, i) => {
        const align = i === 0 ? 'left' : 'center';
        const pad = i === 0 ? 5 : 0;
        doc.text(val, tCellX + pad, totalRowY + 4, {
          width: scaledBiroW[i] - pad * 2,
          align,
        });
        tCellX += scaledBiroW[i];
      });

      doc.y = totalRowY + 26;

      // ─────────────────────────────────────────────────────────────────────────
      // 5. TREN PERIODE (TABEL RINGKAS)
      // ─────────────────────────────────────────────────────────────────────────
      if (data.trend && data.trend.length > 0) {
        ensureSpace(90);

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0F172A')
          .text('DISTRIBUSI & TREN AKTIVITAS DALAM PERIODE', leftMargin, doc.y);

        doc.y += 6;

        const trendW = [140, 90, 100, 95, 90];
        const sumTrendW = trendW.reduce((a, b) => a + b, 0);
        const scaledTrendW = trendW.map((w) => (w / sumTrendW) * printableWidth);

        const trendHeaderY = doc.y;
        doc
          .rect(leftMargin, trendHeaderY, printableWidth, 16)
          .fillColor('#334155')
          .fill();

        const trendHeaders = [
          'Bagian Periode',
          'Jumlah Rapat',
          'Tindak Lanjut',
          'Selesai',
          'Terlambat',
        ];

        let trX = leftMargin;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
        trendHeaders.forEach((th, i) => {
          const align = i === 0 ? 'left' : 'center';
          const pad = i === 0 ? 5 : 0;
          doc.text(th, trX + pad, trendHeaderY + 3.5, {
            width: scaledTrendW[i] - pad * 2,
            align,
          });
          trX += scaledTrendW[i];
        });

        doc.y = trendHeaderY + 16;

        data.trend.forEach((tr, idx) => {
          ensureSpace(16);
          const rY = doc.y;
          const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

          doc
            .rect(leftMargin, rY, printableWidth, 15)
            .fillColor(bg)
            .fill()
            .rect(leftMargin, rY, printableWidth, 15)
            .strokeColor('#E2E8F0')
            .lineWidth(0.5)
            .stroke();

          let cX = leftMargin;
          const labelFull = tr.subLabel ? `${tr.label} (${tr.subLabel})` : tr.label;
          const trVals = [
            labelFull,
            String(tr.totalMeetings),
            String(tr.totalActionItems),
            String(tr.completed),
            String(tr.overdue),
          ];

          doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B');
          trVals.forEach((val, i) => {
            const align = i === 0 ? 'left' : 'center';
            const pad = i === 0 ? 5 : 0;
            if (i === 4 && tr.overdue > 0) {
              doc.fillColor('#DC2626').font('Helvetica-Bold');
            } else if (i === 3 && tr.completed > 0) {
              doc.fillColor('#059669').font('Helvetica');
            } else {
              doc.fillColor('#1E293B').font('Helvetica');
            }

            doc.text(val, cX + pad, rY + 3, {
              width: scaledTrendW[i] - pad * 2,
              align,
            });
            cX += scaledTrendW[i];
          });

          doc.y = rY + 15;
        });

        doc.y += 10;
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 6. DAFTAR RAPAT & STATUS NOTULEN
      // ─────────────────────────────────────────────────────────────────────────
      ensureSpace(100);

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0F172A')
        .text('DAFTAR RAPAT & KETERSEDIAAN NOTULEN', leftMargin, doc.y);

      doc.y += 6;

      if (data.meetings.length === 0) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text(
            'Tidak ada data rapat pada periode yang dipilih.',
            leftMargin,
            doc.y
          );
        doc.y += 15;
      } else {
        const mColW = [25, 75, 175, 75, 60, 75];
        const sumMCol = mColW.reduce((a, b) => a + b, 0);
        const scaledMW = mColW.map((w) => (w / sumMCol) * printableWidth);

        const mHeaderY = doc.y;
        doc
          .rect(leftMargin, mHeaderY, printableWidth, 16)
          .fillColor('#1E293B')
          .fill();

        const mHeaders = ['No', 'No. Rapat', 'Judul Rapat', 'Tanggal', 'Biro', 'Notulen'];
        let mHX = leftMargin;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
        mHeaders.forEach((mh, i) => {
          const align = i <= 1 || i === 4 ? 'left' : i === 2 ? 'left' : 'center';
          const pad = 4;
          doc.text(mh, mHX + pad, mHeaderY + 3.5, {
            width: scaledMW[i] - pad * 2,
            align,
          });
          mHX += scaledMW[i];
        });

        doc.y = mHeaderY + 16;

        data.meetings.forEach((m, idx) => {
          ensureSpace(18);
          const rY = doc.y;
          const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

          doc
            .rect(leftMargin, rY, printableWidth, 16)
            .fillColor(bg)
            .fill()
            .rect(leftMargin, rY, printableWidth, 16)
            .strokeColor('#E2E8F0')
            .lineWidth(0.5)
            .stroke();

          let mCX = leftMargin;
          const mVals = [
            String(idx + 1),
            m.meetingNumber,
            m.title,
            m.formattedDate,
            m.biroCode,
            m.statusNotulen,
          ];

          mVals.forEach((val, i) => {
            const align = i <= 2 || i === 4 ? 'left' : 'center';
            const pad = 4;

            if (i === 5) {
              if (m.hasMinutes) {
                doc.fillColor('#059669').font('Helvetica-Bold');
              } else {
                doc.fillColor('#DC2626').font('Helvetica-Bold');
              }
            } else if (i === 1) {
              doc.fillColor('#0F172A').font('Helvetica-Bold');
            } else {
              doc.fillColor('#334155').font('Helvetica');
            }

            doc.fontSize(7).text(val, mCX + pad, rY + 3.5, {
              width: scaledMW[i] - pad * 2,
              align,
              lineBreak: false,
              ellipsis: true,
            });
            mCX += scaledMW[i];
          });

          doc.y = rY + 16;
        });
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 7. MULTI-PAGE NUMBERING & FOOTERS
      // ─────────────────────────────────────────────────────────────────────────
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        doc
          .strokeColor('#E2E8F0')
          .lineWidth(0.5)
          .moveTo(leftMargin, 805)
          .lineTo(leftMargin + printableWidth, 805)
          .stroke();

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#64748B')
          .text(
            `SIM-RAPAT KEK RI • Dokumen Laporan Berkala • Dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
            leftMargin,
            812,
            { width: printableWidth / 2, align: 'left' }
          );

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#64748B')
          .text(
            `Halaman ${i + 1} dari ${range.count}`,
            leftMargin + printableWidth / 2,
            812,
            { width: printableWidth / 2, align: 'right' }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
