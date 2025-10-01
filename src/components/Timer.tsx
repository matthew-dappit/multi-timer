"use client";

import {useState} from "react";

interface TimerProps {
  id: string;
  taskName: string;
  notes: string;
  elapsed: number;
  isCompact: boolean;
  isActive?: boolean;
  onTaskChange: (id: string, task: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  onOpenTimeEntry?: () => void;
  onOpenTimeHistory?: () => void;
}

export default function Timer({
  id,
  taskName,
  notes,
  elapsed,
  isCompact,
  isActive = false,
  onTaskChange,
  onNotesChange,
  onStart,
  onStop,
  onOpenTimeEntry,
  onOpenTimeHistory,
}: TimerProps) {
  const [showMenu, setShowMenu] = useState(false);

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
  const hasNotes = notes.trim() !== "";
  const notesLabel = hasNotes ? notes : "Add note";

  const handleToggle = () => {
    if (isActive && onStop) {
      onStop();
    } else if (!isActive && onStart) {
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

    return (
      <div
        className={`group relative flex h-full flex-col gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md dark:bg-gray-800 ${borderColor}`}
      >
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
        <div onClick={handleToggle} className="cursor-pointer">
          <span className="font-mono text-2xl font-light text-gray-900 dark:text-gray-100">
            {formattedTime}
          </span>

          <div
            className={`break-words text-sm font-medium ${
              hasNotes
                ? "text-gray-700 dark:text-gray-200"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {notesLabel}
          </div>
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

  return (
    <div
      className={`relative flex h-full flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow dark:bg-gray-800 ${borderColor}`}
    >
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

      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${statusColor}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {statusText}
        </span>
      </div>

      <input
        value={taskName}
        onChange={(event) => onTaskChange(id, event.target.value)}
        placeholder="Task name"
        className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm font-medium text-gray-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400 dark:border-gray-700 dark:text-gray-100"
      />

      <div className="text-center">
        <div className="font-mono text-3xl font-light text-gray-900 dark:text-gray-100">
          {formattedTime}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(event) => onNotesChange(id, event.target.value)}
        placeholder="Notes"
        rows={2}
        className="w-full flex-1 resize-none rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400 dark:border-gray-700 dark:text-gray-200"
      />

      <button
        onClick={handleToggle}
        className="w-full rounded-md px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
        style={{backgroundColor: buttonBgColor}}
      >
        {buttonText}
      </button>
    </div>
  );
}
