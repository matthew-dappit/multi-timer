"use client";

import {useState, useEffect} from "react";

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTime: (startTime: number, endTime: number) => void;
  projectName: string;
  taskName: string;
  notes: string;
  isTimerActive: boolean;
}

export default function TimeEntryModal({
  isOpen,
  onClose,
  onAddTime,
  projectName,
  taskName,
  notes,
  isTimerActive,
}: TimeEntryModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startHour, setStartHour] = useState<string>("");
  const [startMinute, setStartMinute] = useState<string>("");
  const [endHour, setEndHour] = useState<string>("");
  const [endMinute, setEndMinute] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [warning, setWarning] = useState<string>("");

  // Initialize with today's date
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      setSelectedDate(dateStr);
      setStartHour("");
      setStartMinute("");
      setEndHour("");
      setEndMinute("");
      setError("");
      setWarning("");
    }
  }, [isOpen]);

  const validateAndSubmit = () => {
    setError("");
    setWarning("");

    // Check if timer is active
    if (isTimerActive) {
      setError("Stop the timer before adding manual time entries");
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

    // Create timestamps
    const date = new Date(selectedDate);
    const startTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      startH,
      startM
    ).getTime();
    const endTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
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

    // Success - add the time
    onAddTime(startTime, endTime);
    onClose();
  };

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add Time Manually
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add a past work session
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Context Info */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {projectName}
            </div>
            <div className="text-gray-600 dark:text-gray-300">{taskName}</div>
            {notes && (
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                {notes}
              </div>
            )}
          </div>
        </div>

        {/* Date Picker */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

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
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <span className="flex items-center text-gray-500">:</span>
            <input
              type="text"
              placeholder="MM"
              value={startMinute}
              onChange={(e) => setStartMinute(e.target.value.slice(0, 2))}
              maxLength={2}
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <span className="flex items-center text-gray-500">:</span>
            <input
              type="text"
              placeholder="MM"
              value={endMinute}
              onChange={(e) => setEndMinute(e.target.value.slice(0, 2))}
              maxLength={2}
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-gray-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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

        {/* Warning Message */}
        {warning && (
          <div className="mb-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <div className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
              {warning}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={validateAndSubmit}
            className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{backgroundColor: "#01D9B5"}}
          >
            Add Time
          </button>
        </div>
      </div>
    </div>
  );
}

