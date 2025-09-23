"use client";

import {useState} from "react";
import Timer from "./Timer";

interface TimerData {
  id: string;
  name: string;
  elapsed: number; // seconds
}

export default function MultiTimer() {
  const [timers, setTimers] = useState<TimerData[]>([
    {id: "1", name: "Timer 1", elapsed: 0},
  ]);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  // Handle timer start - ensures only one timer runs at a time
  const handleTimerStart = (timerId: string) => {
    setActiveTimerId(timerId);
  };

  // Handle timer stop
  const handleTimerStop = (timerId: string) => {
    if (activeTimerId === timerId) {
      setActiveTimerId(null);
    }
  };

  // Add new timer
  const addTimer = () => {
    const newId = (timers.length + 1).toString();
    setTimers([...timers, {id: newId, name: `Timer ${newId}`, elapsed: 0}]);
  };

  // Remove timer
  const removeTimer = (timerId: string) => {
    if (timers.length > 1) {
      setTimers(timers.filter((timer) => timer.id !== timerId));
      if (activeTimerId === timerId) {
        setActiveTimerId(null);
      }
    }
  };

  // Handle elapsed time update from Timer
  const handleElapsedChange = (id: string, newElapsed: number) => {
    setTimers((prevTimers) =>
      prevTimers.map((timer) =>
        timer.id === id ? {...timer, elapsed: newElapsed} : timer
      )
    );
  };

  // Format time to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate total daily time
  const totalDailyTime = timers.reduce((sum, t) => sum + t.elapsed, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Daily Total */}
      <div className="bg-gray-900 dark:bg-dappit-black text-white rounded-lg p-6 mb-8 text-center">
        <h2 className="text-lg font-medium mb-2">Today&apos;s Total</h2>
        <div className="text-5xl font-light font-mono">
          {formatTime(totalDailyTime)}
        </div>
        <p className="text-gray-300 dark:text-dappit-gray mt-2">
          Across all timers
        </p>
      </div>

      {/* Add Timer Button */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
          Active Timers
        </h3>
        <button
          onClick={addTimer}
          className="bg-dappit-turquoise hover:bg-dappit-turquoise/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 shadow-md"
          style={{backgroundColor: "#01D9B5"}}
        >
          <svg
            className="w-5 h-5"
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
          Add Timer
        </button>
      </div>

      {/* Timers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {timers.map((timer) => (
          <div key={timer.id} className="relative">
            {/* Remove Timer Button (only show if more than 1 timer) */}
            {timers.length > 1 && (
              <button
                onClick={() => removeTimer(timer.id)}
                className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Remove Timer"
              >
                <svg
                  className="w-4 h-4"
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
            )}

            <Timer
              id={timer.id}
              elapsed={timer.elapsed}
              onElapsedChange={handleElapsedChange}
              onStart={handleTimerStart}
              onStop={handleTimerStop}
              isActive={activeTimerId === timer.id}
            />
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              How it works
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Starting any timer automatically pauses all others. Only one timer
              can run at a time to ensure accurate time tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
