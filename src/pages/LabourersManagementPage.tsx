import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  MapPin,
  Shield,
  ArrowRightLeft,
  KeyRound,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Briefcase,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { MapLocationPicker } from '../components/MapLocationPicker';

export function LabourersManagementPage() {
  const { user, isAdminAny, isMasterAdmin } = useAuth();
  const [labourers, setLabourers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [worksites, setWorksites] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [worksiteFilter, setWorksiteFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    fullName: '',
    mobileNumber: '',
    aadhaarNumber: '',
    assignedTeamId: '',
    assignedWorksiteId: '',
    assignedSupervisorId: '',
    labourCategoryId: '',
    designation: '',
    dailyRate: 1000,
    hourlyRate: 125,
    loginMethod: 'both',
    password: 'Password@123',
  });
  const [regError, setRegError] = useState<string | null>(null);

  // Transfer Team Modal
  const [transferTarget, setTransferTarget] = useState<any | null>(null);
  const [newTeamId, setNewTeamId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Password Reset Modal
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadData = async () => {
    try {
      const [labs, tms, ws, cats, usrs] = await Promise.all([
        api.labourers.list(),
        api.teams.list(),
        api.worksites.list(),
        api.categories.list(),
        api.users.list(),
      ]);

      setLabourers(labs || []);
      setTeams(tms || []);
      setWorksites(ws || []);
      setCategories(cats || []);
      // Filter potential supervisors (admins or staff)
      setSupervisors((usrs || []).filter((u: any) => u.role !== 'labourer'));

      // Set defaults for regForm
      if (tms && tms.length > 0 && !regForm.assignedTeamId) {
        setRegForm((prev) => ({
          ...prev,
          assignedTeamId: tms[0].id,
          assignedWorksiteId: ws && ws.length > 0 ? ws[0].id : '',
          assignedSupervisorId: user ? user.id : '',
          labourCategoryId: cats && cats.length > 0 ? cats[0].id : '',
        }));
      }
    } catch (err: any) {
      console.error('Failed to load labourers data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLabourer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regForm.fullName || !regForm.mobileNumber) {
      setRegError('Full Name and 10-digit Mobile Number are required.');
      return;
    }

    try {
      await api.labourers.create(regForm);
      setShowRegModal(false);
      setRegForm({
        fullName: '',
        mobileNumber: '',
        aadhaarNumber: '',
        assignedTeamId: teams[0]?.id || '',
        assignedWorksiteId: worksites[0]?.id || '',
        assignedSupervisorId: user?.id || '',
        labourCategoryId: categories[0]?.id || '',
        designation: '',
        dailyRate: 1000,
        hourlyRate: 125,
        loginMethod: 'both',
        password: 'Password@123',
      });
      await loadData();
    } catch (err: any) {
      setRegError(err.message || 'Failed to register labourer account.');
    }
  };

  const handleTransferTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !newTeamId) return;

    try {
      await api.labourers.transferTeam(transferTarget.id, newTeamId, transferReason);
      setTransferTarget(null);
      setNewTeamId('');
      setTransferReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer labourer.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !newPassword) return;

    try {
      await api.labourers.resetPassword(resetTarget.id, newPassword);
      setResetTarget(null);
      setNewPassword('');
      alert('Password updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password.');
    }
  };

  const filteredLabourers = labourers.filter((l) => {
    const matchesSearch =
      l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.mobile_number?.includes(search) ||
      l.masked_aadhaar?.includes(search) ||
      l.designation?.toLowerCase().includes(search.toLowerCase());

    const matchesTeam = !teamFilter || l.assigned_team_id === teamFilter;
    const matchesWorksite = !worksiteFilter || l.assigned_worksite_id === worksiteFilter;

    return matchesSearch && matchesTeam && matchesWorksite;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-[#0E6037]" />
            <span>Labourer Account &amp; Identity Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register individual worker accounts, assign teams and supervisors, manage masked Aadhaar identity references, and configure login policies.
          </p>
        </div>

        <button
          onClick={() => {
            setRegError(null);
            setShowRegModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#0E6037] hover:bg-[#0B4D2C] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Labourer</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by worker name, mobile, Aadhaar..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0E6037]/20 focus:border-[#0E6037]"
          />
        </div>

        <div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={worksiteFilter}
            onChange={(e) => setWorksiteFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="">All Worksites</option>
            {worksites.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Labourers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading labourers...</div>
        ) : filteredLabourers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No labourer accounts match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Worker Profile</th>
                  <th className="py-3 px-4">Contact &amp; Identity</th>
                  <th className="py-3 px-4">Assigned Team &amp; Site</th>
                  <th className="py-3 px-4">Designation &amp; Rates</th>
                  <th className="py-3 px-4">Login Method</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLabourers.map((lab) => (
                  <tr key={lab.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0E6037] font-bold flex items-center justify-center shrink-0">
                          {lab.full_name?.charAt(0) || 'L'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{lab.full_name}</div>
                          <div className="text-[11px] text-slate-400">
                            Sup: {lab.supervisor_name || 'Admin'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1 text-slate-700 font-mono text-xs">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {lab.mobile_number || '—'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Aadhaar: <span className="font-semibold">{lab.masked_aadhaar || 'Not Collected'}</span>
                      </div>
                    </td>

                    {/* Team & Worksite */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{lab.team_name || 'Unassigned Team'}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#0E6037]" />
                        <span className="truncate max-w-[150px]">{lab.worksite_name || 'Lumia Building Site'}</span>
                      </div>
                    </td>

                    {/* Designation & Rates */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {lab.designation || 'Labourer'}
                      </span>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Rate: <strong className="text-slate-900">₹{lab.daily_rate || 0}</strong>/day
                      </div>
                    </td>

                    {/* Login Method */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-[#0E6037] border border-emerald-200">
                        {lab.login_method || 'BOTH'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setTransferTarget(lab);
                            setNewTeamId(lab.assigned_team_id || '');
                          }}
                          className="p-1.5 text-slate-600 hover:text-[#0E6037] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Transfer Labourer to Another Team"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setResetTarget(lab);
                            setNewPassword('');
                          }}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Reset Login Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Labourer Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#0E6037]" />
                <span>Register Individual Labourer Account</span>
              </h3>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLabourer} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regForm.mobileNumber}
                    onChange={(e) => setRegForm({ ...regForm, mobileNumber: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar (Optional)</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={regForm.aadhaarNumber}
                    onChange={(e) => setRegForm({ ...regForm, aadhaarNumber: e.target.value })}
                    placeholder="1234 5678 9012"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Will be masked as XXXX-XXXX-9012</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Team *</label>
                  <select
                    value={regForm.assignedTeamId}
                    onChange={(e) => {
                      const tId = e.target.value;
                      const selTeam = teams.find((t) => t.id === tId);
                      setRegForm({
                        ...regForm,
                        assignedTeamId: tId,
                        assignedWorksiteId: selTeam?.assigned_worksite_id || regForm.assignedWorksiteId,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Worksite *</label>
                  <select
                    value={regForm.assignedWorksiteId}
                    onChange={(e) => setRegForm({ ...regForm, assignedWorksiteId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    {worksites.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.radius_meters || 150}m)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Map Preview of Assigned Geofence Range */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#0E6037]">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Team / Worksite GPS Geofence Range</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Radius: {worksites.find((w) => w.id === regForm.assignedWorksiteId)?.radius_meters || 150}m
                  </span>
                </div>
                <MapLocationPicker
                  latitude={worksites.find((w) => w.id === regForm.assignedWorksiteId)?.latitude || teams.find((t) => t.id === regForm.assignedTeamId)?.site_latitude || 12.9715987}
                  longitude={worksites.find((w) => w.id === regForm.assignedWorksiteId)?.longitude || teams.find((t) => t.id === regForm.assignedTeamId)?.site_longitude || 77.5945627}
                  radiusMeters={worksites.find((w) => w.id === regForm.assignedWorksiteId)?.radius_meters || teams.find((t) => t.id === regForm.assignedTeamId)?.geofence_radius_meters || 150}
                  readOnly={true}
                  showControls={false}
                  height="180px"
                  label="Assigned Attendance Perimeter"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Attendance Supervisor *</label>
                  <select
                    value={regForm.assignedSupervisorId}
                    onChange={(e) => setRegForm({ ...regForm, assignedSupervisorId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={regForm.designation}
                    onChange={(e) => setRegForm({ ...regForm, designation: e.target.value })}
                    placeholder="e.g. Lead Mason"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Wage Rate (₹)</label>
                  <input
                    type="number"
                    value={regForm.dailyRate}
                    onChange={(e) => setRegForm({ ...regForm, dailyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login Method</label>
                  <select
                    value={regForm.loginMethod}
                    onChange={(e) => setRegForm({ ...regForm, loginMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="both">Both (Mobile OTP + Password)</option>
                    <option value="otp">Mobile OTP Only</option>
                    <option value="password">Password Only</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                Default password for new labourer account: <code className="font-bold text-slate-800">Password@123</code>. The worker can sign in using either OTP sent to their mobile or with this password.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0E6037] hover:bg-[#0B4D2C] text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Team Modal */}
      {transferTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-[#0E6037]" />
              <span>Transfer Labourer: {transferTarget.full_name}</span>
            </h3>

            <p className="text-xs text-slate-500">
              Reassign this worker to a new team. All past attendance and historical reports remain intact under previous assignments.
            </p>

            <form onSubmit={handleTransferTeam} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Team *</label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Reason / Remarks</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Transferred to Lumia tower masonry team"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTransferTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0E6037] hover:bg-[#0B4D2C] text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <span>Reset Password: {resetTarget.full_name}</span>
            </h3>

            <p className="text-xs text-slate-500">
              Enter a new secure password for this labourer account.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min 6 Chars) *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0E6037] hover:bg-[#0B4D2C] text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
