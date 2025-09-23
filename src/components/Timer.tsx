"use client";

import {useState, useEffect, useRef} from "react";

interface TimerProps {
  id: string;
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  isActive?: boolean;
}

export default function Timer({
  id,
  onStart,
  onStop,
  isActive = false,
}: TimerProps) {
  const [time, setTime] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [notes, setNotes] = useState("");
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
        setTime((prevTime) => prevTime + 1);
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
  }, [isRunning, isActive]);

  // Stop timer if not active but running
  useEffect(() => {
    if (isRunning && !isActive) {
      setIsRunning(false);
    }
  }, [isActive]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-light text-gray-900 dark:text-gray-100 font-mono">
          {formatTime(time)}
        </div>
        <div className="mt-2">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              isRunning && isActive ? "" : "bg-gray-300"
            }`}
            style={{
              backgroundColor: isRunning && isActive ? "#01D9B5" : undefined,
            }}
          />
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {isRunning && isActive ? "Running" : "Stopped"}
          </span>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 mb-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project name
          </label>
          <select
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{"--tw-ring-color": "#01D9B5"} as any}
          >
            <option value="">Select Project</option>
            <option value="dappit-internal">Dappit Internal</option>
            <option value="client-project-a">Client Project A</option>
            <option value="client-project-b">Client Project B</option>
            <option value="marketing">Marketing</option>
            <option value="training">Training & Development</option>
          </select>
        </div>

        {/* Task Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Task Name
          </label>
          <select
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{"--tw-ring-color": "#01D9B5"} as any}
          >
            <option value="">Select Task</option>
            <option value="development">Development</option>
            <option value="code-review">Code Review</option>
            <option value="testing">Testing</option>
            <option value="documentation">Documentation</option>
            <option value="meetings">Meetings</option>
            <option value="planning">Planning</option>
            <option value="bug-fixes">Bug Fixes</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about what you're working on..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
            style={{"--tw-ring-color": "#01D9B5"} as any}
          />
        </div>

        {/* Billable Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`billable-${id}`}
            className="h-4 w-4 border-gray-300 rounded"
            style={{accentColor: "#01D9B5"}}
            defaultChecked
          />
          <label
            htmlFor={`billable-${id}`}
            className="ml-2 text-sm text-gray-700 dark:text-gray-300"
          >
            Billable
          </label>
        </div>
      </div>

      {/* Start/Stop Button */}
      <button
        onClick={toggleTimer}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors shadow-md ${
          isRunning && isActive
            ? "text-white hover:opacity-90"
            : "text-white hover:opacity-90"
        }`}
        style={{
          backgroundColor: isRunning && isActive ? "#FF7F50" : "#01D9B5",
        }}
      >
        {isRunning && isActive ? "STOP" : "START"}
      </button>
    </div>
  );
}
