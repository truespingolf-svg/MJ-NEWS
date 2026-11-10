import React, { useRef, useState } from 'react';
import {
  NewspaperPage,
  TextElement,
  ImageElement,
  FontChoice,
  TextAlign,
  ImageFilter,
  PageLayoutId,
} from '../../types/newspaper.ts';
import {
  Upload,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  RotateCcw,
  Sparkles,
  Sliders,
  Layers,
  Settings,
  Eye,
  Columns,
} from 'lucide-react';

interface InspectorSidebarProps {
  page: NewspaperPage;
  selectedElementId: string | null;
  selectedImageSlot: 'image1' | 'image2' | 'image3' | null;
  onUpdateText: (textId: string, updates: Partial<TextElement>) => void;
  onUpdateImage: (slot: 'image1' | 'image2' | 'image3', updates: Partial<ImageElement>) => void;
  onResetImage: (slot: 'image1' | 'image2' | 'image3') => void;
  onUpdatePageHeader: (updates: Partial<NewspaperPage['pageHeader']>) => void;
  onChangeLayoutClick: () => void;
  onDeselect: () => void;
}

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  page,
  selectedElementId,
  selectedImageSlot,
  onUpdateText,
  onUpdateImage,
  onResetImage,
  onUpdatePageHeader,
  onChangeLayoutClick,
  onDeselect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected text element if any
  let selectedText: TextElement | null = null;
  if (selectedElementId) {
    for (const text of Object.values(page.texts)) {
      if (text.id === selectedElementId) {
        selectedText = text;
        break;
      }
    }
  }

  // Selected image if any
  const selectedImage: ImageElement | null = selectedImageSlot
    ? page.images[selectedImageSlot]
    : null;

  // Handle local file upload with max 25MB limit
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedImageSlot) return;

    const MAX_25MB = 25 * 1024 * 1024;
    if (file.size > MAX_25MB) {
      alert('File size exceeds 25MB limit. Please select a file under 25MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateImage(selectedImageSlot, {
          url: dataUrl,
          credit: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <aside
      aria-label="Element editing panel"
      className="w-64 md:w-72 lg:w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full text-neutral-200 select-none shrink-0"
    >
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
        <div className="flex items-center gap-2">
          {selectedImage ? (
            <ImageIcon className="w-4 h-4 text-amber-400" />
          ) : selectedText ? (
            <Type className="w-4 h-4 text-amber-400" />
          ) : (
            <Settings className="w-4 h-4 text-neutral-400" />
          )}
          <span className="text-xs font-semibold tracking-wider uppercase text-neutral-200">
            {selectedImage
              ? `Image Controls (${selectedImage.label || `Photo ${selectedImage.slotIndex}`})`
              : selectedText
              ? `Text Formatting (${selectedText.role})`
              : 'Page & Issue Settings'}
          </span>
        </div>

        {(selectedImage || selectedText) && (
          <button
            onClick={onDeselect}
            className="text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded hover:bg-neutral-800"
          >
            Done
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ================= IMAGE EDITING PANEL ================= */}
        {selectedImage && selectedImageSlot && (
          <div className="space-y-4">
            {/* Slot indicator */}
            <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold block">
                  Active Photo Slot
                </span>
                <span className="text-xs font-medium text-neutral-200">
                  {selectedImage.label || `Photograph Slot ${selectedImage.slotIndex} of 3`}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                {selectedImage.slotIndex}/3
              </span>
            </div>

            {/* Upload Button */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                Upload Photograph From Computer
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded-lg shadow transition-colors"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" />
                Choose Image File (.jpg, .png, .webp)
              </button>
            </div>

            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-neutral-300">Zoom / Crop Scale</span>
                <span className="text-amber-400 font-mono text-[11px]">
                  {Math.round(selectedImage.zoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={selectedImage.zoom}
                onChange={(e) =>
                  onUpdateImage(selectedImageSlot, { zoom: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Reposition Pan Sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-neutral-300">Pan Horizontal</span>
                  <span className="text-neutral-400 font-mono text-[10px]">
                    {selectedImage.panX}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={selectedImage.panX}
                  onChange={(e) =>
                    onUpdateImage(selectedImageSlot, { panX: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-neutral-300">Pan Vertical</span>
                  <span className="text-neutral-400 font-mono text-[10px]">
                    {selectedImage.panY}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={selectedImage.panY}
                  onChange={(e) =>
                    onUpdateImage(selectedImageSlot, { panY: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Fit mode */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Aspect Ratio / Framing Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateImage(selectedImageSlot, { fit: 'cover' })}
                  className={`py-1.5 text-xs rounded border transition-colors ${
                    selectedImage.fit === 'cover'
                      ? 'bg-amber-400 text-black font-semibold border-amber-400'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                  }`}
                >
                  Fill Frame (Cover)
                </button>
                <button
                  onClick={() => onUpdateImage(selectedImageSlot, { fit: 'contain' })}
                  className={`py-1.5 text-xs rounded border transition-colors ${
                    selectedImage.fit === 'contain'
                      ? 'bg-amber-400 text-black font-semibold border-amber-400'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                  }`}
                >
                  Fit Entire Photo
                </button>
              </div>
            </div>

            {/* Filter Styles (Authentic Vintage Newsprint) */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                Authentic Press Filter Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'Full Color' },
                  { id: 'grayscale', label: 'Newsprint B&W' },
                  { id: 'sepia', label: 'Vintage Sepia' },
                  { id: 'vintage-contrast', label: 'High Contrast Wire' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() =>
                      onUpdateImage(selectedImageSlot, { filter: f.id as ImageFilter })
                    }
                    className={`py-1.5 px-2 text-xs rounded border text-left transition-colors ${
                      selectedImage.filter === f.id
                        ? 'bg-neutral-800 border-amber-400 text-amber-300 font-semibold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption & Credit */}
            <div className="space-y-3 pt-1 border-t border-neutral-800">
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Photograph Caption
                </label>
                <textarea
                  rows={3}
                  value={selectedImage.caption}
                  onChange={(e) =>
                    onUpdateImage(selectedImageSlot, { caption: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400 font-serif leading-relaxed"
                  placeholder="Enter caption describing the photograph..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Photo Credit / Press Wire
                </label>
                <input
                  type="text"
                  value={selectedImage.credit || ''}
                  onChange={(e) =>
                    onUpdateImage(selectedImageSlot, { credit: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Associated Press / Studio Archive"
                />
              </div>
            </div>

            {/* Reset Image */}
            <div className="pt-2">
              <button
                onClick={() => onResetImage(selectedImageSlot)}
                className="w-full py-2 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset To Placeholder
              </button>
            </div>
          </div>
        )}

        {/* ================= TEXT EDITING PANEL ================= */}
        {selectedText && (
          <div className="space-y-4">
            {/* Text Role Indicator */}
            <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold block">
                  Editing Element
                </span>
                <span className="text-xs font-medium text-neutral-200 capitalize">
                  {selectedText.role.replace(/([A-Z])/g, ' $1')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                {selectedText.fontSize}px
              </span>
            </div>

            {/* Direct Text Editor */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Content & Copy
              </label>
              <textarea
                rows={selectedText.role === 'body' ? 6 : 3}
                value={selectedText.content}
                onChange={(e) =>
                  onUpdateText(selectedText.id, { content: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400 leading-relaxed font-serif"
                placeholder="Enter text..."
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Font Family
              </label>
              <select
                value={selectedText.fontFamily}
                onChange={(e) =>
                  onUpdateText(selectedText.id, {
                    fontFamily: e.target.value as FontChoice,
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                <option value="playfair">Playfair Display (Classic Broadsheet Headline)</option>
                <option value="cinzel">Cinzel (Regal Masthead / Coronation Roman)</option>
                <option value="bodoni">Bodoni Moda (High Contrast Editorial)</option>
                <option value="source-serif">Source Serif 4 (Clean Broadsheet Body Column)</option>
                <option value="merriweather">Merriweather (Warm Literary Serif)</option>
                <option value="oswald">Oswald (Condensed News Ticker & Dateline)</option>
                <option value="courier">Courier Prime (Vintage Dispatch / Press Wire)</option>
              </select>
            </div>

            {/* Font Size Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-neutral-300">Font Size</span>
                <span className="text-amber-400 font-mono text-[11px]">
                  {selectedText.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="9"
                max="64"
                step="1"
                value={selectedText.fontSize}
                onChange={(e) =>
                  onUpdateText(selectedText.id, { fontSize: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex gap-1 mt-1.5">
                {[11, 14, 18, 24, 32, 42, 54].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => onUpdateText(selectedText.id, { fontSize: sz })}
                    className={`flex-1 py-0.5 text-[10px] rounded border ${
                      selectedText.fontSize === sz
                        ? 'bg-amber-400 text-black font-bold border-amber-400'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Weight & Styles */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Weight & Style
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={selectedText.fontWeight}
                  onChange={(e) =>
                    onUpdateText(selectedText.id, {
                      fontWeight: e.target.value as TextElement['fontWeight'],
                    })
                  }
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="normal">Regular (400)</option>
                  <option value="medium">Medium (500)</option>
                  <option value="semibold">SemiBold (600)</option>
                  <option value="bold">Bold (700)</option>
                  <option value="black">Black Heavy (900)</option>
                </select>

                <button
                  onClick={() =>
                    onUpdateText(selectedText.id, { italic: !selectedText.italic })
                  }
                  className={`p-2 rounded border transition-colors ${
                    selectedText.italic
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() =>
                    onUpdateText(selectedText.id, { uppercase: !selectedText.uppercase })
                  }
                  className={`px-2 py-1.5 text-xs font-bold rounded border transition-colors ${
                    selectedText.uppercase
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                  title="All Caps"
                >
                  AA
                </button>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Alignment
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { align: 'left', icon: AlignLeft, label: 'Left' },
                  { align: 'center', icon: AlignCenter, label: 'Center' },
                  { align: 'right', icon: AlignRight, label: 'Right' },
                  { align: 'justify', icon: AlignJustify, label: 'Justified' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.align}
                      onClick={() =>
                        onUpdateText(selectedText.id, {
                          align: item.align as TextAlign,
                        })
                      }
                      className={`py-1.5 flex items-center justify-center rounded border transition-colors ${
                        selectedText.align === item.align
                          ? 'bg-amber-400 text-black border-amber-400 font-semibold'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ink Color Palette */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Ink Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { color: '#111111', name: 'Charcoal' },
                  { color: '#000000', name: 'Jet Black' },
                  { color: '#4a3b32', name: 'Sepia' },
                  { color: '#8b0000', name: 'Crimson' },
                  { color: '#4a5568', name: 'Slate' },
                ].map((item) => (
                  <button
                    key={item.color}
                    onClick={() =>
                      onUpdateText(selectedText.id, { color: item.color })
                    }
                    className={`h-7 rounded border flex items-center justify-center relative ${
                      selectedText.color === item.color
                        ? 'border-amber-400 ring-2 ring-amber-400/50'
                        : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: item.color }}
                    title={item.name}
                  >
                    {selectedText.color === item.color && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-column & Drop Cap for Body Articles */}
            {selectedText.role === 'body' && (
              <div className="pt-2 border-t border-neutral-800 space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1">
                    Newspaper Columns
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((cols) => (
                      <button
                        key={cols}
                        onClick={() =>
                          onUpdateText(selectedText.id, {
                            columns: cols as 1 | 2 | 3,
                          })
                        }
                        className={`py-1 text-xs rounded border transition-colors flex items-center justify-center gap-1 ${
                          (selectedText.columns || 1) === cols
                            ? 'bg-amber-400 text-black font-semibold border-amber-400'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        <Columns className="w-3 h-3" />
                        {cols} {cols === 1 ? 'Col' : 'Cols'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                  <span className="text-xs text-neutral-300">Lead Story Drop Cap</span>
                  <input
                    type="checkbox"
                    checked={!!selectedText.dropCap}
                    onChange={(e) =>
                      onUpdateText(selectedText.id, { dropCap: e.target.checked })
                    }
                    className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= DEFAULT / PAGE SETTINGS ================= */}
        {!selectedImage && !selectedText && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block mb-1">
                Interactive Selection
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Click any headline, article paragraph, masthead, or photograph placeholder on the newspaper canvas to begin customizing.
              </p>
            </div>

            {/* Current Layout Overview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                Current Layout
              </span>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-amber-400 capitalize block">
                    {page.layoutId.replace('layout-', '').replace(/-/g, ' ')}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Includes 3 independent photo slots
                  </span>
                </div>
                {!page.isCover && (
                  <button
                    onClick={onChangeLayoutClick}
                    className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            {/* Page Header Metadata */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                Broadsheet Metadata
              </span>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Edition Banner
                </label>
                <input
                  type="text"
                  value={page.pageHeader.editionName}
                  onChange={(e) =>
                    onUpdatePageHeader({ editionName: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 font-oswald uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Publication Date
                </label>
                <input
                  type="text"
                  value={page.pageHeader.dateText}
                  onChange={(e) =>
                    onUpdatePageHeader({ dateText: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 font-oswald uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Issue Number
                  </label>
                  <input
                    type="text"
                    value={page.pageHeader.issueNumber}
                    onChange={(e) =>
                      onUpdatePageHeader({ issueNumber: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 font-oswald uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Price Bar
                  </label>
                  <input
                    type="text"
                    value={page.pageHeader.priceText}
                    onChange={(e) =>
                      onUpdatePageHeader({ priceText: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 font-oswald uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
              <span className="font-semibold block">Pro Publishing Tip:</span>
              <p>
                To preview your newspaper as it appears when printed, click the Preview Mode eye button in the top navigation bar.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
