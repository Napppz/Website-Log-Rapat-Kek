'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
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
  Trash2,
  Loader2,
  Briefcase,
  Layers,
} from 'lucide-react';
import { UserRole } from '@prisma/client';
import { cn } from '@/lib/utils';
import {
  getRoleSuffix,
  stripRoleSuffix,
  formatUserFullName,
} from '@/lib/validations/user';
import {
  createUserAction,
  updateUserAction,
  toggleUserStatusAction,
  deleteUserAction,
} from '@/app/actions/user-actions';
import { toast, confirmModal } from '@/components/providers/toast-provider';
import { TeamManagementPanel, TeamData } from '@/components/teams/team-management-panel';

export interface TeamMember {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: string;
  teamRole?: string;
  isActive: boolean;
}

export interface TeamItem {
  id: string;
  code: string;
  name: string;
  shortName: string;
  biroId: string;
  isActive?: boolean;
  description?: string | null;
  memberCount?: number;
  meetingCount?: number;
  members?: TeamMember[];
}

const CANONICAL_TEAMS: TeamItem[] = [
  { id: 'TIM-001', code: 'INV', name: 'Tim Investasi', shortName: 'Investasi', biroId: 'BIRO-IKK' },
  { id: 'TIM-003', code: 'KS', name: 'Tim Kerja Sama', shortName: 'Kerja Sama', biroId: 'BIRO-IKK' },
  { id: 'TIM-002', code: 'KOM', name: 'Tim Komunikasi', shortName: 'Komunikasi', biroId: 'BIRO-IKK' },
];

interface UserItem {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: UserRole;
  biroId: string;
  teamId?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  biro?: {
    id: string;
    code: string;
    name: string;
    shortName: string;
  } | null;
  team?: {
    id: string;
    code: string;
    name: string;
  } | null;
  userTeams?: {
    team: {
      id: string;
      code: string;
      name: string;
      isActive: boolean;
    };
  }[];
}

interface UserManagementViewProps {
  initialUsers: UserItem[];
  availableTeams?: TeamItem[];
  availableBiros?: { id: string; code: string; shortName: string; name: string }[];
  currentUserId: string;
  currentUserRole?: UserRole;
  currentUserTeamId?: string;
  currentUserTeamName?: string;
  currentUserTeamCode?: string;
  currentUserBiroCode?: string;
}

export function UserManagementView({
  initialUsers = [],
  availableTeams = [],
  availableBiros = [],
  currentUserId,
  currentUserRole = 'SUPER_ADMIN',
  currentUserTeamId,
  currentUserTeamName,
  currentUserTeamCode,
  currentUserBiroCode,
}: UserManagementViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');

  useEffect(() => {
    if (initialUsers && Array.isArray(initialUsers)) {
      setUsers(initialUsers);
    }
  }, [initialUsers]);

  const isScopedAdmin = currentUserRole === 'ADMIN';

  const teamsList: TeamItem[] = useMemo(() => {
    if (availableTeams && availableTeams.length > 0) return availableTeams;
    return CANONICAL_TEAMS;
  }, [availableTeams]);

  // Find admin's current team
  const myTeam = useMemo(() => {
    if (!currentUserTeamId && !currentUserTeamCode) return null;
    return (
      teamsList.find(
        (t) => t.id === currentUserTeamId || t.code === currentUserTeamCode
      ) || null
    );
  }, [teamsList, currentUserTeamId, currentUserTeamCode]);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Form Fields
  const defaultTeamId = myTeam?.id || currentUserTeamId || teamsList[0]?.id || 'TIM-001';
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('STAFF');
  const [formTeamId, setFormTeamId] = useState<string>(defaultTeamId);
  const [formTeamIds, setFormTeamIds] = useState<string[]>([defaultTeamId]);
  const [formIsActive, setFormIsActive] = useState(true);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('STAFF');
    const initialTid = myTeam?.id || currentUserTeamId || teamsList[0]?.id || 'TIM-001';
    setFormTeamId(initialTid);
    setFormTeamIds([initialTid]);
    setFormIsActive(true);
    setFormError(null);
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: UserItem) => {
    if (isScopedAdmin && user.role === 'SUPER_ADMIN') {
      toast.warning('Anda tidak memiliki hak akses mengedit akun Super Administrator.');
      return;
    }
    setEditingUser(user);
    // Bersihkan suffix role agar hanya menyisakan nama & gelar di input teks
    setFormName(stripRoleSuffix(user.name));
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    const matchedTeam = teamsList.find(
      (t) => t.id === user.teamId || t.code === user.team?.code
    );
    const userTeamIds = user.userTeams && user.userTeams.length > 0
      ? user.userTeams.map((ut) => ut.team.id)
      : [matchedTeam?.id || user.teamId || defaultTeamId];
    setFormTeamIds(userTeamIds);
    setFormTeamId(user.teamId && userTeamIds.includes(user.teamId) ? user.teamId : (userTeamIds[0] || defaultTeamId));
    setFormIsActive(user.isActive);
    setFormError(null);
    setIsDialogOpen(true);
  };

  // Submit User Create / Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const finalFullName = formatUserFullName(formName, formRole);
    if (!finalFullName) {
      setFormError('Nama lengkap wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    const targetTeamIds = isScopedAdmin
      ? (myTeam?.id ? [myTeam.id] : formTeamIds)
      : formTeamIds;
    const primaryTeamId = (formTeamIds.includes(formTeamId) ? formTeamId : targetTeamIds[0]) || formTeamId;
    const selectedTeamObj = teamsList.find((t) => t.id === primaryTeamId);
    const resolvedBiroId = selectedTeamObj?.biroId || 'BIRO-IKK';

    try {
      if (editingUser) {
        const res = await updateUserAction({
          id: editingUser.id,
          name: finalFullName,
          username: undefined,
          email: formEmail,
          password: formPassword || null,
          role: formRole,
          biroId: resolvedBiroId,
          teamId: primaryTeamId,
          teamIds: targetTeamIds,
          isActive: formIsActive,
        });

        if (res.success && res.data) {
          setUsers((prev) =>
            prev.map((u) => (u.id === editingUser.id ? (res.data as unknown as UserItem) : u))
          );
          setIsDialogOpen(false);
          toast.success(`Data pengguna "${finalFullName}" berhasil diperbarui.`);
          startTransition(() => {
            router.refresh();
          });
        } else {
          setFormError(res.error || 'Gagal memperbarui pengguna.');
        }
      } else {
        const res = await createUserAction({
          name: finalFullName,
          username: undefined,
          email: formEmail,
          password: formPassword,
          role: formRole,
          biroId: resolvedBiroId,
          teamId: primaryTeamId,
          teamIds: targetTeamIds,
          isActive: formIsActive,
        });

        if (res.success && res.data) {
          setUsers((prev) => [res.data as unknown as UserItem, ...prev]);
          setIsDialogOpen(false);
          toast.success(`Pengguna baru "${finalFullName}" berhasil ditambahkan.`);
          startTransition(() => {
            router.refresh();
          });
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

    const targetUser = users.find((u) => u.id === userId);
    if (isScopedAdmin && targetUser?.role === 'SUPER_ADMIN') {
      toast.warning('Anda tidak memiliki hak akses mengubah status akun Super Administrator.');
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
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(res.error || 'Gagal mengubah status aktif pengguna.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  // Delete user permanently
  const handleDeleteUser = async (user: UserItem) => {
    if (user.id === currentUserId) {
      toast.warning('Anda tidak dapat menghapus akun yang sedang aktif digunakan.');
      return;
    }

    if (isScopedAdmin && user.role === 'SUPER_ADMIN') {
      toast.warning('Anda tidak memiliki hak akses menghapus akun Super Administrator.');
      return;
    }

    const confirmed = await confirmModal({
      title: 'Hapus Akun Pengguna?',
      message: `Apakah Anda yakin ingin menghapus akun "${user.name}" (${user.email}) secara permanen? Data penugasan dan riwayat notulensi akan tetap tersimpan namun status keterikatan akun akan dilepas. Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Pengguna',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      const res = await deleteUserAction(user.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        toast.success(res.message || `Pengguna "${user.name}" berhasil dihapus.`);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(res.error || 'Gagal menghapus pengguna.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem saat menghapus pengguna.');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;
      if (selectedTeam !== 'ALL') {
        const matchesTeam =
          u.team?.code === selectedTeam ||
          u.userTeams?.some((ut) => ut.team?.code === selectedTeam);
        if (!matchesTeam) return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.team?.code?.toLowerCase().includes(q) ||
        u.team?.name?.toLowerCase().includes(q) ||
        u.userTeams?.some(
          (ut) =>
            ut.team?.code?.toLowerCase().includes(q) ||
            ut.team?.name?.toLowerCase().includes(q)
        )
      );
    });
  }, [users, selectedRole, selectedTeam, search]);

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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E8F5F7] text-[#31889C] border border-[#BCE3EB] text-[11px] font-bold">
            Administrator
          </span>
        );
      case 'PIMPINAN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
            Pimpinan
          </span>
        );
      case 'STAFF':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold">
            Staf
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Navigation Tabs (Super Admin, Pimpinan, Admin) */}
      {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'PIMPINAN' || currentUserRole === 'ADMIN') && (
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer",
              activeTab === 'users'
                ? "bg-[#31889C] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Pengguna &amp; Staf</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-bold",
                activeTab === 'users'
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer",
              activeTab === 'teams'
                ? "bg-[#31889C] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <Layers className="w-4 h-4" />
            <span>Kelola Tim Kerja Biro 3</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-bold",
                activeTab === 'teams'
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              {teamsList.length}
            </span>
          </button>
        </div>
      )}

      {/* Tab Content: Kelola Tim Kerja */}
      {activeTab === 'teams' ? (
        <TeamManagementPanel
          initialTeams={(availableTeams && availableTeams.length > 0 ? availableTeams : teamsList) as TeamData[]}
          currentUserRole={currentUserRole}
        />
      ) : (
        <>
          {/* Header */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-[12px] text-[#31889C] uppercase tracking-wider block">
                {isScopedAdmin
                  ? `Administrasi Tim Kerja (${myTeam?.name || currentUserTeamName || 'Tim Anda'})`
                  : 'Administrasi & Akses Sistem'}
              </span>
              <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
                {isScopedAdmin
                  ? `Manajemen Anggota ${myTeam?.name || currentUserTeamName || 'Tim Kerja'}`
                  : 'Manajemen Pengguna & Hak Akses'}
              </h1>
              <p className="text-[13px] text-slate-500 mt-1">
                {isScopedAdmin
                  ? `Kelola daftar anggota tim kerja, tambahkan personel staf baru, dan kelola akun pada ${myTeam?.name || currentUserTeamName || 'tim Anda'}.`
                  : 'Kelola akun kedinasan, peran pengguna (RBAC), penempatan tim kerja, dan status keaktifan user.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] shadow-xs transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isScopedAdmin ? 'Tambah Anggota Tim' : 'Tambah Pengguna Baru'}</span>
            </button>
          </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#31889C]" />
            Filter:
          </span>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] shadow-xs cursor-pointer"
          >
            <option value="ALL">{isScopedAdmin ? 'Semua Peran Tim' : 'Semua Peran (Role)'}</option>
            {!isScopedAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
            <option value="ADMIN">Administrator</option>
            {!isScopedAdmin && <option value="PIMPINAN">Pimpinan</option>}
            <option value="STAFF">Staf</option>
          </select>

          {/* Tim Filter */}
          {isScopedAdmin ? (
            <div className="px-3 py-1.5 rounded-lg bg-[#E8F5F7] border border-[#BCE3EB] text-[#31889C] text-[12px] font-bold flex items-center gap-1.5 shadow-xs">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{myTeam?.name || currentUserTeamName || 'Tim Kerja Anda'}</span>
            </div>
          ) : (
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] shadow-xs cursor-pointer"
            >
              <option value="ALL">Semua Tim Kerja</option>
              {teamsList.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, tim kerja..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] shadow-xs"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#31889C] pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-800 text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap &amp; Email</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Tim Kerja</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                          setSelectedTeam('ALL');
                        }}
                        className="inline-flex items-center gap-1 text-[12px] text-[#31889C] font-semibold hover:underline cursor-pointer"
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
                    className={`hover:bg-[#F0F9FA] transition-colors ${
                      !user.isActive ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F0F9FA] border border-[#BCE3EB] text-[#31889C] font-bold flex items-center justify-center text-[12px] shrink-0">
                          {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[12px] text-slate-500">
                            <span>{user.email}</span>
                            {user.username && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10.5px] font-mono font-medium text-[#1E6B7B] bg-[#E8F5F7] border border-[#BCE3EB] rounded">
                                @{user.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>

                    {/* Tim Kerja */}
                    <td className="py-3.5 px-4">
                      {user.userTeams && user.userTeams.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {user.userTeams.map((ut) => (
                            <span
                              key={ut.team.id}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all",
                                ut.team.code === 'INV'
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : ut.team.code === 'KS'
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                  : ut.team.code === 'KOM'
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-[#E8F5F7] text-[#1E6B7B] border-[#BCE3EB]"
                              )}
                              title={ut.team.name}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                              <span>{ut.team.code}</span>
                              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">
                                ({ut.team.name.replace(/^Tim\s+/, '')})
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : user.team ? (
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "font-bold text-[12px] inline-flex items-center gap-1.5",
                              user.team.code === 'INV'
                                ? "text-emerald-700"
                                : user.team.code === 'KS'
                                ? "text-indigo-700"
                                : "text-amber-700"
                            )}
                          >
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                user.team.code === 'INV'
                                  ? "bg-emerald-500"
                                  : user.team.code === 'KS'
                                  ? "bg-indigo-500"
                                  : "bg-amber-500"
                              )}
                            />
                            <span>
                              {user.team.name.startsWith('Tim ')
                                ? user.team.name
                                : `Tim ${user.team.name}`}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-400 pl-3.5">
                            Kode: {user.team.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[12px]">Belum Ditugaskan</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECF8E9] text-[#4D8F3D] border border-[#D2EFCA] text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-[#7CC563]" />
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
                      {isScopedAdmin && user.role === 'SUPER_ADMIN' ? (
                        <span className="text-[11px] text-slate-400 italic font-medium px-2 py-1">
                          Akses Dilindungi
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-500 hover:text-[#31889C] hover:bg-[#F0F9FA] rounded-lg transition-colors cursor-pointer"
                            title={isScopedAdmin ? "Edit Anggota" : "Edit Pengguna"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={user.id === currentUserId}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              user.isActive
                                ? 'text-slate-400 hover:text-[#B96800] hover:bg-[#FFF0DC]'
                                : 'text-slate-400 hover:text-[#4D8F3D] hover:bg-[#ECF8E9]'
                            }`}
                            title={
                              user.id === currentUserId
                                ? 'Tidak dapat menonaktifkan akun sendiri'
                                : user.isActive
                                ? 'Nonaktifkan Pengguna'
                                : 'Aktifkan Pengguna'
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUserId || deletingUserId === user.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              user.id === currentUserId
                                ? 'Tidak dapat menghapus akun Anda sendiri'
                                : 'Hapus Pengguna'
                            }
                          >
                            {deletingUserId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDialogOpen(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 shrink-0">
              <div>
                <span className="text-[11px] font-bold text-[#31889C] uppercase tracking-wider">
                  {isScopedAdmin
                    ? 'Penugasan Anggota Tim Kerja'
                    : editingUser
                    ? 'Perbarui Data Akun'
                    : 'Akun Kedinasan Baru'}
                </span>
                <h3 className="text-[18px] font-bold text-slate-900">
                  {editingUser
                    ? isScopedAdmin
                      ? 'Edit Data Anggota Tim'
                      : 'Edit Pengguna'
                    : isScopedAdmin
                    ? 'Tambah Anggota Tim Baru'
                    : 'Tambah Pengguna Sistem'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden text-[13px]">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 text-[12px]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

              {/* Nama Lengkap & Gelar dengan Role Otomatis */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    Nama Lengkap &amp; Gelar <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#31889C] font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Role otomatis disematkan
                  </span>
                </div>
                <div className="flex items-stretch rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-[#31889C]/30 focus-within:border-[#31889C] overflow-hidden bg-white shadow-xs transition-all">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dr. Ir. Bambang Pranoto, M.T. atau Kevin"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    onBlur={() => {
                      if (formName.trim()) {
                        setFormName(stripRoleSuffix(formName));
                      }
                    }}
                    className="flex-1 min-w-0 px-3.5 py-2 border-0 focus:outline-none font-medium text-slate-900 text-[13px] bg-transparent"
                  />
                  {/* Inputan otomatis setelah nama dan gelar */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F0F9FA] border-l border-[#BCE3EB] text-[#1E6B7B] font-bold text-[13px] shrink-0 select-none"
                    title="Peran otomatis mengikuti Peran Pengguna (RBAC) yang dipilih"
                  >
                    <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">Peran:</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#BCE3EB] text-[#1E6B7B] shadow-2xs font-bold text-[12px]">
                      ({getRoleSuffix(formRole)})
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                  <span className="text-slate-500">
                    Role <strong className="text-[#1E6B7B]">({getRoleSuffix(formRole)})</strong> otomatis diset sesuai pilihan peran di bawah tanpa perlu diketik manual.
                  </span>
                  {formName.trim() && (
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      Nama Tersimpan: &ldquo;{formatUserFullName(formName, formRole)}&rdquo;
                    </span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Alamat Email Kedinasan <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@kek.go.id atau email kedinasan"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] text-slate-900 text-[13px]"
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
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] text-slate-900 text-[13px]"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
                  >
                    {!isScopedAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN (Penuh)</option>}
                    <option value="STAFF">STAFF (Pelaksana Tim)</option>
                    <option value="ADMIN">ADMIN (Koordinator / Admin Tim)</option>
                    {!isScopedAdmin && <option value="PIMPINAN">PIMPINAN (Pengawas &amp; Monitoring)</option>}
                  </select>
                </div>

                {/* Tim Kerja */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-800">
                      Penugasan Tim Kerja <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#31889C] font-semibold">
                      Dapat memilih lebih dari 1 tim kerja
                    </span>
                  </div>

                  {isScopedAdmin ? (
                    <div className="px-3 py-2 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] text-[#31889C] font-semibold text-[13px] flex items-center justify-between">
                      <span>{myTeam?.name || currentUserTeamName || 'Tim Kerja Anda'}</span>
                      <span className="text-[11px] font-bold bg-[#31889C] text-white px-2 py-0.5 rounded">
                        Terkunci Sesuai Tim
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teamsList.filter((t) => t.isActive !== false).map((t) => {
                          const isChecked = formTeamIds.includes(t.id);
                          const isPrimary = isChecked && (formTeamId === t.id);
                          return (
                            <label
                              key={t.id}
                              className={cn(
                                "flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all select-none relative",
                                isChecked
                                  ? "bg-[#E8F5F7] border-[#31889C] text-[#1E6B7B] shadow-2xs font-bold"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormTeamIds((prev) => [...prev, t.id]);
                                    if (!formTeamId || !formTeamIds.length) {
                                      setFormTeamId(t.id);
                                    }
                                  } else {
                                    if (formTeamIds.length > 1) {
                                      const nextIds = formTeamIds.filter((id) => id !== t.id);
                                      setFormTeamIds(nextIds);
                                      if (formTeamId === t.id) {
                                        setFormTeamId(nextIds[0]);
                                      }
                                    } else {
                                      toast.warning('Pengguna harus terdaftar minimal pada 1 tim kerja.');
                                    }
                                  }
                                }}
                                className="w-4 h-4 rounded text-[#31889C] focus:ring-[#31889C] cursor-pointer shrink-0"
                              />
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-bold shrink-0">
                                {t.code}
                              </span>
                              <span className="truncate flex-1">{t.name}</span>
                              {isPrimary && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#31889C] text-white font-bold shrink-0">
                                  Utama
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {/* Pilihan Tim Kerja Utama bila lebih dari 1 tim dipilih */}
                      {formTeamIds.length > 1 && (
                        <div className="pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/70 p-2.5 rounded-lg">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Tim Penugasan Utama (Primary):
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Identitas tim utama untuk penomoran notulensi &amp; profil.
                            </span>
                          </div>
                          <select
                            value={formTeamId}
                            onChange={(e) => setFormTeamId(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-[#1E6B7B] text-xs focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] cursor-pointer"
                          >
                            {teamsList
                              .filter((t) => formTeamIds.includes(t.id))
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.code} — {t.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Centang satu atau beberapa tim kerja sekaligus. Penomoran dan akses notulensi akan tersedia untuk semua tim yang dipilih.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#31889C] focus:ring-[#31889C] cursor-pointer"
                />
                <label htmlFor="isActiveCheck" className="text-slate-800 font-semibold cursor-pointer select-none">
                  Akun aktif dan dapat masuk ke sistem
                </label>
              </div>
            </div>

            {/* Modal Footer (Sticky / Fixed at Bottom) */}
            <div className="shrink-0 px-6 py-3.5 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-end gap-3">
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
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1E6B7B] hover:bg-[#164E59] text-white font-semibold text-[13px] shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Menyimpan...'
                    : editingUser
                    ? 'Simpan Perubahan'
                    : isScopedAdmin
                    ? 'Tambah Anggota'
                    : 'Buat Pengguna'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
        </>
      )}
    </div>
  );
}
