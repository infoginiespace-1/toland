'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Trash2,
  Search,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Mail,
  Phone,
  Lock,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { ALL_ROLES, AppRole, ROLE_META, TEAM_ROLES } from '@/lib/rbac';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string | null;
  authEmail: string | null;
  phone: string | null;
  role: AppRole;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  isProtected: boolean;
  isSelf: boolean;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface AllowlistItem {
  id: string;
  phone: string | null;
  email: string | null;
  role: AppRole;
  notes: string | null;
  created_at: string;
}

export function UsersManager({
  initialUsers,
  initialAllowlist,
}: {
  initialUsers: AdminUserItem[];
  initialAllowlist: AllowlistItem[];
}) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [allowlist, setAllowlist] = useState<AllowlistItem[]>(initialAllowlist);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [showRoleGuide, setShowRoleGuide] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('sales_crm');
  const [inviteNotes, setInviteNotes] = useState('');
  const [inviting, setInviting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const refreshData = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
        setAllowlist(data.allowlist || []);
      }
    } catch {
      // ignore silent refresh failure
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const teamCount = users.filter((u) => u.role !== 'customer').length;
    const verifiedCustomers = users.filter(
      (u) => u.role === 'customer' && (u.emailConfirmed || u.phoneConfirmed)
    ).length;
    const pendingVerify = users.filter(
      (u) => !u.emailConfirmed && !u.phoneConfirmed
    ).length;
    return { total, teamCount, verifiedCustomers, pendingVerify };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        ROLE_META[u.role].label.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (userItem: AdminUserItem, nextRole: AppRole) => {
    if (userItem.role === nextRole) return;
    setFeedback(null);
    setUpdatingId(userItem.id);
    try {
      const res = await fetch(`/api/admin/users/${userItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, role: nextRole } : u))
      );
      setFeedback({
        type: 'success',
        message: `${userItem.name}: Role assigned as "${ROLE_META[nextRole].label}".`,
      });
      await refreshData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not update role',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setFeedback(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setFeedback({
        type: 'success',
        message:
          data.message ||
          `${deleteTarget.name} deleted cleanly. They can now sign up again with the same mobile or email.`,
      });
      setDeleteTarget(null);
      await refreshData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Delete failed',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePreAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setInviting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          phone: invitePhone.trim(),
          role: inviteRole,
          notes: inviteNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign team role');
      }

      setFeedback({
        type: 'success',
        message: data.message,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInvitePhone('');
      setInviteNotes('');
      await refreshData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Pre-assignment failed',
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span>Users &amp; Role Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign business roles across ERP, CRM, Catalog &amp; WhatsApp, or delete user accounts cleanly for re-signup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRoleGuide(!showRoleGuide)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Info className="w-4 h-4 text-primary" />
            <span>{showRoleGuide ? 'Hide Role Matrix' : 'Role Permissions Guide'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Pre-Assign Team Role</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Registered Users
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Team &amp; Admin Roles
          </span>
          <div className="text-2xl font-black font-mono text-purple-700 mt-1">
            {stats.teamCount}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Verified Customers
          </span>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
            {stats.verifiedCustomers}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Pending OTP Verification
          </span>
          <div className="text-2xl font-black font-mono text-amber-600 mt-1">
            {stats.pendingVerify}
          </div>
        </div>
      </div>

      {/* Role Matrix Guide */}
      {showRoleGuide && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>TOLAND Role Permissions Overview</span>
            </h2>
            <span className="text-[11px] text-slate-500">
              Sidebar &amp; API routes automatically filter by assigned role
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_ROLES.map((r) => {
              const meta = ROLE_META[r];
              return (
                <div
                  key={r}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{r}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {meta.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Role Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or +91 mobile..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({users.length})
          </button>
          {ALL_ROLES.map((r) => {
            const count = users.filter((u) => u.role === r).length;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  roleFilter === r
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ROLE_META[r].shortLabel} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">User Identity</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Orders</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const meta = ROLE_META[u.role];
                  const isUpdating = updatingId === u.id;
                  const disabledControls = u.isProtected || u.isSelf || isUpdating;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate max-w-[180px]">{u.name}</span>
                              {u.isProtected && (
                                <span
                                  title="Primary Owner Account (Protected)"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  Owner
                                </span>
                              )}
                              {u.isSelf && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              {u.email && (
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{u.email}</span>
                                </span>
                              )}
                              {u.phone && (
                                <span className="inline-flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{u.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.email && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.emailConfirmed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {u.emailConfirmed ? 'Email Verified' : 'Email OTP Pending'}
                            </span>
                          )}
                          {u.phoneConfirmed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              WhatsApp Verified
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={disabledControls}
                            onChange={(e) =>
                              handleRoleChange(u, e.target.value as AppRole)
                            }
                            aria-label={`Assign role for ${u.name}`}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${meta.badgeClass} ${
                              disabledControls
                                ? 'opacity-75 cursor-not-allowed'
                                : 'cursor-pointer hover:brightness-95'
                            }`}
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_META[r].label}
                              </option>
                            ))}
                          </select>
                          {isUpdating && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-900">{u.ordersCount}</span>
                          {u.totalSpent > 0 && (
                            <span className="text-[11px] text-slate-500">
                              (₹{u.totalSpent.toLocaleString('en-IN')})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        <div>
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {u.lastSignInAt && (
                          <div className="text-[10px] text-slate-400">
                            Last:{' '}
                            {new Date(u.lastSignInAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {u.isProtected || u.isSelf ? (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Delete user so they can re-signup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-Authorized Allowlist Summary */}
      {allowlist.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Team Role Allowlist ({allowlist.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {allowlist.map((entry) => (
              <div
                key={entry.id}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
              >
                <span className="font-mono font-semibold text-slate-800">
                  {entry.email || entry.phone}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    ROLE_META[entry.role]?.badgeClass ||
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {ROLE_META[entry.role]?.shortLabel || entry.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete User Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Account for <strong className="text-slate-900">{deleteTarget.name}</strong> (
                  {deleteTarget.email || deleteTarget.phone})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <p>
                &bull; Deletes login account, profile, saved addresses &amp; active sessions immediately.
              </p>
              <p>
                &bull; Clears role allowlist &amp; OTP locks so the user can <strong>sign up again anytime with the exact same mobile or email</strong>.
              </p>
              {deleteTarget.ordersCount > 0 && (
                <p className="text-amber-700 font-semibold">
                  &bull; {deleteTarget.ordersCount} past GST order record(s) will remain archived in Orders without blocking re-signup.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Assign Team Role Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Assign Team Role by Email / Mobile</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePreAssignRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="manager@toland.in"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (10-digit Indian)
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AppRole)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {TEAM_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_META[r].label} — {ROLE_META[r].description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  placeholder="e.g. Sheikhpura Factory Floor Manager"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Team Role</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
