import React, { useState, useEffect } from 'react';
import { NewspaperProject } from '../../types/newspaper.ts';
import { loadAllProjects } from '../../services/storage.ts';
import {
  Gift,
  Plus,
  Trash2,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface PromoCodeData {
  id: string;
  code: string;
  projectId: string;
  pageIndex: number;
  probability: number;
  maxRedemptions: number;
  redemptionsCount: number;
  customMessage: string;
  active: boolean;
}

interface UserRedemptionData {
  id: string;
  code: string;
  discordUser: string;
  customMessage: string;
  redeemedAt: string;
}

interface StaffCodeManagerProps {
  projects?: NewspaperProject[];
}

export const StaffCodeManager: React.FC<StaffCodeManagerProps> = ({ projects: propProjects }) => {
  const [promoCodes, setPromoCodes] = useState<PromoCodeData[]>([]);
  const [redemptions, setRedemptions] = useState<UserRedemptionData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Library Projects state (Loaded from Document Library)
  const [libraryProjects, setLibraryProjects] = useState<NewspaperProject[]>([]);

  // New Code Form state
  const [codeString, setCodeString] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [probability, setProbability] = useState<number>(50);
  const [maxRedemptions, setMaxRedemptions] = useState<number>(1);
  const [customMessage, setCustomMessage] = useState<string>(
    '🎉 Congratulations! You unlocked an exclusive MJJ Records Master Pass! Contact @MJJAdmin on Discord to claim your VIP role.'
  );
  const [statusMsg, setStatusMsg] = useState<string>('');

  const fetchCodesAndRedemptions = async () => {
    try {
      const res = await fetch('/api/staff/codes-and-redemptions');
      if (res.ok) {
        const data = await res.json();
        setPromoCodes(data.promoCodes || []);
        setRedemptions(data.redemptions || []);
      }
    } catch (err) {
      console.error('Error fetching code data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load all broadsheet projects from Document Library
    const loaded = loadAllProjects();
    setLibraryProjects(loaded && loaded.length > 0 ? loaded : (propProjects || []));

    fetchCodesAndRedemptions();
    // Polling every 2 seconds for real-time sync across connected clients
    const interval = setInterval(fetchCodesAndRedemptions, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateRandomCode = () => {
    const random = `MJJ-${Math.floor(100000 + Math.random() * 900000)}`;
    setCodeString(random);
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: codeString || `MJJ-${Math.floor(100000 + Math.random() * 900000)}`,
        projectId: selectedProjectId,
        pageIndex: selectedPageNum,
        probability,
        maxRedemptions,
        customMessage,
      };

      const res = await fetch('/api/staff/create-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatusMsg('Secret Reward Code created successfully!');
        setCodeString('');
        setTimeout(() => setStatusMsg(''), 3000);
        fetchCodesAndRedemptions();
      }
    } catch (err) {
      console.error('Error creating code:', err);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      const res = await fetch(`/api/staff/code/${codeId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCodesAndRedemptions();
      }
    } catch (err) {
      console.error('Error deleting code:', err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const activeProjectsList = libraryProjects.length > 0 ? libraryProjects : (propProjects || []);

  return (
    <div className="space-y-8 font-sans text-neutral-100 p-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900 to-amber-950/60 border border-amber-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            <Gift className="w-4 h-4" />
            <span>DISCORD REWARD &amp; SECRET CODE MANAGEMENT</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            Hidden Code Generator &amp; User Redemptions Log
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mt-1 leading-relaxed">
            Place hidden secret codes inside active broadsheets with customizable probability chances (e.g. 25%, 50%, 100%) and max redemptions (1 or 2 claims).
          </p>
        </div>

        <button
          onClick={fetchCodesAndRedemptions}
          className="flex items-center gap-2 px-4 py-2 bg-[#1b1b26] hover:bg-[#252534] text-neutral-200 border border-[#333344] rounded-xl text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Sync Real-Time Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Create Code Form */}
        <div className="lg:col-span-5 bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#252532]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-serif font-bold text-base text-white">Create Secret Reward Code</h3>
          </div>

          <form onSubmit={handleCreateCode} className="space-y-4 text-xs">
            {/* Code Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold uppercase tracking-wider text-neutral-300">
                  Secret Code
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomCode}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Random Code</span>
                </button>
              </div>
              <input
                type="text"
                value={codeString}
                onChange={(e) => setCodeString(e.target.value.toUpperCase())}
                placeholder="e.g. MJJ-THRILLER-777"
                className="w-full bg-[#181822] border border-[#2e2e3e] rounded-xl p-2.5 font-mono text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>

            {/* Target Broadsheet (Lists ALL projects from Document Library) */}
            <div>
              <label className="font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Target Broadsheet (Library Selection)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-[#181822] border border-[#2e2e3e] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Broadsheets in Document Library</option>
                {activeProjectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.pages.length} Pages)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Page */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Page Number
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={selectedPageNum}
                  onChange={(e) => setSelectedPageNum(Number(e.target.value))}
                  className="w-full bg-[#181822] border border-[#2e2e3e] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Max Redemptions */}
              <div>
                <label className="font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                  Max Redemptions
                </label>
                <select
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                  className="w-full bg-[#181822] border border-[#2e2e3e] rounded-xl p-2 text-xs text-amber-400 font-bold focus:outline-none"
                >
                  <option value={1}>1 Claim (First Reader Only)</option>
                  <option value={2}>2 Claims (First 2 Readers)</option>
                  <option value={5}>5 Claims</option>
                  <option value={100}>100 Claims (Unlimited)</option>
                </select>
              </div>
            </div>

            {/* Probability Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold uppercase tracking-wider text-neutral-300">
                  Discovery Probability Chance
                </label>
                <span className="font-mono text-amber-400 font-bold">{probability}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                At {probability}%, readers have a {probability}% chance of finding this code when flipping to page {selectedPageNum}.
              </p>
            </div>

            {/* Custom Reward Message */}
            <div>
              <label className="font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Customized Reward Message
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-[#181822] border border-[#2e2e3e] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                placeholder="Enter customized reward text..."
              />
            </div>

            {statusMsg && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>{statusMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Generate &amp; Publish Secret Code
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Code Registry & User Redemptions Log */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Promo Codes List */}
          <div className="bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#252532] pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-white">
                  Active Secret Codes ({promoCodes.length})
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">REAL-TIME ACTIVE</span>
            </div>

            {promoCodes.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 font-mono">
                No active codes created yet. Use the form on the left to generate one.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {promoCodes.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#171720] border border-[#292938] rounded-xl flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-400">
                          {item.code}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Chance: {item.probability}%
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          {item.redemptionsCount} / {item.maxRedemptions} Claimed
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1 italic">
                        "{item.customMessage}"
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(item.id, item.code)}
                        className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title="Copy Code"
                      >
                        {copiedCodeId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCode(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800"
                        title="Delete Code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Discord Redemption Audit Logs */}
          <div className="bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#252532] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-white">
                  User Discord Redemptions Log ({redemptions.length})
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">DISCORD AUDIT TRAIL</span>
            </div>

            {redemptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                No user redemptions recorded yet. When readers find a code and submit their Discord handle, claims will appear here instantly.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {redemptions.map((red) => (
                  <div
                    key={red.id}
                    className="p-3 bg-[#171720] border border-[#292938] rounded-xl flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
                          @{red.discordUser}
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 font-semibold">
                          Code: {red.code}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Redeemed: {new Date(red.redeemedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        VERIFIED CLAIM
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
