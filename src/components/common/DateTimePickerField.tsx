import React from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import {
  parseLocalDateTimeParts,
  buildLocalDateTimeString,
  applyQuickSchedulePreset,
  formatTargetCountdownSummary,
  getDaysInMonth,
  QuickSchedulePreset,
} from '../../utils/dateTimeFormat.ts';

interface DateTimePickerFieldProps {
  label: string;
  value: string;
  onChange: (nextIsoLocal: string) => void;
  accent?: 'amber' | 'red';
  helperText?: string;
}

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

const QUICK_PRESETS: Array<{ id: QuickSchedulePreset; label: string }> = [
  { id: 'in-15m', label: '+15 Mins' },
  { id: 'in-1h', label: '+1 Hour' },
  { id: 'in-3h', label: '+3 Hours' },
  { id: 'tonight-8pm', label: 'Tonight 8 PM' },
  { id: 'tomorrow-8pm', label: 'Tomorrow 8 PM' },
  { id: 'in-3d', label: '+3 Days' },
  { id: 'in-7d', label: '+7 Days' },
];

export const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  label,
  value,
  onChange,
  accent = 'amber',
  helperText,
}) => {
  const parts = parseLocalDateTimeParts(value);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
  if (!years.includes(parts.year)) {
    years.unshift(parts.year);
  }

  const maxDay = getDaysInMonth(parts.year, parts.month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const summary = formatTargetCountdownSummary(
    value || buildLocalDateTimeString(parts)
  );

  const updatePart = (patch: Partial<typeof parts>) => {
    onChange(buildLocalDateTimeString({ ...parts, ...patch }));
  };

  const borderClass =
    accent === 'red' ? 'border-red-500/40' : 'border-neutral-800';
  const focusClass =
    accent === 'red' ? 'focus:border-red-400' : 'focus:border-amber-400';
  const accentTextClass = accent === 'red' ? 'text-red-400' : 'text-amber-400';

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl bg-neutral-950/90 border ${borderClass} space-y-3`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-1.5">
          <Calendar className={`w-3.5 h-3.5 ${accentTextClass}`} />
          <span>{label}</span>
        </label>
        <span
          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 ${
            summary.isPast ? 'text-emerald-400' : accentTextClass
          }`}
        >
          {summary.relative}
        </span>
      </div>

      {/* One-Click Schedule Presets (Works effortlessly on trackpads, mice & touchscreens) */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(applyQuickSchedulePreset(preset.id))}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-[11px] font-mono font-semibold text-neutral-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Explicit Date & Time Dropdowns (Zero fragile browser datetime-local controls) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {/* Month */}
        <div className="space-y-1">
          <span className="block text-[10px] font-mono uppercase text-neutral-500">
            Month
          </span>
          <select
            aria-label={`${label} Month`}
            value={parts.month}
            onChange={(e) => updatePart({ month: Number(e.target.value) })}
            className={`w-full px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-mono focus:outline-none ${focusClass} cursor-pointer`}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Day */}
        <div className="space-y-1">
          <span className="block text-[10px] font-mono uppercase text-neutral-500">
            Day
          </span>
          <select
            aria-label={`${label} Day`}
            value={parts.day}
            onChange={(e) => updatePart({ day: Number(e.target.value) })}
            className={`w-full px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-mono focus:outline-none ${focusClass} cursor-pointer`}
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {String(d).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="space-y-1">
          <span className="block text-[10px] font-mono uppercase text-neutral-500">
            Year
          </span>
          <select
            aria-label={`${label} Year`}
            value={parts.year}
            onChange={(e) => updatePart({ year: Number(e.target.value) })}
            className={`w-full px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-mono focus:outline-none ${focusClass} cursor-pointer`}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Hour */}
        <div className="space-y-1">
          <span className="block text-[10px] font-mono uppercase text-neutral-500">
            Hour
          </span>
          <select
            aria-label={`${label} Hour`}
            value={parts.hour12}
            onChange={(e) => updatePart({ hour12: Number(e.target.value) })}
            className={`w-full px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-amber-300 text-xs font-mono font-bold focus:outline-none ${focusClass} cursor-pointer`}
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* Minute */}
        <div className="space-y-1">
          <span className="block text-[10px] font-mono uppercase text-neutral-500">
            Min
          </span>
          <select
            aria-label={`${label} Minute`}
            value={parts.minute}
            onChange={(e) => updatePart({ minute: Number(e.target.value) })}
            className={`w-full px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-amber-300 text-xs font-mono font-bold focus:outline-none ${focusClass} cursor-pointer`}
          >
            {minutes.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Toggle */}
        <div className="space-y-1">
          <span className="block text-[10px] font-mono uppercase text-neutral-500">
            AM / PM
          </span>
          <div className="grid grid-cols-2 gap-1">
            {(['AM', 'PM'] as const).map((period) => {
              const active = parts.meridiem === period;
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => updatePart({ meridiem: period })}
                  className={`py-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Local Target Preview */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-neutral-400">
        <span className="flex items-center gap-1.5 text-neutral-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Target: {summary.formatted} (Your local time)</span>
        </span>
        {helperText && (
          <span className="flex items-center gap-1 text-neutral-500">
            <Sparkles className="w-3 h-3 text-amber-500/70" />
            <span>{helperText}</span>
          </span>
        )}
      </div>
    </div>
  );
};
