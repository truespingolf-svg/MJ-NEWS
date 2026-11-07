import React from 'react';
import { PageLayoutId } from '../../types/newspaper.ts';

interface WireframeProps {
  layoutId: PageLayoutId;
  className?: string;
}

/**
 * Mini visual wireframes illustrating each layout's composition
 * and showing clearly where the 3 image placeholders and text columns are positioned.
 */
export const LayoutWireframe: React.FC<WireframeProps> = ({ layoutId, className = 'w-full h-28' }) => {
  return (
    <div
      className={`bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded p-1.5 flex flex-col justify-between text-[8px] text-stone-500 font-sans ${className}`}
    >
      {layoutId === 'front-cover' && (
        <div className="h-full flex flex-col gap-1">
          {/* Masthead */}
          <div className="h-3 bg-stone-800 dark:bg-stone-300 rounded-[1px] flex items-center justify-center text-[6px] font-bold text-white dark:text-stone-900">
            MASTHEAD
          </div>
          {/* Date bar */}
          <div className="h-1 bg-stone-300 dark:bg-stone-700" />
          {/* Main Headline */}
          <div className="h-2 bg-stone-700 dark:bg-stone-400 rounded-[1px]" />
          {/* 3 Photos + Columns */}
          <div className="grid grid-cols-3 gap-1 flex-1">
            <div className="col-span-2 bg-amber-200/60 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 rounded flex items-center justify-center font-bold text-[7px] text-amber-800 dark:text-amber-200">
              Photo 1 (Lead)
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 2
              </div>
              <div className="flex-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 3
              </div>
            </div>
          </div>
          {/* Bottom columns */}
          <div className="grid grid-cols-3 gap-1 h-4">
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
          </div>
        </div>
      )}

      {layoutId === 'layout-top-hero' && (
        <div className="h-full flex flex-col gap-1">
          <div className="h-2 bg-stone-700 dark:bg-stone-400 rounded-[1px]" />
          {/* Photo 1: Large Top */}
          <div className="h-10 bg-amber-200/70 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 rounded flex items-center justify-center font-bold text-[7px] text-amber-800 dark:text-amber-200">
            Photo 1 (Hero Top)
          </div>
          {/* Photos 2 & 3: Twin sub-photos */}
          <div className="grid grid-cols-2 gap-1 h-7">
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 2
            </div>
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 3
            </div>
          </div>
          {/* Article text */}
          <div className="flex-1 grid grid-cols-2 gap-1">
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
          </div>
        </div>
      )}

      {layoutId === 'layout-vertical-trio' && (
        <div className="h-full flex flex-col gap-1">
          <div className="h-2 bg-stone-700 dark:bg-stone-400 rounded-[1px]" />
          <div className="flex-1 grid grid-cols-3 gap-1">
            <div className="col-span-2 flex flex-col gap-1">
              <div className="h-3 bg-stone-300 dark:bg-stone-700" />
              <div className="flex-1 grid grid-cols-2 gap-1">
                <div className="bg-stone-200 dark:bg-stone-800 rounded" />
                <div className="bg-stone-200 dark:bg-stone-800 rounded" />
              </div>
            </div>
            {/* 3 Photos stacked vertically on right */}
            <div className="flex flex-col gap-1">
              <div className="flex-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 1
              </div>
              <div className="flex-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 2
              </div>
              <div className="flex-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 3
              </div>
            </div>
          </div>
        </div>
      )}

      {layoutId === 'layout-left-split' && (
        <div className="h-full flex flex-col gap-1">
          <div className="h-2 bg-stone-700 dark:bg-stone-400 rounded-[1px]" />
          <div className="flex-1 grid grid-cols-3 gap-1">
            {/* 2 Photos on Left */}
            <div className="flex flex-col gap-1">
              <div className="flex-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 1
              </div>
              <div className="flex-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 2
              </div>
            </div>
            {/* 1 Large Photo on Right */}
            <div className="col-span-2 bg-amber-200/70 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 rounded flex items-center justify-center font-bold text-[7px] text-amber-800 dark:text-amber-200">
              Photo 3 (Feature)
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 h-5">
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
          </div>
        </div>
      )}

      {layoutId === 'layout-center-feature' && (
        <div className="h-full flex flex-col gap-1">
          <div className="h-2 bg-stone-700 dark:bg-stone-400 rounded-[1px]" />
          <div className="flex-1 grid grid-cols-4 gap-1">
            {/* Photo 1: Left */}
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 1
            </div>
            {/* Photo 2: Large Center */}
            <div className="col-span-2 bg-amber-200/70 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 rounded flex items-center justify-center font-bold text-[7px] text-amber-800 dark:text-amber-200">
              Photo 2 (Center)
            </div>
            {/* Photo 3: Right */}
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 3
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 h-5">
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
          </div>
        </div>
      )}

      {layoutId === 'layout-horizontal-triptych' && (
        <div className="h-full flex flex-col gap-1">
          <div className="h-2 bg-stone-700 dark:bg-stone-400 rounded-[1px]" />
          {/* Three photos in a row */}
          <div className="grid grid-cols-3 gap-1 h-11">
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 1
            </div>
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 2
            </div>
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 3
            </div>
          </div>
          {/* Article 3 columns */}
          <div className="flex-1 grid grid-cols-3 gap-1">
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="bg-stone-200 dark:bg-stone-800 rounded" />
          </div>
        </div>
      )}

      {layoutId === 'layout-editorial-asymmetric' && (
        <div className="h-full flex flex-col gap-1">
          <div className="h-2 bg-stone-700 dark:bg-stone-400 rounded-[1px]" />
          <div className="flex-1 grid grid-cols-3 gap-1">
            <div className="flex flex-col gap-1">
              <div className="h-9 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 1
              </div>
              <div className="flex-1 bg-stone-200 dark:bg-stone-800 rounded" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex-1 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-9 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 2
              </div>
            </div>
            <div className="bg-amber-200/70 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 rounded flex items-center justify-center font-bold text-[7px] text-amber-800 dark:text-amber-200">
              Photo 3 (Tall)
            </div>
          </div>
        </div>
      )}

      {layoutId === 'layout-classic-dispatch' && (
        <div className="h-full flex flex-col gap-1">
          <div className="h-2 bg-stone-700 dark:bg-stone-400 rounded-[1px]" />
          {/* 3 separate editorial story blocks each with its own photo */}
          <div className="flex-1 grid grid-cols-3 gap-1">
            <div className="flex flex-col gap-1">
              <div className="h-7 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 1
              </div>
              <div className="flex-1 bg-stone-200 dark:bg-stone-800 rounded" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-7 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 2
              </div>
              <div className="flex-1 bg-stone-200 dark:bg-stone-800 rounded" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-7 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
                Photo 3
              </div>
              <div className="flex-1 bg-stone-200 dark:bg-stone-800 rounded" />
            </div>
          </div>
        </div>
      )}

      {layoutId === 'layout-headline-spread' && (
        <div className="h-full flex flex-col gap-1">
          <div className="h-4 bg-stone-800 dark:bg-stone-300 rounded-[1px] flex items-center justify-center text-[6px] font-bold text-white dark:text-stone-900">
            MASSIVE HEADLINE
          </div>
          <div className="grid grid-cols-3 gap-1 h-7">
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 1
            </div>
            <div className="col-span-2 bg-stone-200 dark:bg-stone-800 rounded" />
          </div>
          <div className="grid grid-cols-3 gap-1 flex-1">
            <div className="col-span-2 bg-amber-200/70 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 rounded flex items-center justify-center font-bold text-[7px] text-amber-800 dark:text-amber-200">
              Photo 2 (Center)
            </div>
            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded flex items-center justify-center text-[6px] text-amber-800 dark:text-amber-300">
              Photo 3
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
