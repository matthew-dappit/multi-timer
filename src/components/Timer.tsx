"use client";

import {useState, useEffect, useRef} from "react";
import type {CSSProperties} from "react";

interface TimerProps {
  id: string;
  elapsed: number;
  taskName: string;
  notes: string;
  isCompact: boolean;
  onElapsedChange: (id: string, newElapsed: number) => void;
  onTaskChange: (id: string, task: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  isActive?: boolean;
}

export default function Timer({
  id,
  elapsed,
  taskName,
  notes,
  isCompact,
  onElapsedChange,
  onTaskChange,
  onNotesChange,
  onStart,
  onStop,
  isActive = false,
}: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start timer
  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      onStart?.(id);
    }
  };

  // Stop timer
  const stopTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      onStop?.(id);
    }
  };

  // Toggle timer
  const toggleTimer = () => {
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  // Effect to handle timer counting
  useEffect(() => {
    if (isRunning && isActive) {
      intervalRef.current = setInterval(() => {
        onElapsedChange(id, elapsed + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // Only depend on isRunning, isActive, elapsed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isActive, elapsed]);

  // Stop timer if not active but running
  useEffect(() => {
    if (isRunning && !isActive) {
      setIsRunning(false);
    }
  }, [isActive, isRunning]);

  const isHighlighted = isRunning && isActive;
  const activeIndicatorStyle = isHighlighted ? "ring-2 ring-offset-2" : "";
  const activeRingStyle = isHighlighted
    ? ({"--tw-ring-color": "#01D9B5"} as CSSProperties)
    : undefined;
  const formattedTime = formatTime(elapsed);
  const hasNotes = notes.trim() !== "";
  const notesLabel = hasNotes ? notes : "Add note";

  if (isCompact) {
    return (
      <button
        type="button"
        onClick={toggleTimer}
        className={`flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md focus:outline-none dark:border-gray-700 dark:bg-gray-800 cursor-pointer ${activeIndicatorStyle}`}
        style={activeRingStyle}
      >
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
      </button>
    );
  }

  return (
    <div
      className={`flex h-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow dark:border-gray-700 dark:bg-gray-800 ${activeIndicatorStyle}`}
      style={activeRingStyle}
    >
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            isRunning && isActive ? "bg-teal-400" : "bg-gray-300"
          }`}
        />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {isRunning && isActive ? "Running" : "Idle"}
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
        onClick={toggleTimer}
        className="w-full rounded-md bg-teal-400 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 cursor-pointer"
        style={{
          backgroundColor: isRunning && isActive ? "#FF7F50" : "#01D9B5",
        }}
      >
        {isRunning && isActive ? "Stop" : "Start"}
      </button>
    </div>
  );
}
