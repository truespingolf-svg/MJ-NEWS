import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  MessageSquare,
  Trash2,
  ShieldCheck,
  Sparkles,
  Award,
  Bell,
  Send,
} from 'lucide-react';

import {
  subscribeMarketingApplications,
  updateApplicationStatusFirestore,
  deleteApplicationFirestore,
  assignApplicantRoleAndNotifyFirestore,
} from '../../services/firestoreStorage.ts';

export interface MarketingApplication {
  id: string;
  discordUser: string;
  fullName: string;
  reason: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Reviewed' | 'Rejected';
}

const PRESET_ROLES = [
  'App Moderator',
  'Newspaper Specialist',
  'Challenge Maker',
  'Marketing Executive',
  'Broadsheet Contributor',
  'VIP Ambassador',
];

export const StaffMarketingApplications: React.FC = () => {
  const [applications, setApplications] = useState<MarketingApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Role Assignment Modal state
  const [selectedApp, setSelectedApp] = useState<MarketingApplication | null>(null);
  const [roleToAssign, setRoleToAssign] = useState<string>(PRESET_ROLES[0]);
  const [customNotification, setCustomNotification] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    const unsubscribe = subscribeMarketingApplications((apps) => {
      setApplications(apps as MarketingApplication[]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenRoleModal = (app: MarketingApplication) => {
    setSelectedApp(app);
    setRoleToAssign(PRESET_ROLES[0]);
    setCustomNotification(
      `Congratulations @${app.discordUser}! Your application for the MJJ Records Marketing Team has been officially approved. You have been assigned the "${PRESET_ROLES[0]}" role. Welcome to the crew!`
    );
    setStatusMsg({ type: null, text: '' });
  };

  const handleConfirmRoleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setIsAssigning(true);
    setStatusMsg({ type: null, text: '' });

    try {
      const res = await assignApplicantRoleAndNotifyFirestore(
        selectedApp.discordUser,
        roleToAssign,
        customNotification
      );

      if (res.success) {
        await updateApplicationStatusFirestore(selectedApp.id, 'Approved');
        setStatusMsg({ type: 'success', text: res.message });
        setTimeout(() => {
          setSelectedApp(null);
        }, 1500);
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      console.error('Role assignment error:', err);
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to assign role.' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: MarketingApplication['status']) => {
    try {
      await updateApplicationStatusFirestore(id, newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplicationFirestore(id);
    } catch (err) {
      console.error('Error deleting application:', err);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.discordUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || app.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans text-neutral-100 p-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900 to-amber-950/60 border border-amber-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" />
            <span>MJJ RECORDS RECRUITMENT &amp; STAFFING GOVERNANCE</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            Marketing Recruitment &amp; Role Assignment ({applications.length})
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mt-1 leading-relaxed">
            Review applicant motivations and Discord handles. Staff can grant official app roles and dispatch customized notifications directly to their user inbox.
          </p>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 500);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1b1b26] hover:bg-[#252534] text-neutral-200 border border-[#333344] rounded-xl text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Sync Applications</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121218] border border-[#2b2b38] rounded-xl p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search applicants by Discord username or motivation..."
            className="w-full bg-[#181822] border border-[#2e2e3e] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#181822] border border-[#2e2e3e] rounded-lg px-3 py-1.5 text-xs text-amber-400 font-semibold focus:outline-none"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved &amp; Roled</option>
            <option value="reviewed">Under Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="bg-[#121218] border border-dashed border-[#2b2b38] rounded-2xl p-12 text-center text-xs text-neutral-500 font-mono">
          No marketing applications matching filter criteria. When public users submit applications on the main portal, they will appear here automatically.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-[#12121a] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        @{app.discordUser}
                      </span>
                      <span className="text-xs text-neutral-300 font-semibold">
                        {app.fullName}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      app.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : app.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : app.status === 'Reviewed'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="p-3.5 bg-[#171722] border border-[#262636] rounded-xl text-xs text-neutral-300 leading-relaxed font-sans">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                    Motivation &amp; Reason for Wanting to Work in Marketing:
                  </span>
                  <p className="whitespace-pre-wrap">"{app.reason}"</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#22222f] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[10px] text-neutral-500 font-mono">
                  Submitted: {new Date(app.submittedAt).toLocaleString()}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Role Applicant Button */}
                  <button
                    onClick={() => handleOpenRoleModal(app)}
                    className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer"
                    title="Role Applicant & Send Custom Notification"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Role &amp; Notify</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(app.id, 'Reviewed')}
                    className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded text-[11px] font-semibold transition-colors"
                    title="Mark as Under Review"
                  >
                    <span>Review</span>
                  </button>

                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded"
                    title="Delete Application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Assignment & Notification Customizer Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#12121a] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl p-1"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>ROLE APPLICANT &amp; NOTIFY IN-APP</span>
              </span>
              <h3 className="text-xl font-serif font-black text-white">
                Promote @{selectedApp.discordUser}
              </h3>
              <p className="text-xs text-neutral-400">
                Assign a role within the MJJ Records platform and send a custom notification directly to their notifications inbox.
              </p>
            </div>

            <form onSubmit={handleConfirmRoleAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Select Role to Assign
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roleToAssign}
                    onChange={(e) => setRoleToAssign(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400 font-sans"
                    required
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setRoleToAssign(e.target.value);
                        setCustomNotification(
                          `Congratulations @${selectedApp.discordUser}! You have been granted the "${e.target.value}" role at MJJ Records.`
                        );
                      }
                    }}
                    className="px-2 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-300"
                  >
                    <option value="">Presets...</option>
                    {PRESET_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Custom Notification Message (Delivered to Player Inbox)
                </label>
                <textarea
                  rows={4}
                  value={customNotification}
                  onChange={(e) => setCustomNotification(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400 font-sans"
                  required
                />
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
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 text-xs font-medium hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isAssigning ? (
                    'Assigning & Notifying...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Grant Role &amp; Send Notification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
