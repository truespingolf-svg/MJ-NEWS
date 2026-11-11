import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  UserCheck,
  Award,
  Trash2,
  Lock,
  Radio,
} from 'lucide-react';
import {
  StaffAuditLog,
  subscribeStaffAuditLogs,
} from '../../services/firestoreStorage.ts';

export const StaffAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<StaffAuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeStaffAuditLogs((list) => {
      setLogs(list);
    });
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filterAction === 'ALL' || log.actionType === filterAction;
    const matchesSearch =
      (log.staffName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.actionType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetEntityLabel || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('VOTE') || action.includes('POINTS')) {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
          {action}
        </span>
      );
    }
    if (action.includes('DELETE') || action.includes('WIPE')) {
      return (
        <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold">
          {action}
        </span>
      );
    }
    if (action.includes('LOCK') || action.includes('PORTAL')) {
      return (
        <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-neutral-100 font-sans p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-serif font-black text-white uppercase tracking-wider">
              Staff Administration Audit Trail
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Real-time immutable log of staff actions: bonus vote awards, points grants, event countdown modifications, account wipes, and takeover broadcasts.
          </p>
        </div>

        <span className="text-xs font-mono text-neutral-400 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 self-start sm:self-auto">
          Total Logged Actions: {logs.length}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by actor, reason, or target..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 font-mono focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Action Types</option>
            <option value="AWARD_VOTES">Award Votes / Points</option>
            <option value="UPDATE_COUNTDOWN">Event Countdown</option>
            <option value="LOCK_PORTAL">Portal Lock</option>
            <option value="DELETE_USER">Account Wipe / Deletion</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#12121a] border border-[#232332] rounded-2xl overflow-hidden shadow-xl">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-neutral-800/80">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-900/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.actionType)}
                    <span className="text-xs font-bold text-white">{log.staffName}</span>
                    <span className="text-[10px] text-amber-400 font-mono">({log.staffRole})</span>
                    {log.targetEntityLabel && (
                      <span className="text-[10px] font-mono text-neutral-400">
                        Target: {log.targetEntityLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-300">{log.details}</p>
                </div>

                <div className="text-[10px] font-mono text-neutral-500 shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                  <Clock className="w-3 h-3 text-neutral-600" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-neutral-500 font-mono">
            No audit log entries matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};
