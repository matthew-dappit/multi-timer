"use client";

import {useState, useEffect} from "react";

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

interface EditTimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventId: string, startTime: number, endTime: number) => void;
  onDelete: (eventId: string) => void;
  event: TimeEvent | null;
}

export default function EditTimeSlotModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
}: EditTimeSlotModalProps) {
  const [startHour, setStartHour] = useState<string>("");
  const [startMinute, setStartMinute] = useState<string>("");
  const [endHour, setEndHour] = useState<string>("");
  const [endMinute, setEndMinute] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize with event data
  useEffect(() => {
    if (isOpen && event) {
      const startDate = new Date(event.startTime);
      setStartHour(startDate.getHours().toString().padStart(2, "0"));
      setStartMinute(startDate.getMinutes().toString().padStart(2, "0"));

      if (event.endTime) {
        const endDate = new Date(event.endTime);
        setEndHour(endDate.getHours().toString().padStart(2, "0"));
        setEndMinute(endDate.getMinutes().toString().padStart(2, "0"));
      } else {
        setEndHour("");
        setEndMinute("");
      }

      setError("");
      setShowDeleteConfirm(false);
    }
  }, [isOpen, event]);

  const validateAndSubmit = () => {
    setError("");

    if (!event) return;

    // Cannot edit running timer
    if (event.endTime === null) {
      setError("Stop the timer before editing this time slot");
      return;
    }

    // Validate inputs
    if (!startHour || !startMinute || !endHour || !endMinute) {
      setError("Please fill in all time fields");
      return;
    }

    const startH = parseInt(startHour);
    const startM = parseInt(startMinute);
    const endH = parseInt(endHour);
    const endM = parseInt(endMinute);

    if (
      isNaN(startH) ||
      isNaN(startM) ||
      isNaN(endH) ||
      isNaN(endM) ||
      startH < 0 ||
      startH > 23 ||
      startM < 0 ||
      startM > 59 ||
      endH < 0 ||
      endH > 23 ||
      endM < 0 ||
      endM > 59
    ) {
      setError("Invalid time format. Hours: 00-23, Minutes: 00-59");
      return;
    }

    // Create timestamps (keep the same date)
    const originalDate = new Date(event.startTime);
    const startTime = new Date(
      originalDate.getFullYear(),
      originalDate.getMonth(),
      originalDate.getDate(),
      startH,
      startM
    ).getTime();
    const endTime = new Date(
      originalDate.getFullYear(),
      originalDate.getMonth(),
      originalDate.getDate(),
      endH,
      endM
    ).getTime();

    // Validate times
    const now = Date.now();
    if (startTime > now) {
      setError("Start time cannot be in the future");
      return;
    }
    if (endTime > now) {
      setError("End time cannot be in the future");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }

    // Calculate duration
    const durationMinutes = Math.floor((endTime - startTime) / 60000);
    if (durationMinutes === 0) {
      setError("Duration must be at least 1 minute");
      return;
    }

    // Success - save the changes
    onSave(event.id, startTime, endTime);
    onClose();
  };

  const handleDelete = () => {
    if (!event) return;
    onDelete(event.id);
    onClose();
  };

  if (!isOpen || !event) return null;

  const formatDuration = () => {
    if (!startHour || !startMinute || !endHour || !endMinute) return "";
    const startH = parseInt(startHour);
    const startM = parseInt(startMinute);
    const endH = parseInt(endHour);
    const endM = parseInt(endMinute);
    if (
      isNaN(startH) ||
      isNaN(startM) ||
      isNaN(endH) ||
      isNaN(endM) ||
      startH < 0 ||
      startH > 23 ||
      startM < 0 ||
      startM > 59 ||
      endH < 0 ||
      endH > 23 ||
      endM < 0 ||
      endM > 59
    )
      return "";

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;

    if (diff <= 0) return "";

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const duration = formatDuration();
  const eventDate = new Date(event.startTime);
  const dateStr = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isRunning = event.endTime === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Edit Time Slot
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {dateStr}
            </p>
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

        {isRunning && (
          <div className="mb-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <div className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
              This timer is currently running. Stop it before editing.
            </div>
          </div>
        )}

        {/* Time Inputs */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Time (24h format)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="HH"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value.slice(0, 2))}
              maxLength={2}
              disabled={isRunning}
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-800"
            />
            <span className="flex items-center text-gray-500">:</span>
            <input
              type="text"
              placeholder="MM"
              value={startMinute}
              onChange={(e) => setStartMinute(e.target.value.slice(0, 2))}
              maxLength={2}
              disabled={isRunning}
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Time (24h format)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="HH"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value.slice(0, 2))}
              maxLength={2}
              disabled={isRunning}
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-800"
            />
            <span className="flex items-center text-gray-500">:</span>
            <input
              type="text"
              placeholder="MM"
              value={endMinute}
              onChange={(e) => setEndMinute(e.target.value.slice(0, 2))}
              maxLength={2}
              disabled={isRunning}
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        </div>

        {/* Duration Display */}
        {duration && (
          <div className="mb-4 rounded-lg bg-teal-50 p-3 dark:bg-teal-900/20">
            <div className="text-sm font-medium text-teal-900 dark:text-teal-300">
              Duration: {duration}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <div className="text-sm font-medium text-red-900 dark:text-red-300">
              {error}
            </div>
          </div>
        )}

        {/* Actions */}
        {showDeleteConfirm ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <div className="text-sm font-medium text-red-900 dark:text-red-300">
                Are you sure you want to delete this time slot?
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={validateAndSubmit}
                disabled={isRunning}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{backgroundColor: "#01D9B5"}}
              >
                Save
              </button>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isRunning}
              className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete Time Slot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

