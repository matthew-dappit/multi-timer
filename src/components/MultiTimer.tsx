"use client";

import {useEffect, useRef, useState} from "react";
import Timer from "./Timer";

interface TimerData {
  id: string;
  taskName: string;
  notes: string;
  elapsed: number; // seconds - calculated from time events
}

interface TimerGroup {
  id: string;
  projectName: string;
  timers: TimerData[];
}

interface RunningSession {
  groupId: string;
  timerId: string;
  startedAt: number;
}

// Time tracking event for history/analytics
interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  startTime: number; // timestamp in ms
  endTime: number | null; // null if currently running
  taskName: string; // snapshot at time of event
  projectName: string; // snapshot at time of event
}

const createId = () => Math.random().toString(36).slice(2, 12);

const createTimer = (): TimerData => ({
  id: createId(),
  taskName: "",
  notes: "",
  elapsed: 0,
});

const createGroup = (index: number): TimerGroup => ({
  id: createId(),
  projectName: `Project ${index}`,
  timers: [createTimer()],
});

const STORAGE_KEY = "multi-timer/state";
const RUNNING_SESSION_KEY = "multi-timer/running";
const TIME_EVENTS_KEY = "multi-timer/time-events";

// Helper: Calculate total elapsed seconds from time events for a specific timer
const calculateElapsedFromEvents = (
  events: TimeEvent[],
  groupId: string,
  timerId: string,
  currentTime: number = Date.now()
): number => {
  const relevantEvents = events.filter(
    (event) => event.groupId === groupId && event.timerId === timerId
  );

  let totalSeconds = 0;

  for (const event of relevantEvents) {
    const endTime = event.endTime ?? currentTime;
    const duration = Math.max(
      0,
      Math.floor((endTime - event.startTime) / 1000)
    );
    totalSeconds += duration;
  }

  return totalSeconds;
};

// Helper: Get today's date key for filtering events
const getTodayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

// Helper: Filter events for today only
const filterTodayEvents = (events: TimeEvent[]): TimeEvent[] => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  return events.filter((event) => event.startTime >= todayStartMs);
};

const normaliseTimer = (candidate: unknown): TimerData => {
  if (!candidate || typeof candidate !== "object") {
    return createTimer();
  }

  const value = candidate as Partial<TimerData>;
  const elapsed = Number(value.elapsed);

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : createId(),
    taskName: typeof value.taskName === "string" ? value.taskName : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    elapsed: Number.isFinite(elapsed) && elapsed >= 0 ? Math.floor(elapsed) : 0,
  };
};

const normaliseGroup = (candidate: unknown, index: number): TimerGroup => {
  if (!candidate || typeof candidate !== "object") {
    return createGroup(index + 1);
  }

  const value = candidate as Partial<TimerGroup>;
  const timersSource = Array.isArray(value.timers) ? value.timers : [];
  const timers = timersSource
    .map((timer) => normaliseTimer(timer))
    .filter(Boolean);

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : createId(),
    projectName:
      typeof value.projectName === "string" && value.projectName.trim()
        ? value.projectName
        : `Project ${index + 1}`,
    timers: timers.length ? timers : [createTimer()],
  };
};

export default function MultiTimer() {
  const [groups, setGroups] = useState<TimerGroup[]>([createGroup(1)]);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [timeEvents, setTimeEvents] = useState<TimeEvent[]>([]);
  const hasHydrated = useRef(false);
  const runningSessionRef = useRef<RunningSession | null>(null);
  const activeEventIdRef = useRef<string | null>(null);

  const timerKey = (groupId: string, timerId: string) =>
    `${groupId}:${timerId}`;

  // Debug: Log active timer changes
  useEffect(() => {
    if (hasHydrated.current) {
      console.log("Active Timer Changed:", activeTimerId);
      console.log("Active Event ID:", activeEventIdRef.current);
    }
  }, [activeTimerId]);

  // Persist time events to localStorage
  const persistTimeEvents = (events: TimeEvent[]) => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(TIME_EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      console.error("Failed to persist time events", error);
    }
  };

  const persistRunningSession = (session: RunningSession | null) => {
    runningSessionRef.current = session;

    if (typeof window === "undefined") {
      return;
    }

    try {
      if (session) {
        window.sessionStorage.setItem(
          RUNNING_SESSION_KEY,
          JSON.stringify(session)
        );
      } else {
        window.sessionStorage.removeItem(RUNNING_SESSION_KEY);
      }
    } catch (error) {
      console.error("Failed to persist running timer session", error);
    }
  };

  useEffect(() => {
    let nextGroups: TimerGroup[] = [createGroup(1)];
    let nextIsCompact = false;
    let loadedEvents: TimeEvent[] = [];

    // Load time events
    try {
      const storedEvents = window.localStorage.getItem(TIME_EVENTS_KEY);
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) {
          loadedEvents = filterTodayEvents(parsed); // Only keep today's events
        }
      }
    } catch (error) {
      console.error("Failed to load time events from storage", error);
    }

    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        const parsed = JSON.parse(storedValue) as Partial<{
          groups: unknown;
          isCompact: unknown;
        }>;

        if (Array.isArray(parsed.groups)) {
          const restoredGroups = parsed.groups
            .map((group, index) => normaliseGroup(group, index))
            .filter(Boolean);

          if (restoredGroups.length) {
            nextGroups = restoredGroups;
          }
        }

        if (typeof parsed.isCompact === "boolean") {
          nextIsCompact = parsed.isCompact;
        }
      }
    } catch (error) {
      console.error("Failed to load timers from storage", error);
    }

    // Recalculate elapsed times from events
    const now = Date.now();
    nextGroups = nextGroups.map((group) => ({
      ...group,
      timers: group.timers.map((timer) => ({
        ...timer,
        elapsed: calculateElapsedFromEvents(
          loadedEvents,
          group.id,
          timer.id,
          now
        ),
      })),
    }));

    let runningSession: RunningSession | null = null;
    let activeEventId: string | null = null;

    try {
      const storedSession = window.sessionStorage.getItem(RUNNING_SESSION_KEY);
      if (storedSession) {
        const parsedSession = JSON.parse(
          storedSession
        ) as Partial<RunningSession>;
        const {groupId, timerId, startedAt} = parsedSession;

        if (
          parsedSession &&
          typeof groupId === "string" &&
          typeof timerId === "string" &&
          typeof startedAt === "number" &&
          Number.isFinite(startedAt)
        ) {
          runningSession = {
            groupId,
            timerId,
            startedAt,
          };

          // Find or create the active event
          const existingEvent = loadedEvents.find(
            (e) =>
              e.groupId === groupId &&
              e.timerId === timerId &&
              e.endTime === null
          );

          if (existingEvent) {
            activeEventId = existingEvent.id;
          } else {
            // Create a new event for the running timer
            const group = nextGroups.find((g) => g.id === groupId);
            const timer = group?.timers.find((t) => t.id === timerId);

            if (group && timer) {
              const newEvent: TimeEvent = {
                id: createId(),
                groupId,
                timerId,
                startTime: startedAt,
                endTime: null,
                taskName: timer.taskName,
                projectName: group.projectName,
              };
              loadedEvents.push(newEvent);
              activeEventId = newEvent.id;
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load running timer session", error);
    }

    setGroups(nextGroups);
    setIsCompact(nextIsCompact);
    setTimeEvents(loadedEvents);

    if (runningSession && activeEventId) {
      const key = timerKey(runningSession.groupId, runningSession.timerId);
      setActiveTimerId(key);
      activeEventIdRef.current = activeEventId;
      persistRunningSession(runningSession);
    } else {
      persistRunningSession(null);
    }

    hasHydrated.current = true;
  }, []);

  // Persist groups and compact mode
  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    try {
      const payload = JSON.stringify({groups, isCompact});
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      console.error("Failed to persist timers", error);
    }
  }, [groups, isCompact]);

  // Persist time events whenever they change
  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }
    persistTimeEvents(timeEvents);
  }, [timeEvents]);

  // Recalculate elapsed times from events periodically when a timer is active
  useEffect(() => {
    if (!activeTimerId || !hasHydrated.current) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          timers: group.timers.map((timer) => ({
            ...timer,
            elapsed: calculateElapsedFromEvents(
              timeEvents,
              group.id,
              timer.id,
              now
            ),
          })),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerId, timeEvents]);

  const updateGroups = (updater: (groups: TimerGroup[]) => TimerGroup[]) => {
    setGroups((previous) => updater(previous));
  };

  const handleTimerStart = (groupId: string, timerId: string) => {
    const now = Date.now();
    const newTimerKey = timerKey(groupId, timerId);

    // Find the group and timer
    const group = groups.find((g) => g.id === groupId);
    const timer = group?.timers.find((t) => t.id === timerId);

    if (!group || !timer) {
      console.error("Timer or group not found");
      return;
    }

    // Stop any currently running timer and start new one atomically
    setTimeEvents((prev) => {
      let updatedEvents = prev;

      // End the current event if one is running
      if (activeEventIdRef.current) {
        updatedEvents = prev.map((event) =>
          event.id === activeEventIdRef.current
            ? {...event, endTime: now}
            : event
        );
      }

      // Create new event
      const newEvent: TimeEvent = {
        id: createId(),
        groupId,
        timerId,
        startTime: now,
        endTime: null,
        taskName: timer.taskName,
        projectName: group.projectName,
      };

      // Update the ref immediately
      activeEventIdRef.current = newEvent.id;

      return [...updatedEvents, newEvent];
    });

    // Set active timer
    setActiveTimerId(newTimerKey);

    // Persist session
    persistRunningSession({
      groupId,
      timerId,
      startedAt: now,
    });
  };

  const handleTimerStop = (groupId: string, timerId: string) => {
    const key = timerKey(groupId, timerId);

    if (activeTimerId !== key) {
      console.warn("Attempting to stop a timer that isn't active");
      return;
    }

    const now = Date.now();

    // End the current time event
    if (activeEventIdRef.current) {
      setTimeEvents((prev) =>
        prev.map((event) =>
          event.id === activeEventIdRef.current
            ? {...event, endTime: now}
            : event
        )
      );
      activeEventIdRef.current = null;
    }

    // Clear active timer
    setActiveTimerId(null);
    persistRunningSession(null);
  };

  const handleElapsedChange = (
    groupId: string,
    timerId: string,
    newElapsed: number
  ) => {
    updateGroups((previous) =>
      previous.map((group) =>
        group.id === groupId
          ? {
              ...group,
              timers: group.timers.map((timer) =>
                timer.id === timerId ? {...timer, elapsed: newElapsed} : timer
              ),
            }
          : group
      )
    );

    // Don't update the running session here - it should only be set when timer starts
    // The Timer component calculates elapsed time based on the startedAt timestamp
  };

  const handleTaskChange = (groupId: string, timerId: string, task: string) => {
    updateGroups((previous) =>
      previous.map((group) =>
        group.id === groupId
          ? {
              ...group,
              timers: group.timers.map((timer) =>
                timer.id === timerId ? {...timer, taskName: task} : timer
              ),
            }
          : group
      )
    );
  };

  const handleNotesChange = (
    groupId: string,
    timerId: string,
    value: string
  ) => {
    updateGroups((previous) =>
      previous.map((group) =>
        group.id === groupId
          ? {
              ...group,
              timers: group.timers.map((timer) =>
                timer.id === timerId ? {...timer, notes: value} : timer
              ),
            }
          : group
      )
    );
  };

  const addGroup = () => {
    updateGroups((previous) => [...previous, createGroup(previous.length + 1)]);
  };

  const removeGroup = (groupId: string) => {
    if (groups.length === 1) {
      return;
    }

    setGroups((previous) => previous.filter((group) => group.id !== groupId));

    if (activeTimerId?.startsWith(`${groupId}:`)) {
      setActiveTimerId(null);
      persistRunningSession(null);
    }
  };

  const addTimerToGroup = (groupId: string) => {
    updateGroups((previous) =>
      previous.map((group) =>
        group.id === groupId
          ? {...group, timers: [...group.timers, createTimer()]}
          : group
      )
    );
  };

  const removeTimerFromGroup = (groupId: string, timerId: string) => {
    updateGroups((previous) =>
      previous.map((group) =>
        group.id === groupId
          ? {
              ...group,
              timers:
                group.timers.length > 1
                  ? group.timers.filter((timer) => timer.id !== timerId)
                  : group.timers,
            }
          : group
      )
    );

    if (activeTimerId === timerKey(groupId, timerId)) {
      setActiveTimerId(null);
      persistRunningSession(null);
    }
  };

  const handleProjectNameChange = (groupId: string, name: string) => {
    updateGroups((previous) =>
      previous.map((group) =>
        group.id === groupId ? {...group, projectName: name} : group
      )
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDailyTime = groups.reduce((sum, group) => {
    const groupTotal = group.timers.reduce(
      (acc, timer) => acc + timer.elapsed,
      0
    );
    return sum + groupTotal;
  }, 0);

  const containerGap = isCompact ? "gap-4" : "gap-8";
  const totalSummary = isCompact ? (
    <div className="rounded-2xl bg-gray-900 p-4 text-center font-mono text-4xl font-light text-white shadow-sm dark:bg-dappit-black">
      {formatTime(totalDailyTime)}
    </div>
  ) : (
    <div className="rounded-2xl bg-gray-900 p-6 text-center text-white shadow-lg dark:bg-dappit-black">
      <h2 className="text-lg font-medium">Today&apos;s Total</h2>
      <div className="mt-3 font-mono text-5xl font-light">
        {formatTime(totalDailyTime)}
      </div>
      <p className="mt-2 text-sm text-gray-300 dark:text-dappit-gray">
        Across all timer groups
      </p>
    </div>
  );

  const gridClasses = isCompact
    ? "grid gap-4 md:grid-cols-3 xl:grid-cols-4"
    : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={`flex h-full w-full flex-col ${containerGap}`}>
      {totalSummary}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Timer Groups
          </h3>
          {!isCompact && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Organise by project, then track tasks inside each group.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCompact((prev) => !prev)}
            className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-teal-400 hover:text-teal-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-teal-400 dark:hover:text-teal-300 cursor-pointer"
          >
            {isCompact ? "Exit Compact" : "Compact Mode"}
          </button>
          <button
            onClick={addGroup}
            className="flex items-center gap-2 rounded-md bg-teal-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 cursor-pointer"
            style={{backgroundColor: "#01D9B5"}}
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
            Add Project Group
          </button>
        </div>
      </div>

      <div className={gridClasses}>
        {groups.map((group, index) => (
          <div
            key={group.id}
            className={`flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900/50 ${
              isCompact ? "gap-4 p-4" : "min-h-[320px] gap-5 p-6"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Project
                </label>
                <input
                  value={group.projectName}
                  onChange={(event) =>
                    handleProjectNameChange(group.id, event.target.value)
                  }
                  placeholder={`Project ${index + 1}`}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-300 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addTimerToGroup(group.id)}
                  className="rounded-md border border-teal-400 px-3 py-2 text-xs font-semibold text-teal-600 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10 cursor-pointer"
                >
                  Add Timer
                </button>
                {groups.length > 1 && (
                  <button
                    onClick={() => removeGroup(group.id)}
                    className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {group.timers.map((timer) => {
                const key = timerKey(group.id, timer.id);
                return (
                  <div key={timer.id} className="relative">
                    {group.timers.length > 1 && (
                      <button
                        onClick={() => removeTimerFromGroup(group.id, timer.id)}
                        className="absolute right-2 top-2 z-10 rounded-full bg-red-500/90 p-1 text-white shadow hover:bg-red-500 cursor-pointer"
                        title="Remove timer"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
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
                      taskName={timer.taskName}
                      notes={timer.notes}
                      isCompact={isCompact}
                      onElapsedChange={(id, newElapsed) =>
                        handleElapsedChange(group.id, id, newElapsed)
                      }
                      onTaskChange={(id, value) =>
                        handleTaskChange(group.id, id, value)
                      }
                      onNotesChange={(id, value) =>
                        handleNotesChange(group.id, id, value)
                      }
                      onStart={() => handleTimerStart(group.id, timer.id)}
                      onStop={() => handleTimerStop(group.id, timer.id)}
                      isActive={activeTimerId === key}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <h4 className="mb-1 font-medium">Tip</h4>
        <p>
          Start one timer at a time—switching to another project or task will
          pause the currently running timer automatically.
        </p>
      </div>
    </div>
  );
}
