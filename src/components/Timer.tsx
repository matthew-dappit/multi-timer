"use client";

import {useEffect, useRef, useState} from "react";

interface TimerTaskOption {
  id: string;
  name: string;
}

interface TimerProps {
  id: string;
  taskId: string | null;
  taskName: string;
  notes: string;
  elapsed: number;
  isCompact: boolean;
  isActive?: boolean;
  syncedToZoho?: boolean;
  backendTimerId?: number | null;
  lastActiveDate?: string | null;
  isSelected?: boolean;
  selectionMode?: boolean;
  taskOptions: TimerTaskOption[];
  isTaskSelectDisabled?: boolean;
  isTaskOptionsLoading?: boolean;
  onTaskChange: (id: string, taskId: string | null, taskName: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onStart?: () => void | Promise<void>;
  onStop?: () => void | Promise<void>;
  onOpenTimeEntry?: () => void;
  onOpenTimeHistory?: () => void;
  onSelectionChange?: (id: string, selected: boolean) => void;
}

export default function Timer({
  id,
  taskId,
  taskName,
  notes,
  elapsed,
  isCompact,
  isActive = false,
  syncedToZoho = false,
  backendTimerId = null,
  lastActiveDate = null,
  isSelected = false,
  selectionMode = false,
  taskOptions,
  isTaskSelectDisabled = false,
  isTaskOptionsLoading = false,
  onTaskChange,
  onNotesChange,
  onStart,
  onStop,
  onOpenTimeEntry,
  onOpenTimeHistory,
  onSelectionChange,
}: TimerProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingCompactNote, setIsEditingCompactNote] = useState(false);
  const [compactNotesValue, setCompactNotesValue] = useState(notes);
  const [standardNotesValue, setStandardNotesValue] = useState(notes);
  const compactNotesRef = useRef<HTMLTextAreaElement | null>(null);
  const isUserTypingRef = useRef(false);

  // Helper to check if timer is from today
  const isFromToday = (() => {
    if (!lastActiveDate) return true; // If no date, assume it's today (new timer)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return lastActiveDate === today;
  })();

  // Determine if start button should be shown/enabled
  const canStart = isFromToday && !syncedToZoho;

  useEffect(() => {
    // Don't sync from props if user is actively typing
    if (!isEditingCompactNote && !isUserTypingRef.current) {
      setCompactNotesValue(notes);
      setStandardNotesValue(notes);
    }
  }, [notes, isEditingCompactNote]);

  useEffect(() => {
    if (isEditingCompactNote && compactNotesRef.current) {
      compactNotesRef.current.focus();
      if (compactNotesValue.trim() !== "") {
        compactNotesRef.current.select();
      }
    }
    // Intentionally excluding compactNotesValue to prevent re-selecting on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingCompactNote]);

  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formattedTime = formatTime(elapsed);
  const hasMatchingTask =
    taskId !== null && taskOptions.some((option) => option.id === taskId);
  const taskSelectValue = hasMatchingTask ? taskId! : "";
  const taskPlaceholder = (() => {
    if (isTaskSelectDisabled) {
      return "Select a project first";
    }
    if (isTaskOptionsLoading && !taskOptions.length) {
      return "Loading tasks...";
    }
    if (!hasMatchingTask && taskName) {
      return `Previous: ${taskName}`;
    }
    if (!taskOptions.length) {
      return "No tasks available";
    }
    return "Select task";
  })();
  const disableTaskSelect =
    isTaskSelectDisabled || (isTaskOptionsLoading && !taskOptions.length);

  const handleToggle = () => {
    if (isActive && onStop) {
      onStop();
    } else if (!isActive && onStart && canStart) {
      onStart();
    }
  };

  const handleMenuClick = (action: "addTime" | "viewHistory") => {
    setShowMenu(false);
    if (action === "addTime" && onOpenTimeEntry) {
      onOpenTimeEntry();
    } else if (action === "viewHistory" && onOpenTimeHistory) {
      onOpenTimeHistory();
    }
  };

  if (isCompact) {
    const borderColor = isActive
      ? "border-teal-400 ring-2 ring-teal-400/50"
      : "border-gray-200 dark:border-gray-700";
    const compactNotesDisplay = isEditingCompactNote
      ? compactNotesValue
      : notes;
    const compactHasNotes = compactNotesDisplay.trim() !== "";
    const compactNotesLabel = compactHasNotes
      ? compactNotesDisplay
      : "Add note";

    // Show checkbox if in selection mode and has backend ID
    const showCheckbox = selectionMode && backendTimerId !== null && !syncedToZoho;

    return (
      <div
        className={`group relative flex h-full flex-col gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md dark:bg-gray-800 ${borderColor}`}
      >
        {/* Selection Checkbox */}
        {showCheckbox && (
          <div className="absolute left-2 top-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectionChange?.(id, e.target.checked);
              }}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-teal-500 focus:ring-2 focus:ring-teal-400"
            />
          </div>
        )}

        {/* Sync Status Badge */}
        {backendTimerId !== null && (
          <div className="absolute left-2 bottom-2">
            {syncedToZoho ? (
              <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Synced
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Pending
              </div>
            )}
          </div>
        )}
        {/* Menu Button - Visible on hover */}
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClick("addTime");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Time Manually
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClick("viewHistory");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                View Time History
              </button>
            </div>
          )}
        </div>

        {/* Timer Content - Clickable to start/stop */}
        <div
          onClick={handleToggle}
          className={isActive || canStart ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
        >
          <span className="font-mono text-2xl font-light text-gray-900 dark:text-gray-100">
            {formattedTime}
          </span>

          {isEditingCompactNote ? (
            <textarea
              value={compactNotesValue}
              onChange={(event) => {
                const nextNotes = event.target.value;
                isUserTypingRef.current = true;
                setCompactNotesValue(nextNotes);
              }}
              onBlur={() => {
                isUserTypingRef.current = false;
                // Only trigger backend update when done editing
                if (compactNotesValue !== notes) {
                  onNotesChange(id, compactNotesValue);
                }
                // Exit edit mode after updating parent state
                setIsEditingCompactNote(false);
              }}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              autoFocus
              rows={2}
              placeholder="Add note"
              ref={compactNotesRef}
              className="w-full resize-none rounded-md border border-teal-400 bg-transparent px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-teal-400 dark:border-teal-400/70 dark:bg-transparent dark:text-gray-200"
            />
          ) : (
            <div
              onClick={(event) => {
                event.stopPropagation();
                setCompactNotesValue(notes);
                setIsEditingCompactNote(true);
              }}
              className={`break-words text-sm font-medium ${
                compactHasNotes
                  ? "cursor-text text-gray-700 dark:text-gray-200"
                  : "cursor-text text-gray-400 dark:text-gray-500"
              }`}
            >
              {compactNotesLabel}
            </div>
          )}
        </div>
      </div>
    );
  }

  const statusColor = isActive ? "bg-teal-400" : "bg-gray-300";
  const statusText = isActive ? "Running" : "Idle";
  const buttonBgColor = isActive ? "#FF7F50" : "#01D9B5"; // coral : turquoise
  const buttonText = isActive ? "Stop" : "Start";
  const borderColor = isActive
    ? "border-teal-400 ring-2 ring-teal-400/50"
    : "border-gray-200 dark:border-gray-700";

  // Show checkbox if in selection mode and has backend ID
  const showCheckbox = selectionMode && backendTimerId !== null && !syncedToZoho;

  return (
    <div
      className={`relative flex h-full flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow dark:bg-gray-800 ${borderColor}`}
    >
      {/* Selection Checkbox */}
      {showCheckbox && (
        <div className="absolute left-3 top-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectionChange?.(id, e.target.checked);
            }}
            className="h-5 w-5 cursor-pointer rounded border-gray-300 text-teal-500 focus:ring-2 focus:ring-teal-400"
          />
        </div>
      )}
      {/* Menu Button - Always visible in standard mode */}
      <div className="absolute right-3 top-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-8 z-10 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick("addTime");
              }}
              className="flex w-full items-center gap-2 rounded-t-lg px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Time Manually
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick("viewHistory");
              }}
              className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Time History
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusColor}`} />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {statusText}
          </span>
        </div>
        {/* Sync Status Badge */}
        {backendTimerId !== null && (
          <div>
            {syncedToZoho ? (
              <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Synced
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Pending
              </div>
            )}
          </div>
        )}
      </div>

      <select
        value={taskSelectValue}
        onChange={(event) => {
          const nextTaskId = event.target.value
            ? event.target.value
            : null;
          const nextTask =
            nextTaskId !== null
              ? taskOptions.find((option) => option.id === nextTaskId)
              : null;
          onTaskChange(id, nextTaskId, nextTask ? nextTask.name : "");
        }}
        className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm font-medium text-gray-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400 dark:border-gray-700 dark:text-gray-100"
        disabled={disableTaskSelect}
      >
        <option value="">{taskPlaceholder}</option>
        {taskOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      <div className="text-center">
        <div className="font-mono text-3xl font-light text-gray-900 dark:text-gray-100">
          {formattedTime}
        </div>
      </div>

      <textarea
        value={standardNotesValue}
        onChange={(event) => {
          isUserTypingRef.current = true;
          setStandardNotesValue(event.target.value);
        }}
        onBlur={() => {
          isUserTypingRef.current = false;
          if (standardNotesValue !== notes) {
            onNotesChange(id, standardNotesValue);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        placeholder="Notes"
        rows={2}
        className="w-full flex-1 resize-none rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400 dark:border-gray-700 dark:text-gray-200"
      />

      {/* Only show start/stop button for today's timers */}
      {isFromToday && (
        <button
          onClick={handleToggle}
          disabled={!isActive && !canStart}
          className="w-full rounded-md px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{backgroundColor: buttonBgColor}}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
