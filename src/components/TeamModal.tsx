import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { MapLocationPicker } from './MapLocationPicker';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTeam?: any;
}

export function TeamModal({ isOpen, onClose, onSuccess, editTeam }: TeamModalProps) {
  const [name, setName] = useState('');
  const [workCategory, setWorkCategory] = useState('');
  const [locationProject, setLocationProject] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [roles, setRoles] = useState<Array<{ categoryId: string; defaultRate: number; rateType: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [worksites, setWorksites] = useState<any[]>([]);
  const [assignedWorksiteId, setAssignedWorksiteId] = useState('');
  const [siteLatitude, setSiteLatitude] = useState<number | null>(12.9715987);
  const [siteLongitude, setSiteLongitude] = useState<number | null>(77.5945627);
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState(150);
  const [geofenceAccuracyThreshold, setGeofenceAccuracyThreshold] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (editTeam) {
        setName(editTeam.name);
        setWorkCategory(editTeam.work_category);
        setLocationProject(editTeam.location_project || '');
        setStatus(editTeam.status || 'active');
        setNotes(editTeam.notes || '');
        setAssignedWorksiteId(editTeam.assigned_worksite_id || '');
        setSiteLatitude(editTeam.site_latitude || 12.9715987);
        setSiteLongitude(editTeam.site_longitude || 77.5945627);
        setGeofenceRadiusMeters(editTeam.geofence_radius_meters || 150);
        setGeofenceAccuracyThreshold(editTeam.geofence_accuracy_threshold || 50);

        if (editTeam.roles) {
          setRoles(
            editTeam.roles.map((r: any) => ({
              categoryId: r.category_id,
              defaultRate: r.default_rate,
              rateType: r.rate_type || 'daily',
            }))
          );
        }
      } else {
        setName('');
        setWorkCategory('');
        setLocationProject('');
        setStatus('active');
        setNotes('');
        setAssignedWorksiteId('');
        setSiteLatitude(12.9715987);
        setSiteLongitude(77.5945627);
        setGeofenceRadiusMeters(150);
        setGeofenceAccuracyThreshold(50);
        setRoles([]);
      }
    }
  }, [isOpen, editTeam]);

  const loadInitialData = async () => {
    try {
      const [cats, wsList] = await Promise.all([
        api.categories.list(),
        api.worksites.list().catch(() => []),
      ]);
      setAvailableCategories(cats || []);
      setWorksites(wsList || []);

      if (!editTeam && wsList && wsList.length > 0) {
        setAssignedWorksiteId(wsList[0].id);
        setSiteLatitude(wsList[0].latitude);
        setSiteLongitude(wsList[0].longitude);
        setGeofenceRadiusMeters(wsList[0].radius_meters || 150);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleWorksiteSelect = (wsId: string) => {
    setAssignedWorksiteId(wsId);
    const found = worksites.find((w) => w.id === wsId);
    if (found) {
      setSiteLatitude(found.latitude);
      setSiteLongitude(found.longitude);
      setGeofenceRadiusMeters(found.radius_meters || 150);
      if (!locationProject) {
        setLocationProject(found.name);
      }
    }
  };

  const addRole = () => {
    if (availableCategories.length === 0) return;
    const cat = availableCategories[0];
    setRoles((prev) => [
      ...prev,
      {
        categoryId: cat.id,
        defaultRate: cat.default_rate || 1000,
        rateType: cat.rate_type || 'daily',
      },
    ]);
  };

  const removeRole = (index: number) => {
    setRoles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateRole = (index: number, field: string, val: any) => {
    setRoles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workCategory.trim()) {
      setError('Team name and work category are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        workCategory: workCategory.trim(),
        locationProject: locationProject.trim() || null,
        status,
        notes: notes.trim() || null,
        roles,
        assignedWorksiteId: assignedWorksiteId || null,
        siteLatitude,
        siteLongitude,
        geofenceRadiusMeters,
        geofenceAccuracyThreshold,
        attendanceMethod: 'both',
      };

      if (editTeam) {
        await api.teams.update(editTeam.id, payload);
      } else {
        await api.teams.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save team');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#696969]/20 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-3.5 bg-white border-b-2 border-[#456B5A] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm sm:text-base tracking-tight text-[#014025]">
              {editTeam ? 'Edit Team & Geofenced Site' : 'Create New Team & Geofenced Site'}
            </h2>
            <p className="text-[11px] text-[#456B5A]">
              Set team category, default labour rates, and real-map geofenced location range for GPS attendance
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#696969] hover:text-[#014025] hover:bg-[#696969]/10 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#014025] mb-1">
              Team / Contractor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Centring Murugan, Heeralal / Lumia Building, Ali Carpenter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#696969]/30 rounded-md px-3 py-2 text-xs bg-white text-[#014025] focus:ring-1 focus:ring-[#456B5A] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#014025] mb-1">
                Work Category *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Civil, Painting, Centring, Cleaning"
                value={workCategory}
                onChange={(e) => setWorkCategory(e.target.value)}
                className="w-full border border-[#696969]/30 rounded-md px-3 py-2 text-xs bg-white text-[#014025] focus:ring-1 focus:ring-[#456B5A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#014025] mb-1">
                Project / Site Location
              </label>
              <input
                type="text"
                placeholder="e.g. Main Tower, Block A"
                value={locationProject}
                onChange={(e) => setLocationProject(e.target.value)}
                className="w-full border border-[#696969]/30 rounded-md px-3 py-2 text-xs bg-white text-[#014025] focus:ring-1 focus:ring-[#456B5A] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#014025] mb-1">Notes / Description</label>
            <textarea
              rows={2}
              placeholder="Optional notes or contractual conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-[#696969]/30 rounded-md px-3 py-2 text-xs bg-white text-[#014025] focus:ring-1 focus:ring-[#456B5A] focus:outline-none"
            />
          </div>

          {/* Site Geofence Map Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#014025]" />
                <span className="font-bold text-xs text-[#014025]">
                  Site Location &amp; Attendance Geofence Range
                </span>
              </div>

              {/* Worksite preset selector */}
              {worksites.length > 0 && (
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-500 text-[11px]">Worksite Preset:</span>
                  <select
                    value={assignedWorksiteId}
                    onChange={(e) => handleWorksiteSelect(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#014025]"
                  >
                    <option value="">-- Custom Map Pin --</option>
                    {worksites.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.radius_meters || 150}m)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-600">
              Select or search the team site location on the real map below and configure the required attendance range circle. Team members can mark GPS attendance within this perimeter.
            </p>

            <MapLocationPicker
              latitude={siteLatitude}
              longitude={siteLongitude}
              radiusMeters={geofenceRadiusMeters}
              accuracyThreshold={geofenceAccuracyThreshold}
              onChange={(coords) => {
                setSiteLatitude(coords.latitude);
                setSiteLongitude(coords.longitude);
                setGeofenceRadiusMeters(coords.radiusMeters);
                if (coords.accuracyThreshold) setGeofenceAccuracyThreshold(coords.accuracyThreshold);
              }}
              height="250px"
              label="Team Site Geofence"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-[#014025]">
                Default Labour Roles &amp; Rates (Reusable Template)
              </span>
              <button
                type="button"
                onClick={addRole}
                className="flex items-center space-x-1 text-xs font-medium text-[#014025] bg-[#014025]/10 hover:bg-[#014025]/20 border border-[#014025]/20 px-2.5 py-1 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            <div className="space-y-2">
              {roles.map((r, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-[#696969]/5 border border-[#696969]/15 rounded p-2">
                  <select
                    value={r.categoryId}
                    onChange={(e) => updateRole(idx, 'categoryId', e.target.value)}
                    className="flex-1 border border-[#696969]/30 rounded px-2 py-1 text-xs bg-white text-[#014025] focus:ring-1 focus:ring-[#456B5A] focus:outline-none"
                  >
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center space-x-1">
                    <span className="text-[#696969] text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={r.defaultRate}
                      onChange={(e) => updateRole(idx, 'defaultRate', Number(e.target.value) || 0)}
                      className="w-20 border border-[#696969]/30 rounded px-2 py-1 text-xs text-right font-mono bg-white text-[#014025] font-semibold"
                    />
                    <span className="text-[10px] text-[#696969]">/day</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRole(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#696969]/15 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#696969]/30 text-[#696969] rounded-md text-xs font-medium hover:bg-[#696969]/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#014025] hover:bg-[#014025]/80 text-white rounded-md text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editTeam ? 'Update Team' : 'Save Team Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
