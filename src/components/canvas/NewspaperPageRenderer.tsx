import React from 'react';
import { NewspaperPage, TextElement, ImageElement } from '../../types/newspaper.ts';
import { Camera, Image as ImageIcon, ZoomIn } from 'lucide-react';

interface NewspaperPageRendererProps {
  page: NewspaperPage;
  selectedElementId: string | null;
  selectedImageSlot: 'image1' | 'image2' | 'image3' | null;
  onSelectText: (textId: string) => void;
  onSelectImage: (slot: 'image1' | 'image2' | 'image3') => void;
  onQuickUpdateText?: (textId: string, content: string) => void;
  previewMode?: boolean;
  className?: string;
}

export const NewspaperPageRenderer: React.FC<NewspaperPageRendererProps> = ({
  page,
  selectedElementId,
  selectedImageSlot,
  onSelectText,
  onSelectImage,
  onQuickUpdateText,
  previewMode = false,
  className = '',
}) => {
  // Helper to map font choice to CSS class
  const getFontClass = (font: TextElement['fontFamily']) => {
    switch (font) {
      case 'cinzel':
        return 'font-cinzel';
      case 'playfair':
        return 'font-playfair';
      case 'bodoni':
        return 'font-bodoni';
      case 'merriweather':
        return 'font-merriweather';
      case 'source-serif':
        return 'font-source-serif';
      case 'oswald':
        return 'font-oswald';
      case 'courier':
        return 'font-courier';
      default:
        return 'font-playfair';
    }
  };

  // Helper to map text alignment
  const getAlignClass = (align: TextElement['align']) => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'justify':
        return 'text-justify';
      default:
        return 'text-left';
    }
  };

  // Helper to map weight
  const getWeightClass = (weight: TextElement['fontWeight']) => {
    switch (weight) {
      case 'normal':
        return 'font-normal';
      case 'medium':
        return 'font-medium';
      case 'semibold':
        return 'font-semibold';
      case 'bold':
        return 'font-bold';
      case 'black':
        return 'font-black';
      default:
        return 'font-normal';
    }
  };

  // Render an editable text element
  const renderText = (
    key: string,
    options?: {
      placeholder?: string;
      customClass?: string;
      asInlineInput?: boolean;
    }
  ) => {
    const el = page.texts[key];
    if (!el) return null;

    const isSelected = !previewMode && selectedElementId === el.id;
    const fontClass = getFontClass(el.fontFamily);
    const alignClass = getAlignClass(el.align);
    const weightClass = getWeightClass(el.fontWeight);

    return (
      <div
        key={el.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectText(el.id);
        }}
        className={`relative group cursor-pointer transition-all ${
          isSelected
            ? 'ring-2 ring-[#d97706] bg-[#d97706]/10 rounded-[2px]'
            : !previewMode
            ? 'hover:ring-1 hover:ring-[#f59e0b]/50 hover:bg-black/[0.02]'
            : ''
        } ${options?.customClass || ''}`}
        style={{
          color: el.color || '#111111',
          lineHeight: el.lineHeight || 1.3,
          letterSpacing: el.letterSpacing || 'normal',
        }}
      >
        {isSelected && (
          <span className="absolute -top-4 left-0 bg-[#d97706] text-white font-sans text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded-t font-semibold z-20 pointer-events-none select-none">
            {el.role}
          </span>
        )}

        <div
          className={`${fontClass} ${alignClass} ${weightClass} ${
            el.italic ? 'italic' : ''
          } ${el.uppercase ? 'uppercase' : ''} ${
            el.dropCap ? 'newspaper-dropcap' : ''
          } ${el.columns ? `columns-${el.columns} gap-4 columns-divider` : ''} select-text`}
          style={{
            fontSize: `${el.fontSize}px`,
          }}
        >
          {el.content || options?.placeholder || 'Empty text'}
        </div>
      </div>
    );
  };

  // Render an editable image slot with image styling, zoom, pan, and caption
  const renderImageSlot = (
    slot: 'image1' | 'image2' | 'image3',
    heightClass: string = 'h-64',
    options?: {
      aspectRatio?: string;
      customClass?: string;
    }
  ) => {
    const img = page.images[slot];
    const isSelected = !previewMode && selectedImageSlot === slot;

    // Filter style
    let filterStyle = 'none';
    if (img.filter === 'grayscale') filterStyle = 'grayscale(100%) contrast(110%)';
    if (img.filter === 'sepia') filterStyle = 'sepia(80%) contrast(105%)';
    if (img.filter === 'vintage-contrast')
      filterStyle = 'grayscale(100%) contrast(145%) brightness(95%)';

    return (
      <div
        key={img.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectImage(slot);
        }}
        className={`relative group cursor-pointer flex flex-col ${
          isSelected
            ? 'ring-2 ring-[#d97706] rounded-[2px]'
            : !previewMode
            ? 'hover:ring-1 hover:ring-[#f59e0b]/60'
            : ''
        } ${options?.customClass || ''}`}
      >
        {isSelected && (
          <span className="absolute -top-4 left-0 bg-[#d97706] text-white font-sans text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded-t font-semibold z-20 pointer-events-none select-none">
            {img.label || `Photo ${img.slotIndex}`}
          </span>
        )}

        {/* Image Box */}
        <div
          className={`relative w-full ${heightClass} overflow-hidden bg-[#e6e2d8] border border-[#a39e93] flex items-center justify-center`}
        >
          {img.url ? (
            <img
              src={img.url}
              alt={img.caption || 'Michael Jackson Archive Photo'}
              referrerPolicy="no-referrer"
              className="w-full h-full transition-transform duration-150"
              style={{
                objectFit: img.fit,
                filter: filterStyle,
                transform: `scale(${img.zoom}) translate(${img.panX}%, ${img.panY}%)`,
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center text-[#524d45] bg-[#f5f2eb] w-full h-full border border-dashed border-[#a39e93]">
              <Camera className="w-8 h-8 text-[#8c8578] mb-1.5" />
              <span className="font-oswald text-xs uppercase tracking-wider font-semibold text-[#262420]">
                Insert Photograph {img.slotIndex}
              </span>
              <span className="font-sans text-[10px] text-[#6e685e] mt-0.5">
                Click to upload from computer
              </span>
            </div>
          )}

          {/* Quick upload overlay button on hover */}
          {!previewMode && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
              <span className="px-3 py-1.5 bg-[#171717] text-[#fcd34d] font-sans text-xs font-semibold rounded shadow-lg flex items-center gap-1.5 pointer-events-none">
                <ImageIcon className="w-3.5 h-3.5" />
                Upload / Replace Photo
              </span>
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="mt-1 px-1">
          <p className="font-source-serif text-[11px] leading-tight text-[#383531] italic">
            {img.caption}
          </p>
          {img.credit && (
            <p className="font-sans text-[9px] uppercase tracking-wider text-[#6e685e] mt-0.5">
              {img.credit}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Authentic Newspaper Masthead Bar (Used on Front Cover)
  const renderFrontCoverHeader = () => {
    return (
      <header className="border-b-2 border-[#151412] pb-2 mb-3">
        {/* Ear corner items & top banner */}
        <div className="flex justify-between items-center text-[10px] font-oswald uppercase tracking-widest text-[#524d45] border-b border-[#a39e93] pb-1 mb-2">
          <span>THE WORLD’S GREATEST ENTERTAINER</span>
          <span className="font-bold text-[#78350f]">{page.pageHeader.editionName}</span>
          <span>ESTABLISHED 1958 • GARY, INDIANA</span>
        </div>

        {/* Big Masthead */}
        <div className="text-center my-1">
          {renderText('masthead', { customClass: 'py-0.5' })}
          {renderText('motto', { customClass: 'mt-0.5' })}
        </div>

        {/* Date, Issue, Price Strip */}
        <div className="flex justify-between items-center text-xs font-oswald uppercase tracking-wider border-y-2 border-[#262420] py-1 px-2 mt-2 bg-[#ece8df] text-[#151412] font-semibold">
          <span>VOL. LXVIII ... {page.pageHeader.issueNumber}</span>
          <span className="tracking-widest">{page.pageHeader.dateText}</span>
          <span>PRICE: {page.pageHeader.priceText}</span>
        </div>

        {/* Top Kicker */}
        <div className="mt-2 text-center">
          {renderText('topKicker')}
        </div>
      </header>
    );
  };

  // Interior Page Top Header Banner
  const renderInteriorHeader = () => {
    return (
      <header className="border-b-2 border-[#151412] pb-1 mb-4">
        <div className="flex justify-between items-center text-xs font-oswald uppercase tracking-wider text-[#262420] font-semibold border-b border-[#a39e93] pb-1">
          <span>{page.pageHeader.editionName}</span>
          <span className="text-[#78350f] font-bold">{page.pageHeader.sectionTitle || `SECTION B • PAGE ${page.pageNumber}`}</span>
          <span>{page.pageHeader.dateText}</span>
        </div>
      </header>
    );
  };

  return (
    <div
      className={`newsprint-paper p-6 sm:p-8 w-[800px] max-w-full min-h-[1050px] flex flex-col justify-between select-none mx-auto relative ${className}`}
      onClick={() => {
        // Deselect if clicked blank background
        // Handled in parent
      }}
    >
      {/* Page Content */}
      <div className="flex-1 flex flex-col">
        {page.isCover ? renderFrontCoverHeader() : renderInteriorHeader()}

        {/* FRONT COVER BODY */}
        {page.layoutId === 'front-cover' && (
          <div className="flex-1 flex flex-col gap-3">
            {/* Main Headline */}
            <div className="border-b border-[#a39e93] pb-2">
              {renderText('mainHeadline')}
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>

            {/* Upper Split: Lead Photo (Image 1) & Secondary Column */}
            <div className="grid grid-cols-12 gap-3 pb-3 border-b border-[#d4cebe]">
              {/* Photo 1: Lead Front Image (7 cols) */}
              <div className="col-span-7">
                {renderImageSlot('image1', 'h-[300px]')}
              </div>

              {/* Lead Article text & Column (5 cols) */}
              <div className="col-span-5 flex flex-col justify-between">
                <div>
                  {renderText('leadArticleHeadline')}
                  <div className="h-0.5 bg-[#d4cebe] my-1.5" />
                  {renderText('leadArticleBody')}
                </div>
              </div>
            </div>

            {/* Lower Split: Photos 2 & 3 plus Secondary Stories */}
            <div className="grid grid-cols-12 gap-3 flex-1 pt-1">
              {/* Photo 2 + Story */}
              <div className="col-span-4 flex flex-col justify-between border-r border-[#d4cebe] pr-3">
                {renderImageSlot('image2', 'h-[160px]')}
                <div className="mt-2">
                  {renderText('secondaryHeadline')}
                  {renderText('secondaryBody', { customClass: 'mt-1' })}
                </div>
              </div>

              {/* Photo 3 + Story */}
              <div className="col-span-4 flex flex-col justify-between border-r border-[#d4cebe] pr-3">
                {renderImageSlot('image3', 'h-[160px]')}
                <div className="mt-2">
                  {renderText('sidebarHeadline')}
                  {renderText('sidebarBody', { customClass: 'mt-1' })}
                </div>
              </div>

              {/* Third column editorial notes */}
              <div className="col-span-4 flex flex-col justify-between">
                <div className="bg-[#ece8df] p-2.5 border border-[#d4cebe]">
                  <span className="font-oswald text-[10px] uppercase font-bold text-[#78350f] tracking-wider block mb-1">
                    BULLETIN & ARCHIVE INDEX
                  </span>
                  <p className="font-source-serif text-xs leading-relaxed text-[#262420]">
                    The King of Pop Chronicle documents milestone studio masters, world tour routing,
                    and choreography innovations. Turn to internal pages for complete stadium coverage,
                    special photographs, and eyewitness accounts.
                  </p>
                </div>
                <div className="border-t border-[#a39e93] pt-2 mt-2">
                  <div className="font-oswald text-xs uppercase font-bold text-[#151412]">
                    WEATHER & CIRCULATION
                  </div>
                  <p className="font-source-serif text-[11px] text-[#524d45] mt-0.5">
                    Clear skies globally for stadium spectacles. Worldwide press wire distribution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. TOP HERO & TWIN SUB-PHOTOS */}
        {page.layoutId === 'layout-top-hero' && (
          <div className="flex-1 flex flex-col gap-3">
            <div>
              {renderText('sectionKicker')}
              {renderText('pageHeadline')}
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>
            {/* Top Large Hero Photo (Image 1) */}
            <div className="w-full">
              {renderImageSlot('image1', 'h-[320px]')}
            </div>
            {/* Twin Sub-Photos (Images 2 & 3) */}
            <div className="grid grid-cols-2 gap-4 border-y border-[#d4cebe] py-3">
              {renderImageSlot('image2', 'h-[190px]')}
              {renderImageSlot('image3', 'h-[190px]')}
            </div>
            {/* Articles */}
            <div className="grid grid-cols-12 gap-4 flex-1 pt-1">
              <div className="col-span-8 border-r border-[#d4cebe] pr-4">
                {renderText('mainArticleBody')}
              </div>
              <div className="col-span-4">
                {renderText('pullQuote', { customClass: 'mb-2' })}
                {renderText('secondaryArticleBody')}
              </div>
            </div>
          </div>
        )}

        {/* 2. VERTICAL TRIPLE COLUMN */}
        {page.layoutId === 'layout-vertical-trio' && (
          <div className="flex-1 flex flex-col gap-3">
            <div>
              {renderText('sectionKicker')}
              {renderText('pageHeadline')}
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>
            <div className="grid grid-cols-12 gap-4 flex-1">
              {/* Left 8 cols: Big articles */}
              <div className="col-span-8 flex flex-col justify-between border-r border-[#d4cebe] pr-4">
                <div>
                  {renderText('secondaryHeadline')}
                  <div className="h-0.5 bg-[#d4cebe] my-2" />
                  {renderText('mainArticleBody')}
                </div>
                <div className="border-t border-[#d4cebe] pt-3 mt-4">
                  {renderText('pullQuote', { customClass: 'my-2' })}
                  {renderText('secondaryArticleBody')}
                </div>
              </div>
              {/* Right 4 cols: 3 Equal-Sized Photos Stacked Vertically */}
              <div className="col-span-4 flex flex-col justify-between gap-3">
                {renderImageSlot('image1', 'h-[170px]')}
                {renderImageSlot('image2', 'h-[170px]')}
                {renderImageSlot('image3', 'h-[170px]')}
              </div>
            </div>
          </div>
        )}

        {/* 3. LEFT DUAL STACK & RIGHT FEATURE */}
        {page.layoutId === 'layout-left-split' && (
          <div className="flex-1 flex flex-col gap-3">
            <div>
              {renderText('sectionKicker')}
              {renderText('pageHeadline')}
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>
            <div className="grid grid-cols-12 gap-4 flex-1">
              {/* Left 5 cols: 2 Stacked Photos + Secondary Body */}
              <div className="col-span-5 flex flex-col gap-3 border-r border-[#d4cebe] pr-4">
                {renderImageSlot('image1', 'h-[200px]')}
                {renderImageSlot('image2', 'h-[200px]')}
                <div className="mt-2">
                  {renderText('secondaryArticleBody')}
                </div>
              </div>
              {/* Right 7 cols: 1 Large Feature Photo (Image 3) + Main Body */}
              <div className="col-span-7 flex flex-col justify-between">
                <div>
                  {renderImageSlot('image3', 'h-[330px]')}
                  <div className="mt-3">
                    {renderText('secondaryHeadline')}
                    <div className="h-0.5 bg-[#d4cebe] my-1.5" />
                    {renderText('mainArticleBody')}
                  </div>
                </div>
                <div className="border-t border-[#d4cebe] pt-2">
                  {renderText('pullQuote')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CENTERED SHOWPIECE & TWIN SIDE FLANKS */}
        {page.layoutId === 'layout-center-feature' && (
          <div className="flex-1 flex flex-col gap-3">
            <div>
              {renderText('sectionKicker')}
              {renderText('pageHeadline')}
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>
            {/* Center showpiece flanked by 2 smaller side photos */}
            <div className="grid grid-cols-12 gap-3 items-center border-b border-[#d4cebe] pb-3">
              {/* Photo 1: Left Flank */}
              <div className="col-span-3">
                {renderImageSlot('image1', 'h-[220px]')}
              </div>
              {/* Photo 2: Large Center Showpiece */}
              <div className="col-span-6">
                {renderImageSlot('image2', 'h-[320px]')}
              </div>
              {/* Photo 3: Right Flank */}
              <div className="col-span-3">
                {renderImageSlot('image3', 'h-[220px]')}
              </div>
            </div>
            {/* 3 Text Columns Underneath */}
            <div className="grid grid-cols-3 gap-4 flex-1 pt-1">
              <div className="border-r border-[#d4cebe] pr-3">
                {renderText('secondaryHeadline')}
                {renderText('secondaryArticleBody', { customClass: 'mt-2' })}
              </div>
              <div className="border-r border-[#d4cebe] pr-3">
                {renderText('mainArticleBody')}
              </div>
              <div>
                {renderText('pullQuote', { customClass: 'mb-3' })}
                <p className="font-source-serif text-xs leading-relaxed text-[#383531]">
                  Special dispatch continuing across archival editions. Preserving the definitive history
                  of record-shattering singles and iconic performances.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. PANORAMIC TRIPTYCH */}
        {page.layoutId === 'layout-horizontal-triptych' && (
          <div className="flex-1 flex flex-col gap-3">
            <div>
              {renderText('sectionKicker')}
              {renderText('pageHeadline')}
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>
            {/* Three photos in a balanced horizontal row */}
            <div className="grid grid-cols-3 gap-3 border-y border-[#d4cebe] py-3">
              {renderImageSlot('image1', 'h-[220px]')}
              {renderImageSlot('image2', 'h-[220px]')}
              {renderImageSlot('image3', 'h-[220px]')}
            </div>
            {/* Article Columns */}
            <div className="grid grid-cols-12 gap-4 flex-1 pt-2">
              <div className="col-span-8 border-r border-[#d4cebe] pr-4">
                {renderText('secondaryHeadline')}
                <div className="h-0.5 bg-[#d4cebe] my-1.5" />
                {renderText('mainArticleBody')}
              </div>
              <div className="col-span-4 flex flex-col justify-between">
                <div>
                  {renderText('pullQuote')}
                </div>
                <div className="border-t border-[#d4cebe] pt-2">
                  {renderText('secondaryArticleBody')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. ASYMMETRICAL MODERN EDITORIAL */}
        {page.layoutId === 'layout-editorial-asymmetric' && (
          <div className="flex-1 flex flex-col gap-3">
            <div>
              {renderText('sectionKicker')}
              {renderText('pageHeadline')}
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>
            <div className="grid grid-cols-12 gap-4 flex-1">
              {/* Left 4 cols: Photo 1 + Story */}
              <div className="col-span-4 flex flex-col justify-between border-r border-[#d4cebe] pr-3">
                {renderImageSlot('image1', 'h-[190px]')}
                <div className="mt-2">
                  {renderText('secondaryHeadline')}
                  {renderText('secondaryArticleBody', { customClass: 'mt-1' })}
                </div>
              </div>
              {/* Middle 4 cols: Story + Photo 2 */}
              <div className="col-span-4 flex flex-col justify-between border-r border-[#d4cebe] pr-3">
                <div>
                  {renderText('pullQuote', { customClass: 'mb-2' })}
                  {renderText('mainArticleBody')}
                </div>
                <div className="mt-2">
                  {renderImageSlot('image2', 'h-[190px]')}
                </div>
              </div>
              {/* Right 4 cols: Tall Dramatic Photo 3 */}
              <div className="col-span-4 flex flex-col justify-between">
                {renderImageSlot('image3', 'h-[360px]')}
                <div className="border-t border-[#d4cebe] pt-2 mt-2">
                  <span className="font-oswald text-[10px] uppercase font-bold text-[#151412] block mb-1">
                    CURATORIAL DISPATCH
                  </span>
                  <p className="font-source-serif text-[11px] text-[#524d45] leading-snug">
                    Archival photographs calibrated for authentic letterpress reproduction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. CLASSIC TRIPLE DISPATCH */}
        {page.layoutId === 'layout-classic-dispatch' && (
          <div className="flex-1 flex flex-col gap-3">
            <div>
              {renderText('sectionKicker')}
              {renderText('pageHeadline')}
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>
            {/* Three distinct story columns, each with its own photo and body */}
            <div className="grid grid-cols-3 gap-4 flex-1 border-t border-[#d4cebe] pt-3">
              {/* Column 1 */}
              <div className="flex flex-col justify-between border-r border-[#d4cebe] pr-3">
                <div>
                  {renderImageSlot('image1', 'h-[180px]')}
                  <h4 className="font-playfair font-bold text-base mt-2 text-[#151412]">
                    Dispatch I: Early Studio Masters
                  </h4>
                  <div className="h-0.5 bg-[#d4cebe] my-1" />
                  <p className="font-source-serif text-xs text-[#262420] text-justify leading-relaxed">
                    Recording milestones began with relentless precision and analog tape perfection.
                    Every layered vocal track was meticulously voiced to create the signature sound.
                  </p>
                </div>
                <div className="border-t border-[#d4cebe] pt-1 mt-2 text-[10px] font-oswald text-[#78716c] uppercase">
                  RECORD NO. 01 • STUDIO ARCHIVE
                </div>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col justify-between border-r border-[#d4cebe] pr-3">
                <div>
                  {renderImageSlot('image2', 'h-[180px]')}
                  <h4 className="font-playfair font-bold text-base mt-2 text-[#151412]">
                    Dispatch II: Stadium Spectacles
                  </h4>
                  <div className="h-0.5 bg-[#d4cebe] my-1" />
                  <p className="font-source-serif text-xs text-[#262420] text-justify leading-relaxed">
                    Live audiences witnessed unprecedented engineering, pyrotechnics, and choreography.
                    From the 45-degree lean to the anti-gravity illusion, live boundaries were shattered.
                  </p>
                </div>
                <div className="border-t border-[#d4cebe] pt-1 mt-2 text-[10px] font-oswald text-[#78716c] uppercase">
                  RECORD NO. 02 • WORLD TOUR WIRE
                </div>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col justify-between">
                <div>
                  {renderImageSlot('image3', 'h-[180px]')}
                  <h4 className="font-playfair font-bold text-base mt-2 text-[#151412]">
                    Dispatch III: Philanthropy & Vision
                  </h4>
                  <div className="h-0.5 bg-[#d4cebe] my-1" />
                  <p className="font-source-serif text-xs text-[#262420] text-justify leading-relaxed">
                    A global commitment to humanitarian causes that touched countless lives.
                    Guinness World Records recognized these contributions as the greatest by any pop star.
                  </p>
                </div>
                <div className="border-t border-[#d4cebe] pt-1 mt-2 text-[10px] font-oswald text-[#78716c] uppercase">
                  RECORD NO. 03 • GLOBAL LEGACY
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. BOLD HEADLINE & DISPERSED TRIO */}
        {page.layoutId === 'layout-headline-spread' && (
          <div className="flex-1 flex flex-col gap-3">
            {/* Giant Banner Headline */}
            <div className="border-b-2 border-[#151412] pb-2">
              <span className="font-oswald text-xs uppercase tracking-widest text-[#78350f] font-bold block mb-0.5">
                GRAND CHRONICLE SPECIAL BROADCAST
              </span>
              <div className="text-3xl lg:text-4xl font-playfair font-black text-[#151412] leading-tight">
                {renderText('pageHeadline')}
              </div>
              {renderText('subhead', { customClass: 'mt-1' })}
            </div>

            {/* Top row: Photo 1 + Article */}
            <div className="grid grid-cols-12 gap-3 items-center border-b border-[#d4cebe] pb-2">
              <div className="col-span-5">
                {renderImageSlot('image1', 'h-[160px]')}
              </div>
              <div className="col-span-7">
                {renderText('mainArticleBody')}
              </div>
            </div>

            {/* Bottom row: Photo 2 (Center Hero) & Photo 3 (Flank) */}
            <div className="grid grid-cols-12 gap-3 flex-1 pt-1">
              <div className="col-span-7">
                {renderImageSlot('image2', 'h-[250px]')}
              </div>
              <div className="col-span-5 flex flex-col justify-between">
                {renderImageSlot('image3', 'h-[150px]')}
                <div className="border-t border-[#d4cebe] pt-2 mt-2">
                  {renderText('pullQuote')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Footer Rule */}
      <footer className="mt-4 pt-1.5 border-t border-[#a39e93] flex justify-between items-center text-[10px] font-oswald uppercase tracking-wider text-[#524d45]">
        <span>MJ NEWSPAPER STUDIO • ARCHIVAL PRESS EDITION</span>
        <span className="font-bold text-[#262420]">PAGE {page.pageNumber}</span>
        <span>ALL RIGHTS RESERVED • PRINTED COMMEMORATIVE BROADSHEET</span>
      </footer>
    </div>
  );
};
