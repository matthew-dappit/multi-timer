"use client";

import {useState} from "react";

interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  projectName: string;
  taskName: string;
  notes: string;
  startTime: number;
  endTime: number | null;
}

interface TimeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTime: () => void;
  onEditEvent: (eventId: string) => void;
  onStopTimer: () => void;
  projectName: string;
  taskName: string;
  notes: string;
  events: TimeEvent[];
  runningEventId: string | null;
}

export default function TimeHistoryModal({
  isOpen,
  onClose,
  onAddTime,
  onEditEvent,
  onStopTimer,
  projectName,
  taskName,
  notes,
  events,
  runningEventId,
}: TimeHistoryModalProps) {
  if (!isOpen) return null;

  // Group events by date
  const groupedEvents = events.reduce(
    (acc, event) => {
      const date = new Date(event.startTime);
      const dateKey = date.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    },
    {} as Record<string, TimeEvent[]>
  );

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  // Format time as HH:MM
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Format duration
  const formatDuration = (startTime: number, endTime: number | null): string => {
    const end = endTime || Date.now();
    const durationMs = end - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Format date label
  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateKey = date.toISOString().split("T")[0];
    const todayKey = today.toISOString().split("T")[0];
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    if (dateKey === todayKey) return "Today";
    if (dateKey === yesterdayKey) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate total time
  const totalMinutes = events.reduce((sum, event) => {
    const end = event.endTime || Date.now();
    const duration = end - event.startTime;
    return sum + Math.floor(duration / 60000);
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const totalFormatted =
    totalHours === 0 ? `${totalMins}m` : `${totalHours}h ${totalMins}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Time History
              </h2>
              <div className="mt-2 text-sm">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {projectName} • {taskName}
                </div>
                {notes && (
                  <div className="text-gray-500 dark:text-gray-400">{notes}</div>
                )}
                <div className="mt-2 text-lg font-semibold text-teal-600 dark:text-teal-400">
                  Total: {totalFormatted}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedDates.length === 0 ? (
            <div className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No time entries yet
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateStr) => {
                const dateEvents = groupedEvents[dateStr].sort(
                  (a, b) => a.startTime - b.startTime
                );

                return (
                  <div key={dateStr}>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatDateLabel(dateStr)}
                    </h3>
                    <div className="space-y-2">
                      {dateEvents.map((event) => {
                        const isRunning = event.id === runningEventId;
                        return (
                          <div
                            key={event.id}
                            className={`flex items-center justify-between rounded-lg border p-3 transition ${
                              isRunning
                                ? "border-teal-400 bg-teal-50 dark:border-teal-500 dark:bg-teal-900/20"
                                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                {formatTime(event.startTime)} -{" "}
                                {event.endTime
                                  ? formatTime(event.endTime)
                                  : "Running..."}
                              </div>
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {formatDuration(event.startTime, event.endTime)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isRunning ? (
                                <button
                                  onClick={onStopTimer}
                                  className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                  title="Stop timer"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <rect x="6" y="6" width="12" height="12" />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onEditEvent(event.id)}
                                  className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                  title="Edit time slot"
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
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={onAddTime}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{backgroundColor: "#01D9B5"}}
            >
              + Add Time
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

