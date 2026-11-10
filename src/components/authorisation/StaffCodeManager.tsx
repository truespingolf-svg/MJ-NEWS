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
  Award,
  Globe,
  Ban,
  ShieldAlert,
} from 'lucide-react';

import {
  subscribeProjects,
  subscribePromoCodes,
  subscribeRedemptions,
  createPromoCodeFirestore,
  deletePromoCodeFirestore,
  GeneralPointsCode,
  subscribeGeneralCodes,
  createGeneralCodeFirestore,
  revokeGeneralCodeFirestore,
  deleteGeneralCodeFirestore,
} from '../../services/firestoreStorage.ts';

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
  const [activeTab, setActiveTab] = useState<'points' | 'secret' | 'logs'>('points');

  // Secret Broadsheet Codes state
  const [promoCodes, setPromoCodes] = useState<PromoCodeData[]>([]);
  const [redemptions, setRedemptions] = useState<UserRedemptionData[]>([]);
  const [generalCodes, setGeneralCodes] = useState<GeneralPointsCode[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Library Projects state (Loaded from Document Library)
  const [libraryProjects, setLibraryProjects] = useState<NewspaperProject[]>([]);

  // Secret Code Form state
  const [codeString, setCodeString] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [probability, setProbability] = useState<number>(50);
  const [maxRedemptions, setMaxRedemptions] = useState<number>(1);
  const [customMessage, setCustomMessage] = useState<string>(
    '🎉 Congratulations! You unlocked an exclusive MJJ Records Master Pass! Contact @MJJAdmin on Discord to claim your VIP role.'
  );

  // General Points Code Form state
  const [pointsCodeString, setPointsCodeString] = useState<string>('');
  const [pointsAmount, setPointsAmount] = useState<number>(1000);
  const [isUniversal, setIsUniversal] = useState<boolean>(true);
  const [generalMaxRedemptions, setGeneralMaxRedemptions] = useState<number>(10);
  const [generalCustomNote, setGeneralCustomNote] = useState<string>(
    'MJJ Community Celebration Points Reward'
  );

  const [statusMsg, setStatusMsg] = useState<string>('');

  useEffect(() => {
    // Load all broadsheet projects from Document Library
    const loaded = loadAllProjects();
    setLibraryProjects(loaded && loaded.length > 0 ? loaded : (propProjects || []));

    // Connect to real-time Firestore listeners
    const unsubCodes = subscribePromoCodes((codes) => {
      setPromoCodes(codes as PromoCodeData[]);
      setIsLoading(false);
    });

    const unsubRed = subscribeRedemptions((reds) => {
      setRedemptions(reds as UserRedemptionData[]);
    });

    const unsubProj = subscribeProjects((projs) => {
      setLibraryProjects(projs);
    });

    const unsubGenCodes = subscribeGeneralCodes((gCodes) => {
      setGeneralCodes(gCodes);
    });

    return () => {
      unsubCodes();
      unsubRed();
      unsubProj();
      unsubGenCodes();
    };
  }, []);

  const handleGenerateRandomCode = () => {
    const random = `MJJ-${Math.floor(100000 + Math.random() * 900000)}`;
    setCodeString(random);
  };

  const handleGenerateRandomPointsCode = () => {
    const random = `PTS-${Math.floor(100000 + Math.random() * 900000)}`;
    setPointsCodeString(random);
  };

  // Create Secret Broadsheet Code
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

      const ok = await createPromoCodeFirestore(payload);
      if (ok) {
        setStatusMsg('Secret Reward Code created and active in Firestore!');
        setCodeString('');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error creating code:', err);
    }
  };

  // Create General Points Code
  const handleCreateGeneralPointsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: pointsCodeString || `PTS-${Math.floor(100000 + Math.random() * 900000)}`,
        points: pointsAmount,
        isUniversal,
        maxRedemptions: generalMaxRedemptions,
        customNote: generalCustomNote,
      };

      const ok = await createGeneralCodeFirestore(payload);
      if (ok) {
        setStatusMsg(`Points Code "${payload.code}" (+${pointsAmount} Pts) is now active!`);
        setPointsCodeString('');
        setTimeout(() => setStatusMsg(''), 3500);
      }
    } catch (err) {
      console.error('Error creating points code:', err);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      await deletePromoCodeFirestore(codeId);
    } catch (err) {
      console.error('Error deleting code:', err);
    }
  };

  const handleRevokeGeneralCode = async (id: string) => {
    try {
      await revokeGeneralCodeFirestore(id);
      setStatusMsg('Points code has been revoked (taken away) successfully.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error('Error revoking points code:', err);
    }
  };

  const handleDeleteGeneralCode = async (id: string) => {
    try {
      await deleteGeneralCodeFirestore(id);
    } catch (err) {
      console.error('Error deleting points code:', err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const activeProjectsList = libraryProjects.length > 0 ? libraryProjects : (propProjects || []);

  return (
    <div className="space-y-6 font-sans text-neutral-100 p-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900 to-amber-950/60 border border-amber-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            <Gift className="w-4 h-4" />
            <span>REWARDS &amp; PROMO CODE GOVERNANCE</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            Reward Codes &amp; Points Generator
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mt-1 leading-relaxed">
            Generate general points reward codes for community players, or embed secret discovery codes inside broadsheet newspapers.
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
          <span>Sync Real-Time Data</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#2b2b38] pb-3">
        <button
          onClick={() => setActiveTab('points')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'points'
              ? 'bg-amber-400 text-black shadow-md'
              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>General Points Codes ({generalCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('secret')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'secret'
              ? 'bg-amber-400 text-black shadow-md'
              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Secret Broadsheet Codes ({promoCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-amber-400 text-black shadow-md'
              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Redemptions Log ({redemptions.length})</span>
        </button>
      </div>

      {/* TAB 1: GENERAL POINTS REWARD CODES */}
      {activeTab === 'points' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Points Code Form */}
          <div className="lg:col-span-5 bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#252532]">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif font-bold text-base text-white">Create Points Reward Code</h3>
            </div>

            <form onSubmit={handleCreateGeneralPointsCode} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold uppercase tracking-wider text-neutral-300">
                    Points Code String
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPointsCode}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={pointsCodeString}
                  onChange={(e) => setPointsCodeString(e.target.value.toUpperCase())}
                  placeholder="e.g. MOONWALKER-5000"
                  className="w-full bg-[#181824] border border-[#2b2b3a] rounded-lg px-3 py-2 text-white font-mono text-sm uppercase placeholder:normal-case placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Points Amount Granted
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[500, 1000, 2500, 5000].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setPointsAmount(pts)}
                      className={`py-1.5 rounded-lg font-mono font-bold text-xs border ${
                        pointsAmount === pts
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      +{pts}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(Number(e.target.value))}
                  min={10}
                  step={50}
                  className="w-full bg-[#181824] border border-[#2b2b3a] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Universal vs Limited Claims */}
              <div className="p-3 bg-[#181824] border border-[#2b2b3a] rounded-xl space-y-3">
                <label className="font-semibold uppercase tracking-wider text-neutral-300 block">
                  Eligibility &amp; Claims Limit
                </label>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isUniversal"
                      checked={isUniversal}
                      onChange={() => setIsUniversal(true)}
                      className="accent-amber-400"
                    />
                    <span className="text-white font-medium flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Everyone Can Use It (Universal)</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isUniversal"
                      checked={!isUniversal}
                      onChange={() => setIsUniversal(false)}
                      className="accent-amber-400"
                    />
                    <span className="text-white font-medium">Limited Claims</span>
                  </label>
                </div>

                {!isUniversal && (
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Maximum Allowed Claims:
                    </label>
                    <input
                      type="number"
                      value={generalMaxRedemptions}
                      onChange={(e) => setGeneralMaxRedemptions(Number(e.target.value))}
                      min={1}
                      max={500}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Custom Description / Note
                </label>
                <input
                  type="text"
                  value={generalCustomNote}
                  onChange={(e) => setGeneralCustomNote(e.target.value)}
                  placeholder="e.g. VIP Member Bonus Drop"
                  className="w-full bg-[#181824] border border-[#2b2b3a] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>ACTIVATE POINTS CODE GLOBALLY</span>
              </button>
            </form>
          </div>

          {/* Active Points Codes List */}
          <div className="lg:col-span-7 bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#252532] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-white">
                  Active Community Points Codes ({generalCodes.length})
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">STAFF CAN REVOKE ANYTIME</span>
            </div>

            {generalCodes.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                No points codes created yet. Use the form on the left to generate codes that give users points upon redemption.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {generalCodes.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      item.active
                        ? 'bg-[#171720] border-[#292938]'
                        : 'bg-[#131317] border-red-500/30 opacity-70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-amber-300">
                          {item.code}
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          +{item.points.toLocaleString()} PTS
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                            item.active
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {item.active ? 'ACTIVE' : 'REVOKED'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
                        <span>{item.isUniversal ? '🌐 Universal (Everyone)' : `Limit: ${item.maxRedemptions}`}</span>
                        <span>•</span>
                        <span>{item.redemptionsCount || 0} Claims Recorded</span>
                        <span>•</span>
                        <span className="text-neutral-500">{item.customNote}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopy(item.id, item.code)}
                        className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                        title="Copy Code"
                      >
                        {copiedCodeId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {item.active && (
                        <button
                          onClick={() => handleRevokeGeneralCode(item.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1"
                          title="Revoke / Take Away Code"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteGeneralCode(item.id)}
                        className="p-2 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SECRET BROADSHEET CODES */}
      {activeTab === 'secret' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#252532]">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif font-bold text-base text-white">Create Secret Newspaper Code</h3>
            </div>

            <form onSubmit={handleCreateCode} className="space-y-4 text-xs">
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
                  placeholder="e.g. MOONWALK-77"
                  className="w-full bg-[#181824] border border-[#2b2b3a] rounded-lg px-3 py-2 text-white font-mono text-sm uppercase placeholder:normal-case placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Target Broadsheet Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-[#181824] border border-[#2b2b3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="all">★ All Published Broadsheets (Universal)</option>
                  {activeProjectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.pages.length} Pages)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Discovery Probability ({probability}%)
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Custom Redemption Message
                </label>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-[#181824] border border-[#2b2b3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>SAVE NEWSPAPER CODE</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-serif font-bold text-base text-white border-b border-[#252532] pb-3">
              Active Broadsheet Secret Codes ({promoCodes.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {promoCodes.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#171720] border border-[#292938] rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-amber-300">{item.code}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {item.probability}% Chance
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">{item.customMessage}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCode(item.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISCORD REDEMPTIONS LOG */}
      {activeTab === 'logs' && (
        <div className="bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-serif font-bold text-base text-white border-b border-[#252532] pb-3">
            Discord Code Claims Audit Trail ({redemptions.length})
          </h3>
          {redemptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 font-mono">
              No redemptions recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {redemptions.map((red) => (
                <div
                  key={red.id}
                  className="p-3 bg-[#171720] border border-[#292938] rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded">
                      @{red.discordUser}
                    </span>
                    <span className="font-mono text-amber-400">Code: {red.code}</span>
                    <span className="text-neutral-400 text-[10px]">
                      {new Date(red.redeemedAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
