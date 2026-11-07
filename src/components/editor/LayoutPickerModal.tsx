import React, { useState } from 'react';
import { PageLayoutId, LayoutDescriptor } from '../../types/newspaper.ts';
import { getAvailableLayouts } from '../../utils/newspaperLogic.ts';
import { LayoutWireframe } from '../canvas/LayoutWireframes.tsx';
import { X, Check, Newspaper, Plus } from 'lucide-react';

interface LayoutPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLayout: (layoutId: PageLayoutId) => void;
  mode: 'add' | 'change';
  currentLayoutId?: PageLayoutId;
}

export const LayoutPickerModal: React.FC<LayoutPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLayout,
  mode,
  currentLayoutId = 'layout-top-hero',
}) => {
  const [selectedId, setSelectedId] = useState<PageLayoutId>(
    currentLayoutId === 'front-cover' ? 'layout-top-hero' : currentLayoutId
  );

  if (!isOpen) return null;

  // Filter to interior layouts for interior page creation/change
  const interiorLayouts = getAvailableLayouts().filter((l) => l.category === 'interior');

  const handleConfirm = () => {
    onSelectLayout(selectedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="layout-picker-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <h2 id="layout-picker-title" className="text-lg font-semibold tracking-tight text-white">
                {mode === 'add' ? 'Choose Layout for New Page' : 'Change Current Page Layout'}
              </h2>
              <p className="text-xs text-neutral-400">
                Select from 8 authentic newspaper templates. Every page includes exactly 3 image placeholders.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {interiorLayouts.map((layout) => {
            const isCurrent = layout.id === selectedId;
            return (
              <div
                key={layout.id}
                onClick={() => setSelectedId(layout.id)}
                className={`group cursor-pointer rounded-lg p-3 transition-all flex flex-col justify-between border ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-1 ring-amber-500/40'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900/80'
                }`}
              >
                {/* Visual Wireframe */}
                <div className="mb-3">
                  <LayoutWireframe layoutId={layout.id} className="w-full h-32" />
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`text-xs font-semibold tracking-wide ${
                        isCurrent ? 'text-amber-400' : 'text-neutral-200 group-hover:text-white'
                      }`}
                    >
                      {layout.name}
                    </h3>
                    {isCurrent && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug line-clamp-3">
                    {layout.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-amber-500/80 font-medium">
                  <span>3 Photo Slots</span>
                  <span className="text-neutral-500 font-normal">Broadsheet</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>3 photo placeholders are automatically maintained for every interior page.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-medium text-black bg-amber-400 hover:bg-amber-300 rounded-lg font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              {mode === 'add' ? (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add New Page
                </>
              ) : (
                'Apply Layout'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
