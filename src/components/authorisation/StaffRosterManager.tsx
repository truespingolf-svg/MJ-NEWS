import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  StaffMember,
  subscribeStaffMembers,
  saveStaffMemberFirestore,
  deleteStaffMemberFirestore,
  addStaffAuditLogFirestore,
} from '../../services/firestoreStorage.ts';

const ROLES: StaffMember['role'][] = [
  'OWNER',
  'ADMINISTRATOR',
  'EDITOR',
  'CHALLENGE MANAGER',
  'STAFF',
  'MARKETING LEAD',
];

export const StaffRosterManager: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<StaffMember['role']>(ROLES[1]);
  const [bio, setBio] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [department, setDepartment] = useState('Executive Board');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    const unsub = subscribeStaffMembers((list) => {
      setStaffList(list);
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setSelectedStaff(null);
    setName('');
    setPosition('');
    setRole('STAFF');
    setBio('');
    setDiscordHandle('');
    setAvatarUrl('/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg');
    setDepartment('Operations');
    setIsEditing(true);
    setStatusMsg({ type: null, text: '' });
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setName(staff.name);
    setPosition(staff.position);
    setRole(staff.role);
    setBio(staff.bio);
    setDiscordHandle(staff.discordHandle || '');
    setAvatarUrl(staff.avatarUrl);
    setDepartment(staff.department);
    setIsEditing(true);
    setStatusMsg({ type: null, text: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter staff name and official position.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const memberToSave: StaffMember = {
        id: selectedStaff ? selectedStaff.id : `staff-${Date.now()}`,
        name: name.trim(),
        position: position.trim(),
        role,
        bio: bio.trim() || 'Official staff member at MJJ Records.',
        discordHandle: discordHandle.trim().replace(/^@/, ''),
        avatarUrl: avatarUrl.trim() || '/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg',
        department: department.trim() || 'Executive Operations',
        order: selectedStaff ? selectedStaff.order : staffList.length + 1,
      };

      await saveStaffMemberFirestore(memberToSave);

      await addStaffAuditLogFirestore({
        staffName: 'Staff Executive',
        staffRole: 'ADMINISTRATOR',
        actionType: 'UPDATE_COUNTDOWN',
        targetEntityId: memberToSave.id,
        targetEntityLabel: memberToSave.name,
        details: `${selectedStaff ? 'Updated' : 'Added'} staff member ${memberToSave.name} as ${memberToSave.position}`,
      });

      setStatusMsg({
        type: 'success',
        text: `Staff member "${memberToSave.name}" successfully saved and updated live!`,
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to save staff member:', err);
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to save staff roster changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, staffName: string) => {
    setIsSaving(true);
    try {
      await deleteStaffMemberFirestore(id);
      await addStaffAuditLogFirestore({
        staffName: 'Staff Executive',
        staffRole: 'ADMINISTRATOR',
        actionType: 'DELETE_USER',
        targetEntityId: id,
        targetEntityLabel: staffName,
        details: `Removed staff member ${staffName} from roster`,
      });
      setStatusMsg({ type: 'success', text: `Removed "${staffName}" from roster.` });
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to remove staff member.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-neutral-100 font-sans p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider">
              Staff Team &amp; Roster Management
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Add, update, or edit staff members, roles, bios, Discord handles, and positions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {isEditing ? (
        <div className="bg-[#12121a] border border-[#232332] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h3 className="text-base font-serif font-bold text-white">
              {selectedStaff ? `Edit Staff Member: ${selectedStaff.name}` : 'Add New Staff Member'}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Official Title / Position <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Archival Director & Master Audio Engineer"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Role Badge</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-300 text-xs font-mono focus:outline-none focus:border-amber-400"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Sound & Restoration"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">Discord Username</label>
                <input
                  type="text"
                  value={discordHandle}
                  onChange={(e) => setDiscordHandle(e.target.value)}
                  placeholder="e.g. vance_archival"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Biography / Responsibilities</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe this staff member's core duties, background, and production contributions..."
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Avatar / Profile Photo URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Image URL or leave blank for default stage photo"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 text-xs font-medium hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Staff Member'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staffList.map((member) => (
            <div
              key={member.id}
              className="bg-[#12121a] border border-[#232332] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-amber-500/40 transition-all shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-700 shrink-0">
                  <img
                    src={member.avatarUrl || '/src/assets/images/hero_mj_cinematic_stage_1794407118726.jpg'}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {member.role}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {member.department}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{member.name}</h4>
                  <p className="text-xs text-amber-400/90 font-medium">{member.position}</p>
                  {member.discordHandle && (
                    <p className="text-[11px] font-mono text-neutral-400">
                      Discord: @{member.discordHandle}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(member)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(member.id, member.name)}
                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
                  title="Remove Staff"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
