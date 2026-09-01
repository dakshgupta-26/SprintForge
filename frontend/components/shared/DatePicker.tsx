"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  setMonth as setDateMonth,
  setYear as setDateYear,
  getYear,
  getMonth,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabledDates?: (date: Date) => boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
  popoverClassName?: string;
  error?: string | boolean;
  label?: string;
  id?: string;
  name?: string;
  align?: "left" | "right";
  showTodayButton?: boolean;
  showClearButton?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Safely parses a `YYYY-MM-DD` string into a local calendar Date without UTC offset shifts.
 */
function parseYMD(ymd?: string | null): Date | null {
  if (!ymd || typeof ymd !== "string") return null;
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const parsed = new Date(ymd);
    return isNaN(parsed.getTime()) ? null : startOfDay(parsed);
  }
  const [, year, month, day] = match;
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
}

/**
 * Formats a local Date into a standard `YYYY-MM-DD` string.
 */
function toYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  disabledDates,
  disabled = false,
  required = false,
  className,
  buttonClassName,
  popoverClassName,
  error,
  label,
  id,
  name,
  align = "left",
  showTodayButton = true,
  showClearButton = true,
}: DatePickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarGridRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  // Selected date parsed safely
  const selectedDate = useMemo(() => parseYMD(value), [value]);
  const minDateObj = useMemo(() => parseYMD(minDate), [minDate]);
  const maxDateObj = useMemo(() => parseYMD(maxDate), [maxDate]);

  // Current viewed month/year in calendar
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => selectedDate || new Date());
  // Keyboard focused date
  const [focusedDate, setFocusedDate] = useState<Date>(() => selectedDate || new Date());

  // Sync viewed date whenever value changes or popup opens
  useEffect(() => {
    if (selectedDate) {
      setCurrentViewDate(selectedDate);
      setFocusedDate(selectedDate);
    }
  }, [selectedDate, isOpen]);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setViewMode("days");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  // Check if a specific date is disabled
  const isDateDisabled = useCallback(
    (date: Date) => {
      const dayStart = startOfDay(date);
      if (minDateObj && isBefore(dayStart, minDateObj)) return true;
      if (maxDateObj && isAfter(dayStart, maxDateObj)) return true;
      if (disabledDates && disabledDates(dayStart)) return true;
      return false;
    },
    [minDateObj, maxDateObj, disabledDates]
  );

  // Month navigation
  const handlePrevMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentViewDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentViewDate((prev) => addMonths(prev, 1));
  };

  // Select Date Handler
  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date)) return;
    const ymd = toYMD(date);
    onChange(ymd);
    setIsOpen(false);
    setViewMode("days");
  };

  // Select Today
  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    if (isDateDisabled(today)) return;
    onChange(toYMD(today));
    setCurrentViewDate(today);
    setIsOpen(false);
    setViewMode("days");
  };

  // Clear Value
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
    setViewMode("days");
  };

  // Keyboard navigation within the calendar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setViewMode("days");
      triggerRef.current?.focus();
      return;
    }

    if (viewMode === "days") {
      let nextFocus = new Date(focusedDate);

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          nextFocus = addDays(focusedDate, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          nextFocus = addDays(focusedDate, 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          nextFocus = addDays(focusedDate, -7);
          break;
        case "ArrowDown":
          e.preventDefault();
          nextFocus = addDays(focusedDate, 7);
          break;
        case "PageUp":
          e.preventDefault();
          nextFocus = subMonths(focusedDate, 1);
          break;
        case "PageDown":
          e.preventDefault();
          nextFocus = addMonths(focusedDate, 1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleSelectDate(focusedDate);
          return;
        default:
          return;
      }

      setFocusedDate(nextFocus);
      if (!isSameMonth(nextFocus, currentViewDate)) {
        setCurrentViewDate(nextFocus);
      }
    }
  };

  // Generate 42 calendar grid days (6 weeks)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentViewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate || days.length < 42) {
      days.push(day);
      day = addDays(day, 1);
      if (days.length >= 42) break;
    }

    return days;
  }, [currentViewDate]);

  // Current year range for year picker (12 years)
  const currentYear = getYear(currentViewDate);
  const yearStart = Math.floor(currentYear / 12) * 12;
  const yearsList = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => yearStart + i);
  }, [yearStart]);

  const displayString = useMemo(() => {
    if (!selectedDate) return null;
    return format(selectedDate, "dd MMM yyyy");
  }, [selectedDate]);

  const today = useMemo(() => new Date(), []);

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-slate-300 mb-1.5 font-mono uppercase tracking-wider"
        >
          {label} {required && <span className="text-violet-400">*</span>}
        </label>
      )}

      {/* Hidden input for standard form submission compatibility */}
      {name && <input type="hidden" name={name} value={value || ""} />}

      {/* ── Trigger Button ── */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group select-none",
          "bg-[#090d1f] border border-white/[0.08] text-white",
          "hover:border-violet-500/40 hover:bg-white/[0.03]",
          "focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500",
          isOpen && "ring-2 ring-violet-500/40 border-violet-500 bg-white/[0.04]",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          error && "border-rose-500/60 focus:ring-rose-500/40",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CalendarIcon
            className={cn(
              "w-4 h-4 flex-shrink-0 transition-colors",
              selectedDate
                ? "text-violet-400"
                : "text-slate-500 group-hover:text-slate-400"
            )}
          />
          <span
            className={cn(
              "text-xs sm:text-sm truncate font-medium",
              selectedDate ? "text-white" : "text-slate-500"
            )}
          >
            {displayString || placeholder}
          </span>
        </div>

        {/* Clear Button on hover or dropdown indicator */}
        <div className="flex items-center gap-1">
          {showClearButton && selectedDate && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
              title="Clear date"
              role="button"
              tabIndex={0}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-slate-500 transition-transform duration-200",
              isOpen && "rotate-180 text-violet-400"
            )}
          />
        </div>
      </button>

      {/* ── Error Message ── */}
      {typeof error === "string" && error && (
        <p className="mt-1 text-[11px] font-medium text-rose-400">{error}</p>
      )}

      {/* ── Floating Calendar Popover ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: -4 }}
            transition={{
              duration: 0.16,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "absolute z-50 mt-1.5 w-[288px] sm:w-[304px] rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl",
              "bg-[#070a14] border border-white/[0.1] text-foreground select-none",
              align === "right" ? "right-0" : "left-0",
              popoverClassName
            )}
            style={{
              boxShadow:
                "0 20px 40px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
            role="dialog"
            aria-label="Calendar date picker"
          >
            {/* ── 1. Top Navigation Bar ── */}
            <div className="flex items-center justify-between gap-1 mb-3">
              {/* Month + Year selector button */}
              <button
                type="button"
                onClick={() =>
                  setViewMode(viewMode === "days" ? "months" : "days")
                }
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-bold text-white hover:bg-white/[0.08] transition-colors"
              >
                <span>
                  {format(currentViewDate, "MMMM yyyy")}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-violet-400 transition-transform",
                    viewMode !== "days" && "rotate-180"
                  )}
                />
              </button>

              {/* Previous / Next Month Arrows */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── 2. VIEW: Month & Year Quick Jump ── */}
            {viewMode === "months" && (
              <div className="py-1">
                {/* Year Navigation Bar */}
                <div className="flex items-center justify-between px-2 mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentViewDate((prev) =>
                        setDateYear(prev, getYear(prev) - 1)
                      )
                    }
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs font-bold text-violet-300">
                    {getYear(currentViewDate)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentViewDate((prev) =>
                        setDateYear(prev, getYear(prev) + 1)
                      )
                    }
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 12-Month Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((name, index) => {
                    const isCurrent = getMonth(currentViewDate) === index;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setCurrentViewDate((prev) =>
                            setDateMonth(prev, index)
                          );
                          setViewMode("days");
                        }}
                        className={cn(
                          "py-2 px-1 rounded-xl text-xs font-semibold transition-all text-center",
                          isCurrent
                            ? "bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30"
                            : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                        )}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 3. VIEW: Standard Days Grid ── */}
            {viewMode === "days" && (
              <div ref={calendarGridRef}>
                {/* Weekday Header */}
                <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                  {WEEKDAY_NAMES.map((day) => (
                    <div
                      key={day}
                      className="h-6 flex items-center justify-center font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 42-Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const isSelected = selectedDate
                      ? isSameDay(day, selectedDate)
                      : false;
                    const isCurrentMonth = isSameMonth(
                      day,
                      currentViewDate
                    );
                    const isCurrentToday = isSameDay(day, today);
                    const disabledDay = isDateDisabled(day);
                    const isFocused = isSameDay(day, focusedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={disabledDay}
                        onClick={() => handleSelectDate(day)}
                        className={cn(
                          "relative h-8 sm:h-8.5 rounded-xl font-medium text-xs flex items-center justify-center transition-all duration-100",
                          // Selected state
                          isSelected &&
                            "bg-violet-600 text-white font-bold shadow-[0_0_16px_rgba(139,92,246,0.4)] z-10",
                          // Normal month day
                          !isSelected &&
                            isCurrentMonth &&
                            !disabledDay &&
                            "text-slate-200 hover:text-white hover:bg-white/[0.08]",
                          // Overflow from other month
                          !isSelected &&
                            !isCurrentMonth &&
                            !disabledDay &&
                            "text-slate-600 hover:text-slate-400 hover:bg-white/[0.04]",
                          // Disabled state
                          disabledDay &&
                            "opacity-20 cursor-not-allowed pointer-events-none line-through",
                          // Keyboard focused ring
                          isFocused &&
                            !isSelected &&
                            "ring-1 ring-violet-400/50"
                        )}
                      >
                        <span>{format(day, "d")}</span>

                        {/* Today indicator dot */}
                        {isCurrentToday && !isSelected && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 4. Bottom Actions: Today & Clear ── */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
              {showClearButton ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors font-medium text-[11px]"
                >
                  Clear
                </button>
              ) : (
                <span />
              )}

              {showTodayButton && (
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-violet-300 hover:text-white hover:bg-violet-600/20 font-semibold text-[11px] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Today
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
