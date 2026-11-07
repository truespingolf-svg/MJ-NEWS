import React from 'react';
import { NewspaperProject, NewspaperPage } from '../../types/newspaper.ts';
import { LayoutWireframe } from '../canvas/LayoutWireframes.tsx';
import {
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  LayoutTemplate,
  FileText,
  MoveVertical,
} from 'lucide-react';

interface PageManagerSidebarProps {
  project: NewspaperProject;
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPageClick: () => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onChangeLayoutClick: () => void;
}

export const PageManagerSidebar: React.FC<PageManagerSidebarProps> = ({
  project,
  activePageIndex,
  onSelectPage,
  onAddPageClick,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onChangeLayoutClick,
}) => {
  const activePage = project.pages[activePageIndex];

  return (
    <aside
      aria-label="Page management"
      className="w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full text-neutral-200 select-none shrink-0"
    >
      {/* Top action bar */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-neutral-300">
            Pages ({project.pages.length})
          </span>
        </div>
        <button
          onClick={onAddPageClick}
          aria-label="Add new page"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded-md shadow transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          Add Page
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {project.pages.map((page, index) => {
          const isActive = index === activePageIndex;
          const isCover = page.isCover || index === 0;

          return (
            <div
              key={page.id}
              onClick={() => onSelectPage(index)}
              className={`group relative rounded-lg p-2.5 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-neutral-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                  : 'bg-neutral-950/70 border-neutral-800/90 hover:border-neutral-700 hover:bg-neutral-800/40'
              }`}
            >
              {/* Header inside thumbnail card */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-amber-400 text-black'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isCover ? 'COVER' : `P. ${page.pageNumber}`}
                  </span>
                  <span className="text-xs font-medium text-neutral-300 truncate max-w-[110px]">
                    {isCover ? 'Front Cover' : `Interior Page ${page.pageNumber}`}
                  </span>
                </div>

                {/* Reorder Buttons */}
                <div
                  className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onMovePage(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move page ${index + 1} up`}
                    className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-400 rounded"
                    title="Move page up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onMovePage(index, index + 1)}
                    disabled={index === project.pages.length - 1}
                    aria-label={`Move page ${index + 1} down`}
                    className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-400 rounded"
                    title="Move page down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Wireframe Thumbnail */}
              <div className="relative">
                <LayoutWireframe layoutId={page.layoutId} className="w-full h-24" />
                {isActive && (
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500/90 text-black text-[9px] font-bold uppercase tracking-wider">
                    Editing
                  </div>
                )}
              </div>

              {/* Page Actions toolbar on hover or when active */}
              <div
                className={`mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs ${
                  isActive ? 'flex' : 'hidden group-hover:flex'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {!isCover ? (
                  <button
                    onClick={() => {
                      onSelectPage(index);
                      onChangeLayoutClick();
                    }}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 transition-colors"
                    title="Change Page Layout"
                  >
                    <LayoutTemplate className="w-3 h-3" />
                    Layout
                  </button>
                ) : (
                  <span className="text-[10px] text-amber-400/80 font-medium">Broadsheet Masthead</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicatePage(page.id)}
                    aria-label={`Duplicate page ${index + 1}`}
                    className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePage(page.id)}
                    disabled={project.pages.length <= 1}
                    aria-label={`Delete page ${index + 1}`}
                    className="p-1 text-neutral-400 hover:text-red-400 disabled:opacity-20 disabled:hover:text-neutral-400 rounded hover:bg-neutral-800"
                    title={project.pages.length <= 1 ? 'Cannot delete only page' : 'Delete Page'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 text-[11px] text-neutral-400 flex items-center justify-between">
        <span>Click any page to edit</span>
        <button
          onClick={onAddPageClick}
          className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
        >
          <Plus className="w-3 h-3" />
          Add interior page
        </button>
      </div>
    </aside>
  );
};
