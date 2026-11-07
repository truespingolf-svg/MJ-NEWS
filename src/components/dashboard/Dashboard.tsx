import React, { useState } from 'react';
import { NewspaperProject } from '../../types/newspaper.ts';
import { LayoutWireframe } from '../canvas/LayoutWireframes.tsx';
import {
  Newspaper,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  Download,
  Upload,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

interface DashboardProps {
  projects: NewspaperProject[];
  onCreateNew: () => void;
  onOpenProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
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
  onRenameProject,
  onExportJson,
  onImportJson,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans-studio">
      {/* Top Banner Navigation */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Newspaper className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-serif font-black text-xl tracking-tight text-white flex items-center gap-2">
              MJ NEWSPAPER STUDIO
              <span className="text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Broadsheet Press
              </span>
            </h1>
            <p className="text-xs text-neutral-400 font-sans">
              Professional Michael Jackson Newspaper Creator & Broadsheet Publishing System
            </p>
          </div>
        </div>

        {/* Create New Newspaper Prominent Action */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors">
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span>Import Project JSON</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={onCreateNew}
            aria-label="Create New Newspaper"
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs tracking-wide rounded-lg shadow-lg hover:shadow-amber-400/20 transition-all font-sans"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Newspaper</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        {/* Newsroom Hero Pitch */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 p-8 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Authentic Broadsheet Newsroom</span>
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-white leading-tight">
              Create, customize, and print authentic Michael Jackson commemorative newspapers.
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed font-sans">
              Choose from 8 distinct multi-column interior templates, upload your own photographs of Michael Jackson directly from your computer, tailor headlines and articles, and export print-ready broadsheets with true newspaper typography.
            </p>
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs rounded-lg shadow-md transition-all font-sans"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Start Blank Front Cover
              </button>
            </div>
          </div>

          {/* Decorative backdrop masthead outline */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none flex items-center justify-center overflow-hidden">
            <span className="font-serif font-black text-9xl text-white select-none whitespace-nowrap -rotate-12">
              THE CHRONICLE
            </span>
          </div>
        </div>

        {/* Section: My Newspapers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold tracking-tight text-white">
                My Newspapers ({projects.length})
              </h2>
            </div>
            <span className="text-xs text-neutral-400 font-sans">
              Recently edited projects auto-saved locally
            </span>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const coverPage = project.pages[0];
              const isRenaming = renamingId === project.id;
              const isDeleting = deleteConfirmId === project.id;

              return (
                <div
                  key={project.id}
                  className="group rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 transition-all flex flex-col justify-between overflow-hidden shadow-lg"
                >
                  {/* Card Header & Title */}
                  <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/40">
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
                          className="flex-1 bg-neutral-900 border border-amber-400 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveRename(project.id)}
                          className="p-1 rounded bg-amber-400 text-black hover:bg-amber-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            onClick={() => onOpenProject(project.id)}
                            className="font-serif font-bold text-base text-white group-hover:text-amber-400 cursor-pointer transition-colors line-clamp-1"
                          >
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
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
                          className="p-1 text-neutral-500 hover:text-amber-400 rounded"
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
                    className="p-4 cursor-pointer bg-neutral-950/60 flex items-center justify-center hover:bg-neutral-950/40 transition-colors"
                  >
                    <div className="w-full max-w-[220px] shadow-md border border-neutral-700/60 rounded p-1 bg-stone-100">
                      <LayoutWireframe
                        layoutId={coverPage?.layoutId || 'front-cover'}
                        className="w-full h-36"
                      />
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/50 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-amber-400 hover:text-black text-neutral-200 font-semibold rounded-md transition-colors"
                    >
                      Open Editor
                    </button>

                    <div className="flex items-center gap-1">
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
                        <div className="flex items-center gap-1 bg-red-950/60 p-1 rounded border border-red-800">
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
        </div>
      </main>
    </div>
  );
};
