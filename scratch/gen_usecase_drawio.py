import xml.etree.ElementTree as ET

def generate_use_case_drawio():
    xml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-10-08T09:10:00.000Z" agent="Mozilla/5.0" version="24.0.0" type="device">
  <diagram id="sim-rapat-usecase" name="Use Case Diagram - SIM-RAPAT KEK RI">
    <mxGraphModel dx="1600" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1700" pageHeight="1300" background="#ffffff" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Title Banner -->
        <mxCell id="title_banner" value="UML USE CASE DIAGRAM — SISTEM INFORMASI LOG &amp; NOTULA RAPAT (SIM-RAPAT KEK RI)&#xa;SEKRETARIAT JENDERAL DEWAN NASIONAL KAWASAN EKONOMI KHUSUS REPUBLIK INDONESIA" style="rounded=1;arcSize=8;fillColor=#215865;strokeColor=#183E47;strokeWidth=1.5;fontColor=#ffffff;fontStyle=1;fontSize=14;align=center;verticalAlign=middle;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="60" y="20" width="1580" height="46" as="geometry" />
        </mxCell>

        <!-- System Boundary -->
        <mxCell id="sys_boundary" value="Sistem Informasi Log &amp;amp; Notula Rapat KEK (SIM-RAPAT KEK RI)" style="shape=rect;rounded=1;arcSize=4;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#215865;strokeWidth=2.5;dashed=0;verticalAlign=top;align=left;spacingLeft=24;spacingTop=14;fontStyle=1;fontSize=15;fontColor=#215865;shadow=0;" vertex="1" parent="1">
          <mxGeometry x="270" y="85" width="1370" height="1170" as="geometry" />
        </mxCell>

        <!-- ================= ACTORS ================= -->
        <!-- Actor 1: Staf Pelaksana -->
        <mxCell id="actor_staff" value="&lt;b&gt;Staf Pelaksana&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 10px;&quot;&gt;(Pegawai / PIC)&lt;/font&gt;" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#E8F5F7;strokeColor=#215865;strokeWidth=1.8;fontSize=12;fontColor=#1E293B;" vertex="1" parent="1">
          <mxGeometry x="90" y="230" width="65" height="110" as="geometry" />
        </mxCell>

        <!-- Actor 2: Admin Biro / Tim -->
        <mxCell id="actor_admin" value="&lt;b&gt;Admin Biro / Tim&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 10px;&quot;&gt;(Pengelola Agenda &amp;amp; Notulis)&lt;/font&gt;" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.8;fontSize=12;fontColor=#1E293B;" vertex="1" parent="1">
          <mxGeometry x="90" y="580" width="65" height="110" as="geometry" />
        </mxCell>

        <!-- Actor 3: Super Admin -->
        <mxCell id="actor_super_admin" value="&lt;b&gt;Super Admin&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 10px;&quot;&gt;(Pimpinan / Administrator)&lt;/font&gt;" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#F3E8FF;strokeColor=#7C3AED;strokeWidth=1.8;fontSize=12;fontColor=#1E293B;" vertex="1" parent="1">
          <mxGeometry x="90" y="990" width="65" height="110" as="geometry" />
        </mxCell>

        <!-- Actor Generalization / Inheritance -->
        <!-- Admin -> Staff -->
        <mxCell id="edge_gen_admin_staff" value="" style="endArrow=block;endSize=10;endFill=0;html=1;rounded=0;strokeColor=#215865;strokeWidth=1.8;" edge="1" parent="1" source="actor_admin" target="actor_staff">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Super Admin -> Admin -->
        <mxCell id="edge_gen_super_admin" value="" style="endArrow=block;endSize=10;endFill=0;html=1;rounded=0;strokeColor=#7C3AED;strokeWidth=1.8;" edge="1" parent="1" source="actor_super_admin" target="actor_admin">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- ================= MODULE 1: AUTENTIKASI & AKUN ================= -->
        <mxCell id="mod1_box" value="&lt;b&gt;1. Modul Autentikasi &amp;amp; Akun&lt;/b&gt;" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#CBD5E1;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontSize=11;fontColor=#475569;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="130" width="410" height="175" as="geometry" />
        </mxCell>

        <mxCell id="uc01" value="UC-01&#xa;&lt;b&gt;Login &amp;amp; Logout Sistem&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="330" y="165" width="165" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc02" value="UC-02&#xa;&lt;b&gt;Kelola Profil Pengguna&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="525" y="165" width="165" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc03" value="UC-03&#xa;&lt;b&gt;Ganti Kata Sandi&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#60A5FA;strokeWidth=1.3;fontColor=#1E3A8A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="525" y="235" width="165" height="55" as="geometry" />
        </mxCell>

        <!-- ================= MODULE 2: DASHBOARD & MONITORING ================= -->
        <mxCell id="mod2_box" value="&lt;b&gt;2. Modul Dashboard &amp;amp; Monitoring Kinerja Tim Kerja&lt;/b&gt;" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#CBD5E1;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontSize=11;fontColor=#475569;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="740" y="130" width="870" height="175" as="geometry" />
        </mxCell>

        <mxCell id="uc04" value="UC-04&#xa;&lt;b&gt;Lihat Dashboard Ringkasan &amp;amp;&#xa;Kalender Agenda Rapat&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="765" y="165" width="200" height="58" as="geometry" />
        </mxCell>

        <mxCell id="uc05" value="UC-05&#xa;&lt;b&gt;Monitoring Kinerja &amp;amp; Beban&#xa;3 Tim Kerja KEK (INV, KS, KOM)&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F3E8FF;strokeColor=#7C3AED;strokeWidth=1.5;fontColor=#4C1D95;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="1005" y="165" width="220" height="58" as="geometry" />
        </mxCell>

        <mxCell id="uc06" value="UC-06&#xa;&lt;b&gt;Filter Periode Kinerja Tim&#xa;(Hari Ini, Minggu Ini, Bulan Ini)&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#ECFDF5;strokeColor=#059669;strokeWidth=1.3;fontColor=#064E3B;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="1275" y="165" width="215" height="58" as="geometry" />
        </mxCell>

        <mxCell id="uc07" value="UC-07&#xa;&lt;b&gt;Lihat Detail Rapat Tim Langsung&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#ECFDF5;strokeColor=#059669;strokeWidth=1.3;fontColor=#064E3B;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="1275" y="235" width="215" height="55" as="geometry" />
        </mxCell>

        <!-- ================= MODULE 3: MANAJEMEN AGENDA RAPAT ================= -->
        <mxCell id="mod3_box" value="&lt;b&gt;3. Modul Manajemen Agenda Rapat&lt;/b&gt;" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#CBD5E1;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontSize=11;fontColor=#475569;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="330" width="1310" height="280" as="geometry" />
        </mxCell>

        <mxCell id="uc08" value="UC-08&#xa;&lt;b&gt;Lihat Daftar &amp;amp; Detail Rapat&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="330" y="370" width="185" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc09" value="UC-09&#xa;&lt;b&gt;Filter &amp;amp; Cari Agenda Rapat&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="330" y="445" width="185" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc10" value="UC-10&#xa;&lt;b&gt;Buat / Jadwalkan Rapat Baru&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.8;fontColor=#78350F;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="610" y="380" width="220" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc11" value="UC-11&#xa;&lt;b&gt;Edit Agenda Rapat&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.5;fontColor=#78350F;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="610" y="465" width="200" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc12" value="UC-12&#xa;&lt;b&gt;Batalkan / Hapus Rapat&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FEE2E2;strokeColor=#DC2626;strokeWidth=1.5;fontColor=#7F1D1D;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="610" y="535" width="200" height="55" as="geometry" />
        </mxCell>

        <!-- Included Use Cases under Meeting Creation -->
        <mxCell id="uc13" value="UC-13&#xa;&lt;b&gt;Generate Nomor Rapat Otomatis&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Biro &amp;amp; Tim Kerja KEK)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#3B82F6;strokeWidth=1.4;fontColor=#1E3A8A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="960" y="360" width="225" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc14" value="UC-14&#xa;&lt;b&gt;Tentukan Kategori Dokumen Masuk&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Disposisi Sekjen / Undangan Internal)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#3B82F6;strokeWidth=1.4;fontColor=#1E3A8A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="960" y="430" width="235" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc15" value="UC-15&#xa;&lt;b&gt;Kelola Peserta &amp;amp; Pimpinan Rapat&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Ketua, Notulis, Biro Terkait)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#3B82F6;strokeWidth=1.4;fontColor=#1E3A8A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="960" y="500" width="225" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc16" value="UC-16&#xa;&lt;b&gt;Presensi Kehadiran Peserta&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#3B82F6;strokeWidth=1.3;fontColor=#1E3A8A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="1275" y="500" width="215" height="55" as="geometry" />
        </mxCell>

        <!-- ================= MODULE 4: NOTULA & DOKUMEN RISALAH ================= -->
        <mxCell id="mod4_box" value="&lt;b&gt;4. Modul Notula &amp;amp; Dokumen Risalah Rapat&lt;/b&gt;" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#CBD5E1;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontSize=11;fontColor=#475569;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="630" width="630" height="260" as="geometry" />
        </mxCell>

        <mxCell id="uc17" value="UC-17&#xa;&lt;b&gt;Catat &amp;amp; Susun Notula Rapat&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Poin Bahasan, Keputusan, Kesimpulan)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.8;fontColor=#78350F;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="330" y="670" width="255" height="58" as="geometry" />
        </mxCell>

        <mxCell id="uc18" value="UC-18&#xa;&lt;b&gt;Unggah &amp;amp; Unduh Berkas Lampiran&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Materi Rapat, PDF, Paparan)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="330" y="745" width="250" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc19" value="UC-19&#xa;&lt;b&gt;Cetak / Export Notula &amp;amp; Dokumen&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Format Resmi Notula / Nota Dinas)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#ECFDF5;strokeColor=#059669;strokeWidth=1.5;fontColor=#064E3B;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="330" y="818" width="250" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc20" value="UC-20&#xa;&lt;b&gt;Validasi &amp;amp; Finalisasi Notula&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.4;fontColor=#78350F;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="640" y="670" width="210" height="55" as="geometry" />
        </mxCell>

        <!-- ================= MODULE 5: MATRIKS TINDAK LANJUT ================= -->
        <mxCell id="mod5_box" value="&lt;b&gt;5. Modul Matriks Tindak Lanjut (Action Items)&lt;/b&gt;" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#CBD5E1;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontSize=11;fontColor=#475569;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="960" y="630" width="650" height="260" as="geometry" />
        </mxCell>

        <mxCell id="uc21" value="UC-21&#xa;&lt;b&gt;Lihat Matriks Tindak Lanjut&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Tabel Progres per Tim &amp;amp; Status)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="990" y="670" width="230" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc22" value="UC-22&#xa;&lt;b&gt;Buat Butir Tindak Lanjut Baru&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.8;fontColor=#78350F;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="990" y="745" width="230" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc23" value="UC-23&#xa;&lt;b&gt;Tetapkan Tim, PIC &amp;amp; Tenggat (Due Date)&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#3B82F6;strokeWidth=1.4;fontColor=#1E3A8A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="1275" y="745" width="270" height="55" as="geometry" />
        </mxCell>

        <mxCell id="uc24" value="UC-24&#xa;&lt;b&gt;Perbarui Status Tindak Lanjut&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Belum Dimulai, Dalam Proses, Selesai)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="990" y="818" width="250" height="55" as="geometry" />
        </mxCell>

        <!-- ================= MODULE 6: ADMINISTRASI SISTEM ================= -->
        <mxCell id="mod6_box" value="&lt;b&gt;6. Modul Administrasi Sistem (Super Admin)&lt;/b&gt;" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#CBD5E1;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontSize=11;fontColor=#475569;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="910" width="1310" height="190" as="geometry" />
        </mxCell>

        <mxCell id="uc25" value="UC-25&#xa;&lt;b&gt;Kelola Data Pengguna &amp;amp; Hak Akses&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(CRUD Akun, Peran, Reset Sandi)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F3E8FF;strokeColor=#7C3AED;strokeWidth=1.8;fontColor=#4C1D95;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="360" y="960" width="270" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc26" value="UC-26&#xa;&lt;b&gt;Kelola Struktur Biro &amp;amp; Tim Kerja KEK&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 9.5px;&quot;&gt;(Master Biro IKK &amp;amp; 3 Tim Kerja)&lt;/font&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F3E8FF;strokeColor=#7C3AED;strokeWidth=1.8;fontColor=#4C1D95;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="690" y="960" width="270" height="60" as="geometry" />
        </mxCell>

        <mxCell id="uc27" value="UC-27&#xa;&lt;b&gt;Kelola Pengaturan &amp;amp; Konfigurasi Sistem&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F3E8FF;strokeColor=#7C3AED;strokeWidth=1.8;fontColor=#4C1D95;fontSize=11;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="1020" y="960" width="270" height="60" as="geometry" />
        </mxCell>

        <!-- ================= ASSOCIATIONS: STAF PELAKSANA ================= -->
        <mxCell id="edge_staff_uc01" style="endArrow=none;html=1;rounded=0;strokeColor=#334155;strokeWidth=1.4;" edge="1" parent="1" source="actor_staff" target="uc01">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_staff_uc02" style="endArrow=none;html=1;rounded=0;strokeColor=#334155;strokeWidth=1.4;" edge="1" parent="1" source="actor_staff" target="uc02">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_staff_uc04" style="endArrow=none;html=1;rounded=0;strokeColor=#334155;strokeWidth=1.4;" edge="1" parent="1" source="actor_staff" target="uc04">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_staff_uc08" style="endArrow=none;html=1;rounded=0;strokeColor=#334155;strokeWidth=1.4;" edge="1" parent="1" source="actor_staff" target="uc08">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_staff_uc09" style="endArrow=none;html=1;rounded=0;strokeColor=#334155;strokeWidth=1.4;" edge="1" parent="1" source="actor_staff" target="uc09">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_staff_uc18" style="endArrow=none;html=1;rounded=0;strokeColor=#334155;strokeWidth=1.4;" edge="1" parent="1" source="actor_staff" target="uc18">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_staff_uc21" style="endArrow=none;html=1;rounded=0;strokeColor=#334155;strokeWidth=1.4;" edge="1" parent="1" source="actor_staff" target="uc21">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_staff_uc24" style="endArrow=none;html=1;rounded=0;strokeColor=#334155;strokeWidth=1.4;" edge="1" parent="1" source="actor_staff" target="uc24">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- ================= ASSOCIATIONS: ADMIN BIRO / TIM ================= -->
        <mxCell id="edge_admin_uc10" style="endArrow=none;html=1;rounded=0;strokeColor=#D97706;strokeWidth=1.5;" edge="1" parent="1" source="actor_admin" target="uc10">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_admin_uc11" style="endArrow=none;html=1;rounded=0;strokeColor=#D97706;strokeWidth=1.5;" edge="1" parent="1" source="actor_admin" target="uc11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_admin_uc12" style="endArrow=none;html=1;rounded=0;strokeColor=#DC2626;strokeWidth=1.5;" edge="1" parent="1" source="actor_admin" target="uc12">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_admin_uc17" style="endArrow=none;html=1;rounded=0;strokeColor=#D97706;strokeWidth=1.5;" edge="1" parent="1" source="actor_admin" target="uc17">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_admin_uc20" style="endArrow=none;html=1;rounded=0;strokeColor=#D97706;strokeWidth=1.5;" edge="1" parent="1" source="actor_admin" target="uc20">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_admin_uc22" style="endArrow=none;html=1;rounded=0;strokeColor=#D97706;strokeWidth=1.5;" edge="1" parent="1" source="actor_admin" target="uc22">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- ================= ASSOCIATIONS: SUPER ADMIN ================= -->
        <mxCell id="edge_super_uc05" style="endArrow=none;html=1;rounded=0;strokeColor=#7C3AED;strokeWidth=1.6;" edge="1" parent="1" source="actor_super_admin" target="uc05">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="230" y="1030" />
              <mxPoint x="230" y="270" />
              <mxPoint x="1000" y="270" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="edge_super_uc25" style="endArrow=none;html=1;rounded=0;strokeColor=#7C3AED;strokeWidth=1.6;" edge="1" parent="1" source="actor_super_admin" target="uc25">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_super_uc26" style="endArrow=none;html=1;rounded=0;strokeColor=#7C3AED;strokeWidth=1.6;" edge="1" parent="1" source="actor_super_admin" target="uc26">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_super_uc27" style="endArrow=none;html=1;rounded=0;strokeColor=#7C3AED;strokeWidth=1.6;" edge="1" parent="1" source="actor_super_admin" target="uc27">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- ================= INCLUDES (Dashed Arrow to Target) ================= -->
        <!-- UC-10 includes UC-13, UC-14, UC-15 -->
        <mxCell id="edge_inc_uc10_uc13" value="&amp;laquo;include&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#2563EB;strokeWidth=1.3;fontColor=#1D4ED8;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc10" target="uc13">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_inc_uc10_uc14" value="&amp;laquo;include&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#2563EB;strokeWidth=1.3;fontColor=#1D4ED8;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc10" target="uc14">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_inc_uc10_uc15" value="&amp;laquo;include&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#2563EB;strokeWidth=1.3;fontColor=#1D4ED8;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc10" target="uc15">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC-15 includes UC-16 -->
        <mxCell id="edge_inc_uc15_uc16" value="&amp;laquo;include&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#2563EB;strokeWidth=1.3;fontColor=#1D4ED8;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc15" target="uc16">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC-22 includes UC-23 -->
        <mxCell id="edge_inc_uc22_uc23" value="&amp;laquo;include&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#2563EB;strokeWidth=1.3;fontColor=#1D4ED8;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc22" target="uc23">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC-17 includes UC-22 (Notula mencakup pembuatan butir tindak lanjut) -->
        <mxCell id="edge_inc_uc17_uc22" value="&amp;laquo;include&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#2563EB;strokeWidth=1.3;fontColor=#1D4ED8;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc17" target="uc22">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="750" y="772" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- ================= EXTENDS (Dashed Arrow to Base) ================= -->
        <!-- UC-03 extends UC-02 (Ganti sandi extends kelola profil) -->
        <mxCell id="edge_ext_uc03_uc02" value="&amp;laquo;extend&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#059669;strokeWidth=1.3;fontColor=#047857;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc03" target="uc02">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC-06 extends UC-05 (Filter periode extends monitoring kinerja) -->
        <mxCell id="edge_ext_uc06_uc05" value="&amp;laquo;extend&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#059669;strokeWidth=1.3;fontColor=#047857;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc06" target="uc05">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC-07 extends UC-05 (Klik detail rapat extends monitoring kinerja) -->
        <mxCell id="edge_ext_uc07_uc05" value="&amp;laquo;extend&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#059669;strokeWidth=1.3;fontColor=#047857;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc07" target="uc05">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- UC-19 extends UC-08 (Cetak notula extends lihat detail rapat) -->
        <mxCell id="edge_ext_uc19_uc08" value="&amp;laquo;extend&amp;raquo;" style="dashed=1;endArrow=open;endSize=8;html=1;rounded=0;strokeColor=#059669;strokeWidth=1.3;fontColor=#047857;fontSize=10;fontStyle=2;" edge="1" parent="1" source="uc19" target="uc08">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="290" y="845" />
              <mxPoint x="290" y="398" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- ================= LEGEND / PETUNJUK NOTASI UML ================= -->
        <mxCell id="legend_box" value="&lt;b&gt;PETUNJUK NOTASI &amp;amp; LEGENDA WARNA USE CASE&lt;/b&gt;" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#94A3B8;strokeWidth=1.2;verticalAlign=top;align=left;spacingLeft=16;spacingTop=10;fontSize=11;fontColor=#1E293B;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="1120" width="1310" height="110" as="geometry" />
        </mxCell>

        <mxCell id="leg_staff" value="Use Case Hak Akses Staf / Umum" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F0F9FA;strokeColor=#31889C;strokeWidth=1.3;fontColor=#0F172A;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="325" y="1160" width="185" height="42" as="geometry" />
        </mxCell>

        <mxCell id="leg_admin" value="Use Case Hak Akses Admin" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.3;fontColor=#78350F;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="535" y="1160" width="170" height="42" as="geometry" />
        </mxCell>

        <mxCell id="leg_super" value="Use Case Khusus Super Admin" style="ellipse;whiteSpace=wrap;html=1;fillColor=#F3E8FF;strokeColor=#7C3AED;strokeWidth=1.3;fontColor=#4C1D95;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="730" y="1160" width="180" height="42" as="geometry" />
        </mxCell>

        <mxCell id="leg_inc" value="&amp;laquo;include&amp;raquo; (Wajib Terpenuhi)" style="ellipse;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#3B82F6;strokeWidth=1.3;fontColor=#1E3A8A;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="935" y="1160" width="180" height="42" as="geometry" />
        </mxCell>

        <mxCell id="leg_ext" value="&amp;laquo;extend&amp;raquo; (Fungsionalitas Opsional)" style="ellipse;whiteSpace=wrap;html=1;fillColor=#ECFDF5;strokeColor=#059669;strokeWidth=1.3;fontColor=#064E3B;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1140" y="1160" width="200" height="42" as="geometry" />
        </mxCell>

        <mxCell id="leg_gen" value="&lt;b&gt;Generaliasi Aktor:&lt;/b&gt; Admin mewarisi hak akses Staf; Super Admin mewarisi Admin." style="text;html=1;align=left;verticalAlign=middle;fontSize=10;fontColor=#475569;" vertex="1" parent="1">
          <mxGeometry x="1360" y="1160" width="230" height="42" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''
    return xml_content

if __name__ == '__main__':
    content = generate_use_case_drawio()
    with open('docs/USE_CASE_SIM_RAPAT.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    print("USE_CASE_SIM_RAPAT.drawio successfully generated!")
