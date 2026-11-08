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
} from 'lucide-react';

export interface MarketingApplication {
  id: string;
  discordUser: string;
  fullName: string;
  reason: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Reviewed' | 'Rejected';
}

export const StaffMarketingApplications: React.FC = () => {
  const [applications, setApplications] = useState<MarketingApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/staff/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching marketing applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // Real-time sync every 2 seconds across connected clients
    const interval = setInterval(fetchApplications, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: MarketingApplication['status']) => {
    try {
      const res = await fetch('/api/staff/update-application-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/application/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchApplications();
      }
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
            Marketing Team Recruitment Applications ({applications.length})
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mt-1 leading-relaxed">
            Review incoming public recruitment submissions for the MJJ Records Marketing division. Verify applicant Discord handles and motivations in real-time.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 px-4 py-2 bg-[#1b1b26] hover:bg-[#252534] text-neutral-200 border border-[#333344] rounded-xl text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Sync Real-Time Applications</span>
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
            <option value="approved">Approved</option>
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
              className="bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
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

              <div className="pt-3 border-t border-[#22222f] flex items-center justify-between gap-2 text-xs">
                <span className="text-[10px] text-neutral-500 font-mono">
                  Submitted: {new Date(app.submittedAt).toLocaleString()}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'Approved')}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                    title="Approve Application"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Approve</span>
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
    </div>
  );
};
