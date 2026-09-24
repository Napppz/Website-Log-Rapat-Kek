'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  RotateCcw,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';
import { UserRole } from '@prisma/client';
import {
  createUserAction,
  updateUserAction,
  toggleUserStatusAction,
} from '@/app/actions/user-actions';
import { toast } from '@/components/providers/toast-provider';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  biroId: string;
  isActive: boolean;
  createdAt: Date | string;
  biro?: {
    id: string;
    code: string;
    name: string;
    shortName: string;
  } | null;
}

interface UserManagementViewProps {
  initialUsers: UserItem[];
  availableBiros: { id: string; code: string; shortName: string; name: string }[];
  currentUserId: string;
}

export function UserManagementView({
  initialUsers = [],
  availableBiros = [],
  currentUserId,
}: UserManagementViewProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedBiro, setSelectedBiro] = useState<string>('ALL');

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('STAFF');
  const [formBiroId, setFormBiroId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('STAFF');
    setFormBiroId(availableBiros[0]?.id || '');
    setFormIsActive(true);
    setFormError(null);
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    setFormBiroId(user.biroId);
    setFormIsActive(user.isActive);
    setFormError(null);
    setIsDialogOpen(true);
  };

  // Submit User Create / Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingUser) {
        const res = await updateUserAction({
          id: editingUser.id,
          name: formName,
          email: formEmail,
          password: formPassword || null,
          role: formRole,
          biroId: formBiroId,
          isActive: formIsActive,
        });

        if (res.success && res.data) {
          setUsers((prev) =>
            prev.map((u) => (u.id === editingUser.id ? (res.data as unknown as UserItem) : u))
          );
          setIsDialogOpen(false);
          toast.success(`Data pengguna "${formName}" berhasil diperbarui.`);
          router.refresh();
        } else {
          setFormError(res.error || 'Gagal memperbarui pengguna.');
        }
      } else {
        const res = await createUserAction({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          biroId: formBiroId,
          isActive: formIsActive,
        });

        if (res.success && res.data) {
          setUsers((prev) => [res.data as unknown as UserItem, ...prev]);
          setIsDialogOpen(false);
          toast.success(`Pengguna baru "${formName}" berhasil ditambahkan.`);
          router.refresh();
        } else {
          setFormError(res.error || 'Gagal menambahkan pengguna.');
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (userId: string) => {
    if (userId === currentUserId) {
      toast.warning('Anda tidak dapat menonaktifkan akun yang sedang aktif digunakan.');
      return;
    }

    try {
      const res = await toggleUserStatusAction(userId);
      if (res.success && res.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: res.data!.isActive } : u))
        );
        toast.success(
          res.data.isActive
            ? 'Akun pengguna berhasil diaktifkan kembali.'
            : 'Akun pengguna berhasil dinonaktifkan.'
        );
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengubah status aktif pengguna.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;
      if (selectedBiro !== 'ALL' && u.biro?.code !== selectedBiro) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.biro?.code.toLowerCase().includes(q) ||
        u.biro?.shortName.toLowerCase().includes(q)
      );
    });
  }, [users, selectedRole, selectedBiro, search]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-bold">
            Super Admin
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
            Administrator
          </span>
        );
      case 'NOTULIS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 text-[11px] font-bold">
            Notulis
          </span>
        );
      case 'STAFF':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold">
            Staf
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold">
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-white rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider block">
            Administrasi &amp; Akses Sistem
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            Manajemen Pengguna &amp; Hak Akses
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Kelola akun kedinasan, peran pengguna (RBAC), penempatan biro, dan status keaktifan user.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            Filter:
          </span>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-slate-800 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Administrator</option>
            <option value="NOTULIS">Notulis</option>
            <option value="STAFF">Staf</option>
            <option value="VIEWER">Viewer</option>
          </select>

          {/* Biro Filter */}
          <select
            value={selectedBiro}
            onChange={(e) => setSelectedBiro(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-slate-800 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">Semua Biro KEK</option>
            {availableBiros.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code} — {b.shortName}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, biro..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-amber-200 text-slate-800 text-[12px] focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-amber-600 pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-800 text-[13px]">
            <thead className="bg-amber-50/60 border-b border-amber-200/80 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap &amp; Email</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Biro Penempatan</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="font-semibold text-slate-700">Tidak ada pengguna yang sesuai kriteria.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setSelectedRole('ALL');
                          setSelectedBiro('ALL');
                        }}
                        className="inline-flex items-center gap-1 text-[12px] text-amber-800 font-semibold hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filter</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-amber-50/30 transition-colors ${
                      !user.isActive ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-bold flex items-center justify-center text-[12px] shrink-0">
                          {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[12px] text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>

                    {/* Biro */}
                    <td className="py-3.5 px-4">
                      {user.biro ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-amber-900 text-[12px]">
                            {user.biro.code}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {user.biro.shortName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold">
                          <XCircle className="w-3 h-3 text-red-600" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            user.isActive
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.isActive ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Dialog (Create / Edit) */}
      {isDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDialogOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border-b border-amber-200">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  {editingUser ? 'Perbarui Data Akun' : 'Akun Kedinasan Baru'}
                </span>
                <h3 className="text-[18px] font-bold text-slate-900">
                  {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Sistem'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-[13px]">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 text-[12px]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nama Lengkap &amp; Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dr. Ir. Bambang Pranoto, M.T."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 text-[13px]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Alamat Email Kedinasan <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@simrapat.local atau nama@kek.go.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-[13px]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kata Sandi {editingUser ? <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span> : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? '•••••••• (Biarkan kosong untuk mempertahankan kata sandi lama)' : 'Minimal 6 karakter'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-[13px]"
                />
              </div>

              {/* Role & Biro Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Peran Pengguna (RBAC) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Penuh)</option>
                    <option value="ADMIN">ADMIN (Operasional)</option>
                    <option value="NOTULIS">NOTULIS (Dokumentasi)</option>
                    <option value="STAFF">STAFF (Pelaksana)</option>
                    <option value="VIEWER">VIEWER (Read-Only)</option>
                  </select>
                </div>

                {/* Biro */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Biro Penempatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formBiroId}
                    onChange={(e) => setFormBiroId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
                  >
                    {availableBiros.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="isActiveCheck" className="text-slate-800 font-semibold cursor-pointer select-none">
                  Akun aktif dan dapat masuk ke sistem
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
