import React, { useState } from 'react';
import { NewspaperProject } from '../../types/newspaper.ts';
import { LayoutWireframe } from '../canvas/LayoutWireframes.tsx';
import {
  Newspaper,
  Plus,
  Copy,
  Trash2,
  Edit2,
  FileText,
  Clock,
  Sparkles,
  Download,
  Upload,
  Check,
  X,
  BookOpen,
  Flame,
  Send,
  Eye,
} from 'lucide-react';

interface DashboardProps {
  projects: NewspaperProject[];
  onCreateNew: () => void;
  onOpenProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteAllProjects?: () => Promise<void> | void;
  onPublishProject?: (project: NewspaperProject) => void;
  onPreviewProject?: (project: NewspaperProject) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onExportJson: (project: NewspaperProject) => void;
  onImportJson: (jsonStr: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onCreateNew,
  onOpenProject,
  onDuplicateProject,
  onDeleteProject,
  onDeleteAllProjects,
  onPublishProject,
  onPreviewProject,
  onRenameProject,
  onExportJson,
  onImportJson,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleStartRename = (project: NewspaperProject) => {
    setRenamingId(project.id);
    setNewTitle(project.title);
  };

  const handleSaveRename = (projectId: string) => {
    if (newTitle.trim()) {
      onRenameProject(projectId, newTitle.trim());
    }
    setRenamingId(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmDeleteAll = async () => {
    if (!onDeleteAllProjects) return;
    setIsDeletingAll(true);
    try {
      await onDeleteAllProjects();
    } finally {
      setIsDeletingAll(false);
      setConfirmDeleteAll(false);
    }
  };

  return (
    <div className="min-h-full pb-16 bg-[#070305] text-neutral-100 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="border-b border-red-950/80 bg-[#0d0204]/90 backdrop-blur px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shadow-inner">
            <Flame className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-serif font-black text-xl tracking-tight text-white flex items-center gap-2">
              MJJ NEWSPAPER STUDIO
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40">
                Official Broadsheet Press
              </span>
            </h1>
            <p className="text-xs text-neutral-400 font-mono tracking-wider">
              Custom Broadsheet Publishing Database
            </p>
          </div>
        </div>

        {/* Create New Newspaper & Import Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-[#14080b] hover:bg-[#200a10] border border-red-950 rounded-xl transition-colors">
            <Upload className="w-3.5 h-3.5 text-red-400" />
            <span>Import Project JSON</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={onCreateNew}
            aria-label="Create New Newspaper"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-red-950/60 transition-all font-sans cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Newspaper</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Newsroom Hero Pitch */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#180508] via-[#0d0204] to-[#120306] border border-red-900/80 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-red-400">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>MJJ RECORDS BROADSHEET PRESSROOM</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Create, customize, and publish authentic broadsheet editions.
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed font-sans">
              Only the newspapers you create are stored here. Choose from 9 fully editable layouts, upload photographs from your device, download multi-page PDFs, and publish live or send to moderation.
            </p>
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer font-sans"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Start Blank Front Cover
              </button>
            </div>
          </div>
        </div>

        {/* Section: My Newspapers */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-950/80 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-serif font-bold tracking-tight text-white uppercase">
                My Newspapers ({projects.length})
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                Saved broadsheet database
              </span>

              {projects.length > 0 && onDeleteAllProjects && (
                confirmDeleteAll ? (
                  <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-500/60 px-3 py-1.5 rounded-xl">
                    <span className="text-[11px] font-bold text-rose-200">
                      Delete all {projects.length} projects?
                    </span>
                    <button
                      type="button"
                      disabled={isDeletingAll}
                      onClick={handleConfirmDeleteAll}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingAll ? 'Deleting...' : 'Confirm Delete All'}
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingAll}
                      onClick={() => setConfirmDeleteAll(false)}
                      className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Projects</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="bg-[#100407] border border-dashed border-red-950/80 rounded-2xl p-12 text-center text-xs text-neutral-500 font-mono space-y-3">
              <Newspaper className="w-8 h-8 text-red-900/80 mx-auto" />
              <p>No broadsheet projects yet. Click &ldquo;Create New Newspaper&rdquo; above to create your first edition.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const coverPage = project.pages[0];
                const isRenaming = renamingId === project.id;
                const isDeleting = deleteConfirmId === project.id;

                return (
                  <div
                    key={project.id}
                    className="group rounded-2xl bg-[#120407] border border-red-950/80 hover:border-red-500/50 hover:bg-[#180509] transition-all flex flex-col justify-between overflow-hidden shadow-xl"
                  >
                    {/* Card Header & Title */}
                    <div className="p-4 border-b border-red-950/80 bg-[#0d0204]/60">
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleSaveRename(project.id)
                            }
                            autoFocus
                            className="flex-1 bg-[#1a080d] border border-red-400 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveRename(project.id)}
                            className="p-1 rounded-lg bg-red-600 text-white hover:bg-red-500"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              onClick={() => onOpenProject(project.id)}
                              className="font-serif font-bold text-base text-white group-hover:text-red-400 cursor-pointer transition-colors line-clamp-1"
                            >
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-neutral-500" />
                                {project.pages.length} {project.pages.length === 1 ? 'Page' : 'Pages'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                {formatDate(project.updatedAt)}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartRename(project)}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded"
                            title="Rename Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Visual Wireframe / Broadsheet Preview Thumbnail */}
                    <div
                      onClick={() => onOpenProject(project.id)}
                      className="p-4 cursor-pointer bg-black/60 flex items-center justify-center hover:bg-black/30 transition-colors"
                    >
                      <div className="w-full max-w-[220px] shadow-md border border-neutral-700/60 rounded p-1 bg-stone-100">
                        <LayoutWireframe
                          layoutId={coverPage?.layoutId || 'front-cover'}
                          className="w-full h-36"
                        />
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 border-t border-red-950/80 bg-[#0d0204]/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenProject(project.id)}
                          className="px-3 py-1.5 bg-[#1f070c] hover:bg-red-600 hover:text-white text-red-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-red-500/30"
                        >
                          Open Editor
                        </button>

                        {onPublishProject && (
                          <button
                            onClick={() => onPublishProject(project)}
                            className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-400 hover:text-black text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-amber-500/40 flex items-center gap-1"
                            title="Publish or Send to Moderation"
                          >
                            <Send className="w-3 h-3" />
                            <span>Publish / Mod</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {onPreviewProject && (
                          <button
                            onClick={() => onPreviewProject(project)}
                            className="p-1.5 text-neutral-400 hover:text-amber-300 rounded hover:bg-neutral-800 cursor-pointer"
                            title="Preview in 3D Flipbook"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onExportJson(project)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                          title="Download Backup JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDuplicateProject(project.id)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                          title="Duplicate Newspaper"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {isDeleting ? (
                          <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-lg border border-red-800">
                            <button
                              onClick={() => {
                                onDeleteProject(project.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 text-[10px] bg-red-600 text-white rounded font-bold hover:bg-red-500"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-0.5 text-neutral-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(project.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
