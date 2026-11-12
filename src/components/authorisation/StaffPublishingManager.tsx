import React, { useState, useEffect } from 'react';
import { NewspaperProject } from '../../types/newspaper.ts';
import { loadAllProjects } from '../../services/storage.ts';
import {
  Radio,
  Clock,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  BookOpen,
  Sparkles,
  AlertCircle,
  Archive,
} from 'lucide-react';
import {
  subscribeProjects,
  subscribePublishedNewspaper,
  subscribeAllPublishedNewspapers,
  deletePublishedNewspaperFirestore,
  subscribeSubmissions,
  subscribeAnnouncements,
  acceptSubmissionFirestore,
  rejectSubmissionFirestore,
  publishDirectFirestore,
  unpublishFirestore,
  addAnnouncementFirestore,
  deleteAnnouncementFirestore,
  deleteProjectFirestore,
} from '../../services/firestoreStorage.ts';

interface PublishedNewspaperState {
  projectId: string;
  projectTitle: string;
  publishedAt: string;
  expiresAt: string;
  durationMinutes: number;
  isActive: boolean;
  projectData: NewspaperProject | null;
}

interface Announcement {
  id: string;
  text: string;
  active: boolean;
}

interface StaffPublishingManagerProps {
  projects?: NewspaperProject[];
  onRefreshData?: () => void;
}

export const StaffPublishingManager: React.FC<StaffPublishingManagerProps> = ({
  projects: propProjects,
  onRefreshData,
}) => {
  const [publishedData, setPublishedData] = useState<PublishedNewspaperState | null>(null);
  const [publishedList, setPublishedList] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [libraryProjects, setLibraryProjects] = useState<NewspaperProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(1440); // default 24 hours
  const [newAnnouncementText, setNewAnnouncementText] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');

  useEffect(() => {
    const loaded = loadAllProjects();
    const activeList = loaded && loaded.length > 0 ? loaded : propProjects || [];
    setLibraryProjects(activeList);
    if (activeList.length > 0 && !selectedProjectId) {
      setSelectedProjectId(activeList[0].id);
    }

    // Connect to real-time Firestore listeners
    const unsubPub = subscribePublishedNewspaper((pub) => {
      setPublishedData(pub);
    });

    const unsubPubList = subscribeAllPublishedNewspapers((list) => {
      setPublishedList(list);
    });

    const unsubSubs = subscribeSubmissions((subs) => {
      setSubmissions(subs);
    });

    const unsubAnn = subscribeAnnouncements((anns) => {
      setAnnouncements(anns);
    });

    const unsubProj = subscribeProjects((projs) => {
      setLibraryProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    });

    return () => {
      unsubPub();
      unsubPubList();
      unsubSubs();
      unsubAnn();
      unsubProj();
    };
  }, []);

  const handleDeletePublishedArchiveDoc = async (id: string) => {
    await deletePublishedNewspaperFirestore(id);
    setStatusMsg('Published document deleted from Archive.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const activeProjectsList = libraryProjects.length > 0 ? libraryProjects : propProjects || [];

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = activeProjectsList.find((p) => p.id === selectedProjectId) || activeProjectsList[0];
    if (!targetProject) {
      setStatusMsg('Please select or create a broadsheet newspaper in the library first.');
      return;
    }

    try {
      const ok = await publishDirectFirestore(targetProject, Number(durationMinutes) || 1440);
      // Background fallback
      fetch('/api/staff/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: targetProject,
          durationMinutes: Number(durationMinutes) || 1440,
        }),
      }).catch(() => {});

      if (ok) {
        setStatusMsg(`Successfully published "${targetProject.title}" for ${Math.round(Number(durationMinutes) / 60)} hours!`);
        setTimeout(() => setStatusMsg(''), 3500);
        if (onRefreshData) onRefreshData();
      } else {
        setStatusMsg('Failed to publish broadsheet. Please check connection.');
      }
    } catch (err) {
      console.error('Error publishing project:', err);
      setStatusMsg('Error publishing project.');
    }
  };

  const handleAcceptSubmission = async (id: string) => {
    try {
      const ok = await acceptSubmissionFirestore(id);
      fetch('/api/staff/accept-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(() => {});

      if (ok) {
        setStatusMsg('Newspaper submission accepted and published live instantly across all devices!');
        setTimeout(() => setStatusMsg(''), 3500);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Error accepting submission:', err);
    }
  };

  const handleRejectSubmission = async (id: string) => {
    try {
      await rejectSubmissionFirestore(id);
      fetch(`/api/staff/submission/${id}`, { method: 'DELETE' }).catch(() => {});
      setStatusMsg('Newspaper submission rejected.');
      setTimeout(() => setStatusMsg(''), 3500);
    } catch (err) {
      console.error('Error rejecting submission:', err);
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishFirestore();
      fetch('/api/staff/unpublish', { method: 'POST' }).catch(() => {});
      setStatusMsg('Active publication ended and archived.');
      setTimeout(() => setStatusMsg(''), 3000);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error unpublishing:', err);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;

    try {
      const ok = await addAnnouncementFirestore(newAnnouncementText.trim());
      fetch('/api/staff/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newAnnouncementText.trim() }),
      }).catch(() => {});

      if (ok) {
        setNewAnnouncementText('');
        setStatusMsg('Broadcast ticker announcement posted live!');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error adding announcement:', err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncementFirestore(id);
      fetch(`/api/staff/announcements/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  return (
    <div className="space-y-8 text-neutral-100 font-sans p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border border-amber-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            <Radio className="w-4 h-4" />
            <span>FIREBASE FIRESTORE REAL-TIME PUBLISHING CONTROL</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            Live Newspaper Publishing &amp; Timer Schedule
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mt-1 leading-relaxed">
            Publish broadsheet newspapers to the main MJJ RECORDS public portal, review pending moderation submissions, and manage scrolling announcement ticker banners synced across all devices.
          </p>
        </div>
        <button
          onClick={async () => {
            if (window.confirm("DELETE ALL PROJECTS? This cannot be undone.")) {
              for (const p of libraryProjects) {
                await deleteProjectFirestore(p.id);
              }
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-rose-950/50 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-900/50 transition-all cursor-pointer"
        >
          DELETE ALL PROJECTS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Publish Controls */}
        <div className="lg:col-span-6 bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#252532]">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="font-serif font-bold text-base text-white">Publish Broadsheet to MJJ RECORDS</h3>
          </div>

          <form onSubmit={handlePublish} noValidate className="space-y-4 text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Select Newspaper Broadsheet from Library
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-[#181822] border border-[#2e2e3e] rounded-xl p-3 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {activeProjectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.pages.length} Pages)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Active Publication Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#181822] border border-[#2e2e3e] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value={60}>1 Hour</option>
                <option value={360}>6 Hours</option>
                <option value={720}>12 Hours</option>
                <option value={1440}>24 Hours (1 Day)</option>
                <option value={4320}>3 Days</option>
                <option value={10080}>7 Days</option>
              </select>
            </div>

            {statusMsg && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>PUBLISH TO PUBLIC PORTAL</span>
            </button>
          </form>

          {/* Current Publication Status Card */}
          {publishedData && (
            <div className="mt-6 pt-4 border-t border-[#252532] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Current Live Status
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    publishedData.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {publishedData.isActive ? 'LIVE PUBLISHED' : 'INACTIVE'}
                </span>
              </div>

              {publishedData.isActive ? (
                <div className="p-4 bg-[#171722] border border-[#2e2e40] rounded-xl space-y-2">
                  <h4 className="font-serif font-bold text-sm text-white">
                    {publishedData.projectTitle}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Expires: {new Date(publishedData.expiresAt).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handleUnpublish}
                    className="w-full mt-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>End Publication &amp; Move to Archive Library</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 font-mono">
                  No newspaper is currently live on the public portal.
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Announcement Banner Ticker Manager */}
        <div className="lg:col-span-6 bg-[#121218] border border-[#2b2b38] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#252532]">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="font-serif font-bold text-base text-white">
              Public Marquee Banner Announcements
            </h3>
          </div>

          <form onSubmit={handleAddAnnouncement} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Add Ticker Announcement Message
              </label>
              <textarea
                rows={2}
                value={newAnnouncementText}
                onChange={(e) => setNewAnnouncementText(e.target.value)}
                placeholder="Enter moving ticker message text..."
                className="w-full bg-[#181822] border border-[#2e2e3e] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>POST ANNOUNCEMENT LIVE TO MARQUEE</span>
            </button>
          </form>

          {/* List of Tickers */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-mono text-neutral-400 block">
              ACTIVE TICKER ANNOUNCEMENTS ({announcements.length}):
            </span>
            {announcements.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono italic">No announcements added yet. Type a message above and click Post Announcement Live.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 bg-[#171720] border border-[#292938] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <p className="text-neutral-200 font-mono text-[11px] leading-relaxed flex-1">
                      {ann.text}
                    </p>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded shrink-0 cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PENDING NEWSPAPER MODERATION SUBMISSIONS QUEUE */}
      <div className="bg-[#121218] border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#252532]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-base text-white">
              Pending Newspaper Moderation Submissions ({submissions.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
            FIREBASE REAL-TIME QUEUE
          </span>
        </div>

        {submissions.length === 0 ? (
          <p className="text-xs text-neutral-500 font-mono italic">
            No newspaper submissions awaiting moderation. When editors submit broadsheets from Newspaper Studio, they will appear here in real-time for review and instant publication upon acceptance.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 bg-[#171722] border border-[#2e2e40] rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-serif font-bold text-sm text-amber-300 truncate">
                      {sub.projectTitle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                      {Math.round(sub.durationMinutes / 60)}h Duration
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Submitted: {new Date(sub.submittedAt).toLocaleString()} ({sub.project?.pages?.length || 1} Pages)
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#252532]">
                  <button
                    onClick={() => handleAcceptSubmission(sub.id)}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    <span>ACCEPT &amp; PUBLISH NOW</span>
                  </button>
                  <button
                    onClick={() => handleRejectSubmission(sub.id)}
                    className="py-2 px-3 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Reject Submission"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PUBLISHED DOCUMENTS ARCHIVE MANAGER */}
      <div className="bg-[#121218] border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#252532]">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-base text-white">
              Public Archival Library Manager ({publishedList.length} Published Broadsheets)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-bold">
            FIRESTORE PUBLISHED ARCHIVE
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          This archive displays all broadsheets that have been published through the Authorisation Centre. Staff can review and remove documents from the public portal's Archival Library at any time.
        </p>

        {publishedList.length === 0 ? (
          <div className="bg-[#171720] border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500 font-mono">
            No published broadsheets in the archive yet. Once you publish a newspaper above or accept a moderation submission, it will automatically appear in the Public Archival Library.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedList.map((pubDoc) => (
              <div
                key={pubDoc.id}
                className="p-4 bg-[#171722] border border-[#2e2e40] rounded-xl space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif font-bold text-sm text-white truncate">
                      {pubDoc.title || pubDoc.projectTitle || pubDoc.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        pubDoc.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {pubDoc.isActive ? 'LIVE ON AIR' : 'ARCHIVED'}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-400 font-mono space-y-0.5">
                    <div>Published: {pubDoc.publishedAt ? new Date(pubDoc.publishedAt).toLocaleString() : 'Recently'}</div>
                    <div>Pages: {pubDoc.pages?.length || 1} Broadsheet Pages</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#252532] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-amber-400 font-mono">
                    ID: {pubDoc.id?.slice(0, 14)}...
                  </span>
                  <button
                    onClick={() => handleDeletePublishedArchiveDoc(pubDoc.id)}
                    className="p-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Remove from Public Archival Library"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Archive</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
