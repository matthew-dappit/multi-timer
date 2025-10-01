"use client";

import {useEffect, useState} from "react";

// Time tracking event (matches MultiTimer structure)
interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  startTime: number; // timestamp in ms
  endTime: number | null; // null if currently running
  taskName: string;
  projectName: string;
  notes: string;
}

interface HourlyData {
  hour: number;
  minutes: number;
  events: TimeEvent[];
}

interface ProjectSummary {
  projectName: string;
  totalMinutes: number;
  taskCount: number;
  color: string;
}

const TIME_EVENTS_KEY = "multi-timer/time-events";

// Color palette for projects
const PROJECT_COLORS = [
  "#01D9B5", // dappit-turquoise
  "#FF7F50", // dappit-coral
  "#6366F1", // indigo
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // emerald
  "#8B5CF6", // purple
  "#EF4444", // red
];

export default function TimeInsights() {
  const [timeEvents, setTimeEvents] = useState<TimeEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>(
    []
  );

  // Load time events from localStorage
  useEffect(() => {
    try {
      const storedEvents = window.localStorage.getItem(TIME_EVENTS_KEY);
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) {
          setTimeEvents(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load time events", error);
    }
  }, []);

  // Process events for selected date
  useEffect(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Filter events for selected day
    const dayEvents = timeEvents.filter(
      (event) =>
        event.startTime >= dayStart.getTime() &&
        event.startTime <= dayEnd.getTime()
    );

    // Build hourly data
    const hourlyMap: Map<number, HourlyData> = new Map();
    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, {hour, minutes: 0, events: []});
    }

    dayEvents.forEach((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = event.endTime ? new Date(event.endTime) : new Date();

      // Calculate duration in minutes
      const durationMs = eventEnd.getTime() - eventStart.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);

      const hour = eventStart.getHours();
      const hourData = hourlyMap.get(hour)!;
      hourData.minutes += durationMinutes;
      hourData.events.push(event);
    });

    setHourlyData(Array.from(hourlyMap.values()));

    // Build project summaries
    const projectMap: Map<string, ProjectSummary> = new Map();
    dayEvents.forEach((event) => {
      const projectName = event.projectName || "Untitled Project";
      const eventEnd = event.endTime ? new Date(event.endTime) : new Date();
      const durationMs = eventEnd.getTime() - event.startTime;
      const durationMinutes = Math.floor(durationMs / 60000);

      if (!projectMap.has(projectName)) {
        const colorIndex = projectMap.size % PROJECT_COLORS.length;
        projectMap.set(projectName, {
          projectName,
          totalMinutes: 0,
          taskCount: 0,
          color: PROJECT_COLORS[colorIndex],
        });
      }

      const summary = projectMap.get(projectName)!;
      summary.totalMinutes += durationMinutes;
      summary.taskCount += 1;
    });

    const summaries = Array.from(projectMap.values()).sort(
      (a, b) => b.totalMinutes - a.totalMinutes
    );
    setProjectSummaries(summaries);
  }, [timeEvents, selectedDate]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const totalMinutes = projectSummaries.reduce(
    (sum, project) => sum + project.totalMinutes,
    0
  );

  const maxHourlyMinutes = Math.max(...hourlyData.map((h) => h.minutes), 1);

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex h-full w-full flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Time Insights
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Visualize your time tracking patterns
            </p>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousDay}
              className="rounded-lg border border-gray-300 p-2 transition hover:border-teal-400 hover:bg-teal-50 dark:border-gray-700 dark:hover:border-teal-400 dark:hover:bg-teal-500/10 cursor-pointer"
              title="Previous day"
            >
              <svg
                className="h-5 w-5 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex flex-col items-center min-w-[180px]">
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 cursor-pointer"
                >
                  Jump to today
                </button>
              )}
            </div>

            <button
              onClick={goToNextDay}
              disabled={isToday}
              className={`rounded-lg border border-gray-300 p-2 transition cursor-pointer ${
                isToday
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:border-teal-400 hover:bg-teal-50 dark:border-gray-700 dark:hover:border-teal-400 dark:hover:bg-teal-500/10"
              }`}
              title="Next day"
            >
              <svg
                className="h-5 w-5 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Daily Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Time
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {formatTime(totalMinutes)}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Projects Worked
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {projectSummaries.length}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Sessions
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {
                timeEvents.filter((e) => {
                  const dayStart = new Date(selectedDate);
                  dayStart.setHours(0, 0, 0, 0);
                  const dayEnd = new Date(selectedDate);
                  dayEnd.setHours(23, 59, 59, 999);
                  return (
                    e.startTime >= dayStart.getTime() &&
                    e.startTime <= dayEnd.getTime()
                  );
                }).length
              }
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Hourly Heatmap - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Hourly Breakdown
            </h3>

            <div className="space-y-3">
              {hourlyData.map((hourData) => {
                const intensity =
                  maxHourlyMinutes > 0
                    ? (hourData.minutes / maxHourlyMinutes) * 100
                    : 0;
                const barColor =
                  intensity > 0
                    ? `rgba(1, 217, 181, ${Math.max(0.2, intensity / 100)})`
                    : "transparent";

                return (
                  <div
                    key={hourData.hour}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-14 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                      {formatHour(hourData.hour)}
                    </div>
                    <div className="relative flex-1 h-8 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
                      <div
                        className="absolute inset-0 transition-all duration-300 group-hover:opacity-80"
                        style={{
                          backgroundColor: barColor,
                          width: `${intensity}%`,
                        }}
                      />
                      {hourData.minutes > 0 && (
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {formatTime(hourData.minutes)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Project Breakdown - Takes 1 column */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Projects
            </h3>

            {projectSummaries.length === 0 ? (
              <div className="text-center py-8">
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
                  No time tracked for this day
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projectSummaries.map((project) => {
                  const percentage =
                    totalMinutes > 0
                      ? (project.totalMinutes / totalMinutes) * 100
                      : 0;

                  return (
                    <div
                      key={project.projectName}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{backgroundColor: project.color}}
                            />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {project.projectName}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {project.taskCount} session
                            {project.taskCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatTime(project.totalMinutes)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: project.color,
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
