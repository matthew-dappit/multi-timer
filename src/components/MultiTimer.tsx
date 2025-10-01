"use client";

import {useEffect, useRef, useState} from "react";
import Timer from "./Timer";
import TimeEntryModal from "./TimeEntryModal";
import TimeHistoryModal from "./TimeHistoryModal";
import EditTimeSlotModal from "./EditTimeSlotModal";

// Time tracking event - immutable record of a timer session
interface TimeEvent {
  id: string;
  groupId: string;
  timerId: string;
  projectName: string;
  taskName: string;
  notes: string;
  startTime: number; // Unix timestamp in ms
  endTime: number | null; // null if currently running
}

// Running session - tracks currently active timer
interface RunningSession {
  timerId: string;
  groupId: string;
  eventId: string;
  startTime: number;
}

interface TimerData {
  id: string;
  taskName: string;
  notes: string;
  elapsed: number; // Total elapsed seconds (calculated from events)
}

interface TimerGroup {
  id: string;
  projectName: string;
  timers: TimerData[];
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
const TIME_EVENTS_KEY = "multi-timer/time-events";
const RUNNING_SESSION_KEY = "multi-timer/running";

const normaliseTimer = (candidate: unknown): TimerData => {
  if (!candidate || typeof candidate !== "object") {
    return createTimer();
  }

  const value = candidate as Partial<TimerData>;

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : createId(),
    taskName: typeof value.taskName === "string" ? value.taskName : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    elapsed: 0, // Will be recalculated from events
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
  const [isCompact, setIsCompact] = useState(false);
  const [timeEvents, setTimeEvents] = useState<TimeEvent[]>([]);
  const [runningSession, setRunningSession] = useState<RunningSession | null>(
    null
  );
  const hasHydrated = useRef(false);

  // Modal state
  const [timeEntryModal, setTimeEntryModal] = useState<{
    isOpen: boolean;
    groupId: string;
    timerId: string;
  } | null>(null);
  const [timeHistoryModal, setTimeHistoryModal] = useState<{
    isOpen: boolean;
    groupId: string;
    timerId: string;
  } | null>(null);
  const [editTimeSlotModal, setEditTimeSlotModal] = useState<{
    isOpen: boolean;
    eventId: string;
  } | null>(null);

  // Helper: Calculate elapsed time from events
  const calculateElapsedFromEvents = (
    timerId: string,
    events: TimeEvent[],
    session: RunningSession | null
  ): number => {
    // Sum all completed events for this timer
    const completedTime = events
      .filter((e) => e.timerId === timerId && e.endTime !== null)
      .reduce((sum, e) => sum + (e.endTime! - e.startTime), 0);

    // Add current running time if this timer is active
    let runningTime = 0;
    if (session?.timerId === timerId) {
      runningTime = Date.now() - session.startTime;
    }

    // Convert ms to seconds
    return Math.floor((completedTime + runningTime) / 1000);
  };

  // Helper: Filter events for today only
  const filterTodayEvents = (events: TimeEvent[]): TimeEvent[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    return events.filter(
      (event) => event.startTime >= todayStart && event.startTime < todayEnd
    );
  };

  // Load state from localStorage on mount (hydration)
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    let nextGroups: TimerGroup[] = [createGroup(1)];
    let nextIsCompact = false;
    let nextTimeEvents: TimeEvent[] = [];
    let nextRunningSession: RunningSession | null = null;

    try {
      // Load groups and compact mode
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

      // Load time events
      const storedEvents = window.localStorage.getItem(TIME_EVENTS_KEY);
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) {
          // Filter to today's events only
          nextTimeEvents = filterTodayEvents(parsed);
        }
      }

      // Load running session
      const storedSession = window.sessionStorage.getItem(RUNNING_SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession) as RunningSession;
        // Validate: does this timer still exist in our groups?
        const timerExists = nextGroups.some((group) =>
          group.timers.some((timer) => timer.id === parsed.timerId)
        );
        if (timerExists) {
          nextRunningSession = parsed;
        } else {
          // Timer was deleted, close the event
          const eventToClose = nextTimeEvents.find(
            (e) => e.id === parsed.eventId && e.endTime === null
          );
          if (eventToClose) {
            eventToClose.endTime = Date.now();
          }
          window.sessionStorage.removeItem(RUNNING_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load timers from storage", error);
    }

    // Calculate elapsed times for all timers
    nextGroups = nextGroups.map((group) => ({
      ...group,
      timers: group.timers.map((timer) => ({
        ...timer,
        elapsed: calculateElapsedFromEvents(
          timer.id,
          nextTimeEvents,
          nextRunningSession
        ),
      })),
    }));

    setGroups(nextGroups);
    setIsCompact(nextIsCompact);
    setTimeEvents(nextTimeEvents);
    setRunningSession(nextRunningSession);
  }, []);

  // Persist groups and compact mode to localStorage
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      const payload = JSON.stringify({groups, isCompact});
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      console.error("Failed to persist timers", error);
    }
  }, [groups, isCompact]);

  // Persist time events to localStorage
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      const payload = JSON.stringify(timeEvents);
      window.localStorage.setItem(TIME_EVENTS_KEY, payload);
    } catch (error) {
      console.error("Failed to persist time events", error);
    }
  }, [timeEvents]);

  // Persist running session to sessionStorage
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      if (runningSession) {
        const payload = JSON.stringify(runningSession);
        window.sessionStorage.setItem(RUNNING_SESSION_KEY, payload);
      } else {
        window.sessionStorage.removeItem(RUNNING_SESSION_KEY);
      }
    } catch (error) {
      console.error("Failed to persist running session", error);
    }
  }, [runningSession]);

  // Real-time update: recalculate elapsed time every second
  useEffect(() => {
    if (!runningSession) return;

    const interval = setInterval(() => {
      setGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          timers: group.timers.map((timer) => ({
            ...timer,
            elapsed: calculateElapsedFromEvents(
              timer.id,
              timeEvents,
              runningSession
            ),
          })),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [runningSession, timeEvents]);

  const updateGroups = (updater: (groups: TimerGroup[]) => TimerGroup[]) => {
    setGroups((previous) => updater(previous));
  };

  // Start a timer
  const handleTimerStart = (groupId: string, timerId: string) => {
    // Stop any currently running timer
    if (runningSession) {
      handleTimerStop();
    }

    // Find the timer and group
    const group = groups.find((g) => g.id === groupId);
    const timer = group?.timers.find((t) => t.id === timerId);
    if (!group || !timer) return;

    // Create new time event
    const newEvent: TimeEvent = {
      id: createId(),
      groupId,
      timerId,
      projectName: group.projectName,
      taskName: timer.taskName,
      notes: timer.notes,
      startTime: Date.now(),
      endTime: null,
    };

    // Create running session
    const newSession: RunningSession = {
      timerId,
      groupId,
      eventId: newEvent.id,
      startTime: Date.now(),
    };

    // Update state
    setTimeEvents((prev) => [...prev, newEvent]);
    setRunningSession(newSession);
  };

  // Stop the currently running timer
  const handleTimerStop = () => {
    if (!runningSession) return;

    const now = Date.now();

    // Find and close the active event
    setTimeEvents((prev) =>
      prev.map((event) =>
        event.id === runningSession.eventId ? {...event, endTime: now} : event
      )
    );

    // Update elapsed time for the stopped timer
    setGroups((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        timers: group.timers.map((timer) =>
          timer.id === runningSession.timerId
            ? {
                ...timer,
                elapsed: calculateElapsedFromEvents(
                  timer.id,
                  timeEvents.map((e) =>
                    e.id === runningSession.eventId ? {...e, endTime: now} : e
                  ),
                  null
                ),
              }
            : timer
        ),
      }))
    );

    // Clear running session
    setRunningSession(null);
  };

  // Manual time entry handlers
  const handleOpenTimeEntry = (groupId: string, timerId: string) => {
    setTimeEntryModal({isOpen: true, groupId, timerId});
  };

  const handleAddManualTime = (
    groupId: string,
    timerId: string,
    startTime: number,
    endTime: number
  ) => {
    // Find the timer and group
    const group = groups.find((g) => g.id === groupId);
    const timer = group?.timers.find((t) => t.id === timerId);
    if (!group || !timer) return;

    // Create new time event
    const newEvent: TimeEvent = {
      id: createId(),
      groupId,
      timerId,
      projectName: group.projectName,
      taskName: timer.taskName,
      notes: timer.notes,
      startTime,
      endTime,
    };

    // Add to time events
    const updatedEvents = [...timeEvents, newEvent];
    setTimeEvents(updatedEvents);

    // Recalculate elapsed time for this timer
    setGroups((prevGroups) =>
      prevGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              timers: g.timers.map((t) =>
                t.id === timerId
                  ? {
                      ...t,
                      elapsed: calculateElapsedFromEvents(
                        timerId,
                        updatedEvents,
                        runningSession
                      ),
                    }
                  : t
              ),
            }
          : g
      )
    );
  };

  const handleOpenTimeHistory = (groupId: string, timerId: string) => {
    setTimeHistoryModal({isOpen: true, groupId, timerId});
  };

  const handleEditTimeSlot = (eventId: string) => {
    setEditTimeSlotModal({isOpen: true, eventId});
    setTimeHistoryModal(null); // Close history modal
  };

  const handleSaveTimeSlot = (
    eventId: string,
    startTime: number,
    endTime: number
  ) => {
    // Update the event
    const updatedEvents = timeEvents.map((event) =>
      event.id === eventId ? {...event, startTime, endTime} : event
    );
    setTimeEvents(updatedEvents);

    // Recalculate elapsed times for affected timer
    const event = timeEvents.find((e) => e.id === eventId);
    if (event) {
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === event.groupId
            ? {
                ...group,
                timers: group.timers.map((timer) =>
                  timer.id === event.timerId
                    ? {
                        ...timer,
                        elapsed: calculateElapsedFromEvents(
                          timer.id,
                          updatedEvents,
                          runningSession
                        ),
                      }
                    : timer
                ),
              }
            : group
        )
      );
    }
  };

  const handleDeleteTimeSlot = (eventId: string) => {
    // Find the event to get timer info
    const event = timeEvents.find((e) => e.id === eventId);
    if (!event) return;

    // Remove the event
    const updatedEvents = timeEvents.filter((e) => e.id !== eventId);
    setTimeEvents(updatedEvents);

    // Recalculate elapsed time for affected timer
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === event.groupId
          ? {
              ...group,
              timers: group.timers.map((timer) =>
                timer.id === event.timerId
                  ? {
                      ...timer,
                      elapsed: calculateElapsedFromEvents(
                        timer.id,
                        updatedEvents,
                        runningSession
                      ),
                    }
                  : timer
              ),
            }
          : group
      )
    );
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

    // Stop timer if any timer in this group is running
    if (runningSession?.groupId === groupId) {
      handleTimerStop();
    }

    setGroups((previous) => previous.filter((group) => group.id !== groupId));
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
    // Stop timer if it's running
    if (runningSession?.timerId === timerId) {
      handleTimerStop();
    }

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

  // Calculate total daily time from all timers
  const totalDailyTime = groups.reduce((total, group) => {
    return (
      total +
      group.timers.reduce((groupTotal, timer) => groupTotal + timer.elapsed, 0)
    );
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
                      taskName={timer.taskName}
                      notes={timer.notes}
                      elapsed={timer.elapsed}
                      isCompact={isCompact}
                      isActive={runningSession?.timerId === timer.id}
                      onTaskChange={(id, value) =>
                        handleTaskChange(group.id, id, value)
                      }
                      onNotesChange={(id, value) =>
                        handleNotesChange(group.id, id, value)
                      }
                      onStart={() => handleTimerStart(group.id, timer.id)}
                      onStop={handleTimerStop}
                      onOpenTimeEntry={() =>
                        handleOpenTimeEntry(group.id, timer.id)
                      }
                      onOpenTimeHistory={() =>
                        handleOpenTimeHistory(group.id, timer.id)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {timeEntryModal &&
        (() => {
          const group = groups.find((g) => g.id === timeEntryModal.groupId);
          const timer = group?.timers.find(
            (t) => t.id === timeEntryModal.timerId
          );
          if (!group || !timer) return null;

          return (
            <TimeEntryModal
              isOpen={timeEntryModal.isOpen}
              onClose={() => setTimeEntryModal(null)}
              onAddTime={(startTime, endTime) => {
                handleAddManualTime(
                  timeEntryModal.groupId,
                  timeEntryModal.timerId,
                  startTime,
                  endTime
                );
                setTimeEntryModal(null);
              }}
              projectName={group.projectName}
              taskName={timer.taskName}
              notes={timer.notes}
              isTimerActive={runningSession?.timerId === timer.id}
            />
          );
        })()}

      {timeHistoryModal &&
        (() => {
          const group = groups.find((g) => g.id === timeHistoryModal.groupId);
          const timer = group?.timers.find(
            (t) => t.id === timeHistoryModal.timerId
          );
          if (!group || !timer) return null;

          const timerEvents = timeEvents.filter(
            (e) => e.timerId === timeHistoryModal.timerId
          );
          const runningEventId =
            runningSession?.timerId === timer.id
              ? runningSession.eventId
              : null;

          return (
            <TimeHistoryModal
              isOpen={timeHistoryModal.isOpen}
              onClose={() => setTimeHistoryModal(null)}
              onAddTime={() => {
                setTimeHistoryModal(null);
                setTimeEntryModal({
                  isOpen: true,
                  groupId: timeHistoryModal.groupId,
                  timerId: timeHistoryModal.timerId,
                });
              }}
              onEditEvent={handleEditTimeSlot}
              onStopTimer={handleTimerStop}
              projectName={group.projectName}
              taskName={timer.taskName}
              notes={timer.notes}
              events={timerEvents}
              runningEventId={runningEventId}
            />
          );
        })()}

      {editTimeSlotModal &&
        (() => {
          const event = timeEvents.find(
            (e) => e.id === editTimeSlotModal.eventId
          );
          if (!event) return null;

          return (
            <EditTimeSlotModal
              isOpen={editTimeSlotModal.isOpen}
              onClose={() => setEditTimeSlotModal(null)}
              onSave={(eventId, startTime, endTime) => {
                handleSaveTimeSlot(eventId, startTime, endTime);
                setEditTimeSlotModal(null);
              }}
              onDelete={(eventId) => {
                handleDeleteTimeSlot(eventId);
                setEditTimeSlotModal(null);
              }}
              event={event}
            />
          );
        })()}
    </div>
  );
}
