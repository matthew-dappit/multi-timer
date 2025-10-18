"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {authClient} from "@/lib/auth";
import {
  createZohoTimer,
  createZohoTimerInterval,
  deleteZohoTimerInterval,
  formatDateForXano,
  resumeZohoTimer,
  startZohoTimer,
  stopZohoTimer,
  XanoTimerError,
  type CreateTimerPayload,
  type CreateIntervalPayload,
  type StartTimerPayload,
} from "@/lib/xano-timers";
import Timer from "./Timer";
import TimeEntryModal from "./TimeEntryModal";
import TimeHistoryModal from "./TimeHistoryModal";
import EditTimeSlotModal from "./EditTimeSlotModal";

const WEBAPP_API_BASE_URL =
  process.env.NEXT_PUBLIC_WEBAPP_API_BASE_URL ?? "https://api.dappit.org/api:THWVRjoL";

interface ZohoProject {
  id: string;
  name: string;
}

interface ZohoTask {
  id: string;
  projectId: string;
  name: string;
}

interface ProjectPickerProps {
  selectedProject: ZohoProject | undefined;
  fallbackProjectName: string | null;
  availableProjects: ZohoProject[];
  totalProjectCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelect: (projectId: string | null) => void;
  isLoading: boolean;
  disabled: boolean;
}

const ProjectPicker = ({
  selectedProject,
  fallbackProjectName,
  availableProjects,
  totalProjectCount,
  searchTerm,
  onSearchChange,
  onSelect,
  isLoading,
  disabled,
}: ProjectPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalisedSearch = searchTerm.trim().toLowerCase();
  const optionList = useMemo(() => {
    const map = new Map<string, ZohoProject>();
    if (selectedProject) {
      map.set(selectedProject.id, selectedProject);
    }
    for (const project of availableProjects) {
      map.set(project.id, project);
    }
    return Array.from(map.values());
  }, [availableProjects, selectedProject]);

  const filteredOptions = useMemo(() => {
    if (!normalisedSearch) {
      return optionList;
    }
    return optionList.filter((project) =>
      project.name.toLowerCase().includes(normalisedSearch)
    );
  }, [normalisedSearch, optionList]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  const buttonLabel = (() => {
    if (selectedProject) {
      return selectedProject.name;
    }
    if (fallbackProjectName) {
      return `Previous: ${fallbackProjectName}`;
    }
    if (isLoading) {
      return "Loading projects...";
    }
    if (totalProjectCount === 0) {
      return "No projects available";
    }
    return "Select project";
  })();

  const emptyStateMessage = (() => {
    if (isLoading) {
      return "Loading projects...";
    }
    if (totalProjectCount === 0) {
      return "No projects available";
    }
    if (optionList.length === 0) {
      return "All projects are already assigned";
    }
    if (normalisedSearch) {
      return "No matching projects";
    }
    return "No projects available";
  })();

  const handleToggle = () => {
    if (disabled) {
      return;
    }
    setIsOpen((previous) => !previous);
  };

  const handleSelect = (projectId: string | null) => {
    onSelect(projectId);
    setIsOpen(false);
  };

  const showClearSelection = !!selectedProject || !!fallbackProjectName;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-left text-sm font-medium text-gray-900 outline-none transition hover:border-teal-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-100 dark:hover:border-teal-400"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{buttonLabel}</span>
        <svg
          className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-2 dark:border-gray-800">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm text-gray-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                />
              </svg>
            </div>
          </div>

          {fallbackProjectName && !selectedProject && (
            <div className="border-b border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Previously selected: {fallbackProjectName}
            </div>
          )}

          {showClearSelection && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-teal-600 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
              onClick={() => handleSelect(null)}
            >
              Clear selection
            </button>
          )}

          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {emptyStateMessage}
              </div>
            ) : (
              filteredOptions.map((project) => {
                const isSelected = selectedProject?.id === project.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleSelect(project.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "bg-teal-50 font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-200"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="truncate">{project.name}</span>
                    {isSelected && (
                      <svg
                        className="h-4 w-4 text-teal-500 dark:text-teal-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  backendIntervalId: number | null; // Xano zoho_timer_intervals.id
  activeDate: string; // YYYY-MM-DD format
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
  taskId: string | null;
  taskName: string;
  notes: string;
  elapsed: number; // Total elapsed seconds (calculated from events)
  backendTimerId: number | null; // Xano zoho_timers.id
  lastActiveDate: string | null; // YYYY-MM-DD format
}

interface TimerGroup {
  id: string;
  projectId: string | null;
  projectName: string;
  timers: TimerData[];
}

const createId = () => Math.random().toString(36).slice(2, 12);

const createTimer = (): TimerData => ({
  id: createId(),
  taskId: null,
  taskName: "",
  notes: "",
  elapsed: 0,
  backendTimerId: null,
  lastActiveDate: null,
});

const createGroup = (index: number): TimerGroup => ({
  id: createId(),
  projectId: null,
  projectName: `Project ${index}`,
  timers: [createTimer()],
});

const STORAGE_KEY = "multi-timer/state";
const RUNNING_SESSION_KEY = "multi-timer/running";

const normaliseTimer = (candidate: unknown): TimerData => {
  if (!candidate || typeof candidate !== "object") {
    return createTimer();
  }

  const value = candidate as Partial<TimerData> & Record<string, unknown>;

  const rawTaskId = value.taskId as unknown;
  let taskId: string | null = null;
  if (typeof rawTaskId === "string" && rawTaskId.trim()) {
    taskId = rawTaskId;
  } else if (typeof rawTaskId === "number") {
    taskId = rawTaskId.toString();
  }

  const rawBackendTimerId = value.backendTimerId as unknown;
  let backendTimerId: number | null = null;
  if (typeof rawBackendTimerId === "number") {
    backendTimerId = rawBackendTimerId;
  }

  const rawLastActiveDate = value.lastActiveDate as unknown;
  let lastActiveDate: string | null = null;
  if (typeof rawLastActiveDate === "string" && rawLastActiveDate.trim()) {
    lastActiveDate = rawLastActiveDate;
  }

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : createId(),
    taskId,
    taskName: typeof value.taskName === "string" ? value.taskName : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    elapsed: 0, // Will be recalculated from events
    backendTimerId,
    lastActiveDate,
  };
};

const normaliseGroup = (candidate: unknown, index: number): TimerGroup => {
  if (!candidate || typeof candidate !== "object") {
    return createGroup(index + 1);
  }

  const value = candidate as Partial<TimerGroup> & Record<string, unknown>;
  const timersSource = Array.isArray(value.timers) ? value.timers : [];
  const timers = timersSource
    .map((timer) => normaliseTimer(timer))
    .filter(Boolean);

  const rawProjectId = value.projectId as unknown;
  let projectId: string | null = null;
  if (typeof rawProjectId === "string" && rawProjectId.trim()) {
    projectId = rawProjectId;
  } else if (typeof rawProjectId === "number") {
    projectId = rawProjectId.toString();
  }

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : createId(),
    projectId,
    projectName:
      typeof value.projectName === "string" && value.projectName.trim()
        ? value.projectName
        : `Project ${index + 1}`,
    timers: timers.length ? timers : [createTimer()],
  };
};

const normaliseProjects = (payload: unknown): ZohoProject[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const projectIdRaw =
        record.zoho_project_id ?? record.project_id ?? record.id;
      const projectNameRaw = record.project_name ?? record.name;

      let projectId: string | null = null;
      if (typeof projectIdRaw === "string" && projectIdRaw.trim()) {
        projectId = projectIdRaw;
      } else if (typeof projectIdRaw === "number") {
        projectId = projectIdRaw.toString();
      }

      const projectName =
        typeof projectNameRaw === "string" && projectNameRaw.trim()
          ? projectNameRaw.trim()
          : null;

      if (!projectId || !projectName) {
        return null;
      }

      return {id: projectId, name: projectName};
    })
    .filter((project): project is ZohoProject => project !== null);
};

const normaliseTasks = (payload: unknown): ZohoTask[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const taskIdRaw = record.zoho_task_id ?? record.id;
      const projectIdRaw = record.zoho_project_id;
      const taskNameRaw = record.task_name ?? record.name;

      let taskId: string | null = null;
      if (typeof taskIdRaw === "string" && taskIdRaw.trim()) {
        taskId = taskIdRaw;
      } else if (typeof taskIdRaw === "number") {
        taskId = taskIdRaw.toString();
      }

      let projectId: string | null = null;
      if (typeof projectIdRaw === "string" && projectIdRaw.trim()) {
        projectId = projectIdRaw;
      } else if (typeof projectIdRaw === "number") {
        projectId = projectIdRaw.toString();
      }

      const taskName =
        typeof taskNameRaw === "string" && taskNameRaw.trim()
          ? taskNameRaw.trim()
          : null;

      if (!taskId || !projectId || !taskName) {
        return null;
      }

      return {
        id: taskId,
        projectId,
        name: taskName,
      };
    })
    .filter((task): task is ZohoTask => task !== null);
};

export default function MultiTimer() {
  const [groups, setGroups] = useState<TimerGroup[]>([createGroup(1)]);
  const [isCompact, setIsCompact] = useState(false);
  const [timeEvents, setTimeEvents] = useState<TimeEvent[]>([]);
  const [runningSession, setRunningSession] = useState<RunningSession | null>(
    null
  );
  const [projects, setProjects] = useState<ZohoProject[]>([]);
  const [tasks, setTasks] = useState<ZohoTask[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [projectSearchTerms, setProjectSearchTerms] = useState<
    Record<string, string>
  >({});
  const [isSubmittingTime, setIsSubmittingTime] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [timerSyncError, setTimerSyncError] = useState<string | null>(null);
  const [isTimerSyncing, setIsTimerSyncing] = useState(false);
  const hasHydrated = useRef(false);

  const tasksByProject = useMemo(() => {
    const map = new Map<string, ZohoTask[]>();
    for (const task of tasks) {
      const key = task.projectId;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const selectedProjectIds = useMemo(() => {
    const ids = groups
      .map((group) =>
        typeof group.projectId === "string" && group.projectId.trim()
          ? group.projectId
          : null
      )
      .filter((value): value is string => value !== null);
    return new Set(ids);
  }, [groups]);

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

  // Load state from localStorage on mount (hydration)
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    let nextGroups: TimerGroup[] = [createGroup(1)];
    let nextIsCompact = false;
    const nextTimeEvents: TimeEvent[] = [];
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

      // Load running session
      const storedSession = window.sessionStorage.getItem(RUNNING_SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession) as RunningSession;
        const owningGroup = nextGroups.find((group) =>
          group.timers.some((timer) => timer.id === parsed.timerId)
        );

        if (owningGroup) {
          const owningTimer = owningGroup.timers.find(
            (timer) => timer.id === parsed.timerId
          );

          if (owningTimer) {
            nextRunningSession = parsed;
            nextTimeEvents.push({
              id: parsed.eventId,
              groupId: owningGroup.id,
              timerId: owningTimer.id,
              projectName: owningGroup.projectName,
              taskName: owningTimer.taskName,
              notes: owningTimer.notes,
              startTime: parsed.startTime,
              endTime: null,
              backendIntervalId: owningTimer.backendTimerId ?? null,
              activeDate:
                owningTimer.lastActiveDate ??
                formatDateForXano(new Date(parsed.startTime)),
            });
          } else {
            window.sessionStorage.removeItem(RUNNING_SESSION_KEY);
          }
        } else {
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

  useEffect(() => {
    let isCancelled = false;
    const token = authClient.getToken();

    if (!token) {
      return () => {
        isCancelled = true;
      };
    }

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await fetch(`${WEBAPP_API_BASE_URL}/zoho_projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Projects request failed (${response.status})`);
        }

        const payload = await response.json();
        if (isCancelled) return;

        setProjects(normaliseProjects(payload));
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load projects", error);
          setProjects([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProjects(false);
        }
      }
    };

    const loadTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const response = await fetch(`${WEBAPP_API_BASE_URL}/zoho_tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Tasks request failed (${response.status})`);
        }

        const payload = await response.json();
        if (isCancelled) return;

        setTasks(normaliseTasks(payload));
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load tasks", error);
          setTasks([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTasks(false);
        }
      }
    };

    loadProjects();
    loadTasks();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projects.length) return;

    setGroups((previous) => {
      let hasChanges = false;

      const nextGroups = previous.map((group) => {
        if (!group.projectId) {
          return group;
        }

        const matchedProject = projects.find(
          (project) => project.id === group.projectId
        );

        if (!matchedProject || group.projectName === matchedProject.name) {
          return group;
        }

        hasChanges = true;
        return {...group, projectName: matchedProject.name};
      });

      return hasChanges ? nextGroups : previous;
    });
  }, [projects]);

  useEffect(() => {
    if (!tasks.length) return;

    setGroups((previous) => {
      let hasChanges = false;

      const nextGroups = previous.map((group) => {
        let groupChanged = false;

        const nextTimers = group.timers.map((timer) => {
          if (!timer.taskId) {
            return timer;
          }

          const matchedTask = tasks.find((task) => task.id === timer.taskId);
          if (!matchedTask || timer.taskName === matchedTask.name) {
            return timer;
          }

          groupChanged = true;
          hasChanges = true;
          return {...timer, taskName: matchedTask.name};
        });

        if (!groupChanged) {
          return group;
        }

        return {...group, timers: nextTimers};
      });

      return hasChanges ? nextGroups : previous;
    });
  }, [tasks]);

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

  const stopRunningTimer = async (
    stopTime = Date.now()
  ): Promise<TimeEvent[]> => {
    const session = runningSession;
    if (!session) {
      return timeEvents;
    }

    const group = groups.find((g) => g.id === session.groupId);
    const timer = group?.timers.find((t) => t.id === session.timerId);
    const authToken = authClient.getToken();

    const previousEvents = timeEvents;
    const previousGroups = groups;
    const previousSession = runningSession;

    let updatedEvents: TimeEvent[] = previousEvents;

    setTimeEvents((prevEvents) => {
      const existingIndex = prevEvents.findIndex(
        (event) => event.id === session.eventId
      );

      if (existingIndex === -1) {
        if (!group || !timer) {
          updatedEvents = prevEvents;
          return prevEvents;
        }

        const inferredActiveDate =
          timer.lastActiveDate ?? formatDateForXano(new Date(session.startTime));

        const fallbackEvent: TimeEvent = {
          id: session.eventId,
          groupId: group.id,
          timerId: timer.id,
          projectName: group.projectName,
          taskName: timer.taskName,
          notes: timer.notes,
          startTime: session.startTime,
          endTime: stopTime,
          backendIntervalId: null,
          activeDate: inferredActiveDate,
        };

        updatedEvents = [...prevEvents, fallbackEvent];
        return updatedEvents;
      }

      updatedEvents = prevEvents.map((event, index) =>
        index === existingIndex ? {...event, endTime: stopTime} : event
      );
      return updatedEvents;
    });

    setRunningSession(null);

    setGroups((prevGroups) =>
      prevGroups.map((groupItem) => {
        if (groupItem.id !== session.groupId) {
          return groupItem;
        }

        return {
          ...groupItem,
          timers: groupItem.timers.map((timerItem) =>
            timerItem.id === session.timerId
              ? {
                  ...timerItem,
                  elapsed: calculateElapsedFromEvents(
                    timerItem.id,
                    updatedEvents,
                    null
                  ),
                }
              : timerItem
          ),
        };
      })
    );

    if (!timer?.backendTimerId || !authToken) {
      return updatedEvents;
    }

    try {
      const backendTimer = await stopZohoTimer(
        {
          timer_id: timer.backendTimerId,
          end_time: stopTime,
        },
        authToken
      );

      setGroups((prevGroups) =>
        prevGroups.map((groupItem) => {
          if (groupItem.id !== session.groupId) {
            return groupItem;
          }

          return {
            ...groupItem,
            timers: groupItem.timers.map((timerItem) =>
              timerItem.id === session.timerId
                ? {
                    ...timerItem,
                    backendTimerId: backendTimer.id,
                    lastActiveDate:
                      backendTimer.active_date ?? timerItem.lastActiveDate,
                    elapsed:
                      typeof backendTimer.total_duration === "number"
                        ? backendTimer.total_duration
                        : calculateElapsedFromEvents(
                            timerItem.id,
                            updatedEvents,
                            null
                          ),
                  }
                : timerItem
            ),
          };
        })
      );

      setTimeEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === session.eventId
            ? {
                ...event,
                activeDate:
                  backendTimer.active_date ?? event.activeDate,
              }
            : event
        )
      );
    } catch (error) {
      console.error("Failed to stop backend timer", error);
      setTimeEvents(previousEvents);
      setRunningSession(previousSession);
      setGroups(previousGroups);

      if (error instanceof XanoTimerError) {
        throw error;
      }

      throw new XanoTimerError("Failed to stop timer. Please try again.");
    }

    return updatedEvents;
  };

  // Start a timer
  const handleTimerStart = async (groupId: string, timerId: string) => {
    if (isTimerSyncing) return;

    const group = groups.find((g) => g.id === groupId);
    const timer = group?.timers.find((t) => t.id === timerId);
    if (!group || !timer) return;

    const authToken = authClient.getToken();
    const user = authClient.getUser();

    if (!authToken || !user) {
      setTimerSyncError("Please log in to start timers.");
      return;
    }

    setIsTimerSyncing(true);
    setTimerSyncError(null);

    let hasOptimisticStart = false;
    const startTimestamp = Date.now();
    const optimisticActiveDate = formatDateForXano(new Date(startTimestamp));
    const previousBackendTimerId = timer.backendTimerId ?? null;
    const previousLastActiveDate = timer.lastActiveDate ?? null;
    const newEventId = createId();

    try {
      if (runningSession) {
        await stopRunningTimer(startTimestamp);
      }

      const newEvent: TimeEvent = {
        id: newEventId,
        groupId,
        timerId,
        projectName: group.projectName,
        taskName: timer.taskName,
        notes: timer.notes,
        startTime: startTimestamp,
        endTime: null,
        backendIntervalId: null,
        activeDate: optimisticActiveDate,
      };

      const newSession: RunningSession = {
        timerId,
        groupId,
        eventId: newEvent.id,
        startTime: startTimestamp,
      };

      setRunningSession(newSession);

      setTimeEvents((prevEvents) => {
        const nextEvents = [...prevEvents, newEvent];

        setGroups((prevGroups) =>
          prevGroups.map((groupItem) =>
            groupItem.id === groupId
              ? {
                  ...groupItem,
                  timers: groupItem.timers.map((timerItem) =>
                    timerItem.id === timerId
                      ? {
                          ...timerItem,
                          elapsed: calculateElapsedFromEvents(
                            timerItem.id,
                            nextEvents,
                            newSession
                          ),
                        }
                      : timerItem
                  ),
                }
              : groupItem
          )
        );

        return nextEvents;
      });

      hasOptimisticStart = true;

      let backendTimerId = timer.backendTimerId;
      let backendTimer: Awaited<ReturnType<typeof startZohoTimer>>;

      if (!backendTimerId || timer.lastActiveDate !== optimisticActiveDate) {
        const startPayload: StartTimerPayload = {
          user_id: user.id,
          zoho_project_id: group.projectId ?? "",
          zoho_task_id: timer.taskId ?? "",
          notes: timer.notes,
          start_time: startTimestamp,
        };
        backendTimer = await startZohoTimer(startPayload, authToken);
        backendTimerId = backendTimer.id;
      } else {
        backendTimer = await resumeZohoTimer(
          {
            timer_id: backendTimerId,
            resume_time: startTimestamp,
          },
          authToken
        );
      }

      const resolvedTimerId = backendTimerId ?? backendTimer.id;
      const resolvedActiveDate = backendTimer.active_date ?? optimisticActiveDate;
      const backendElapsed =
        typeof backendTimer.total_duration === "number"
          ? backendTimer.total_duration
          : null;

      setTimeEvents((prevEvents) => {
        const nextEvents = prevEvents.map((event) =>
          event.id === newEvent.id
            ? {...event, activeDate: resolvedActiveDate}
            : event
        );

        setGroups((prevGroups) =>
          prevGroups.map((groupItem) =>
            groupItem.id === groupId
              ? {
                  ...groupItem,
                  timers: groupItem.timers.map((timerItem) =>
                    timerItem.id === timerId
                      ? {
                          ...timerItem,
                          backendTimerId: resolvedTimerId,
                          lastActiveDate: resolvedActiveDate,
                          elapsed:
                            backendElapsed !== null
                              ? backendElapsed
                              : calculateElapsedFromEvents(
                                  timerItem.id,
                                  nextEvents,
                                  newSession
                                ),
                        }
                      : timerItem
                  ),
                }
              : groupItem
          )
        );

        return nextEvents;
      });
    } catch (error) {
      if (hasOptimisticStart) {
        setTimeEvents((events) => {
          const revertedEvents = events.filter((event) => event.id !== newEventId);

          setGroups((groupList) =>
            groupList.map((groupItem) =>
              groupItem.id === groupId
                ? {
                    ...groupItem,
                    timers: groupItem.timers.map((timerItem) =>
                      timerItem.id === timerId
                        ? {
                            ...timerItem,
                            backendTimerId: previousBackendTimerId,
                            lastActiveDate: previousLastActiveDate,
                            elapsed: calculateElapsedFromEvents(
                              timerItem.id,
                              revertedEvents,
                              null
                            ),
                          }
                        : timerItem
                    ),
                  }
                : groupItem
            )
          );

          return revertedEvents;
        });
        setRunningSession(null);
      }

      if (error instanceof XanoTimerError) {
        setTimerSyncError(error.message);
      } else {
        console.error("Failed to start timer", error);
        setTimerSyncError("Failed to start timer. Please try again.");
      }
      setIsTimerSyncing(false);
      return;
    }

    setIsTimerSyncing(false);
  };

  // Stop the currently running timer
  const handleTimerStop = async () => {
    if (!runningSession || isTimerSyncing) return;

    setIsTimerSyncing(true);
    setTimerSyncError(null);

    try {
      await stopRunningTimer();
    } catch (error) {
      console.error("Failed to stop timer", error);
      if (error instanceof XanoTimerError) {
        setTimerSyncError(error.message);
      } else {
        setTimerSyncError("Failed to stop timer. Please try again.");
      }
    } finally {
      setIsTimerSyncing(false);
    }
  };

  // Manual time entry handlers
  const handleOpenTimeEntry = (groupId: string, timerId: string) => {
    setTimeEntryModal({isOpen: true, groupId, timerId});
  };

  const handleAddManualTime = async (
    groupId: string,
    timerId: string,
    startTime: number,
    endTime: number,
    selectedDate: string
  ) => {
    // Find the timer and group
    const group = groups.find((g) => g.id === groupId);
    const timer = group?.timers.find((t) => t.id === timerId);
    if (!group || !timer) return;

    // Get user info for API calls
    const user = authClient.getUser();
    const authToken = authClient.getToken();

    if (!user || !authToken) {
      console.error("User not authenticated");
      setApiError("Please log in to save time entries");
      return;
    }

    setIsSubmittingTime(true);
    setApiError(null);

    let backendTimerId = timer.backendTimerId;

    // STEP 1: Check if we need to create/recreate backend timer
    // Create new backend timer if:
    // a) No backend timer exists yet (backendTimerId is null)
    // b) Active date is different from last active date
    if (!backendTimerId || timer.lastActiveDate !== selectedDate) {
      try {
        const timerPayload: CreateTimerPayload = {
          zoho_project_id: group.projectId || "",
          zoho_task_id: timer.taskId || "",
          notes: timer.notes,
          active_date: selectedDate,
        };

        const createdTimer = await createZohoTimer(timerPayload, authToken);
        backendTimerId = createdTimer.id;

        // Update timer with backend ID and date
        setGroups((prevGroups) =>
          prevGroups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  timers: g.timers.map((t) =>
                    t.id === timerId
                      ? {
                          ...t,
                          backendTimerId,
                          lastActiveDate: selectedDate,
                        }
                      : t
                  ),
                }
              : g
          )
        );
      } catch (error) {
        console.error("Failed to create backend timer:", error);
        if (error instanceof XanoTimerError) {
          setApiError(`Failed to create timer: ${error.message}`);
        } else {
          setApiError("Failed to create timer. Please try again.");
        }
        setIsSubmittingTime(false);
        return;
      }
    }

    // STEP 2: Create time interval
    let intervalId: number | null = null;
    try {
      const intervalPayload: CreateIntervalPayload = {
        zoho_timer_id: backendTimerId!,
        start_time: startTime,
        end_time: endTime,
        duration: Math.floor((endTime - startTime) / 1000),
      };

      const createdInterval = await createZohoTimerInterval(
        intervalPayload,
        authToken
      );
      intervalId = createdInterval.id;
    } catch (error) {
      console.error("Failed to create time interval:", error);
      if (error instanceof XanoTimerError) {
        setApiError(`Failed to save time entry: ${error.message}`);
      } else {
        setApiError("Failed to save time entry. Please try again.");
      }
      setIsSubmittingTime(false);
      return;
    }

    // STEP 3: Create frontend TimeEvent with backend ID
    const newEvent: TimeEvent = {
      id: createId(),
      groupId,
      timerId,
      projectName: group.projectName,
      taskName: timer.taskName,
      notes: timer.notes,
      startTime,
      endTime,
      backendIntervalId: intervalId,
      activeDate: selectedDate,
    };

    // Add to time events and recalculate elapsed
    const updatedEvents = [...timeEvents, newEvent];
    setTimeEvents(updatedEvents);

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

    // Success! Clear loading state
    setIsSubmittingTime(false);
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

  const handleDeleteTimeSlot = async (eventId: string) => {
    // Find the event to get timer info
    const event = timeEvents.find((e) => e.id === eventId);
    if (!event) return;

    // If this event has a backend interval ID, delete it from the backend first
    if (event.backendIntervalId !== null) {
      const authToken = authClient.getToken();

      if (!authToken) {
        console.error("User not authenticated");
        setApiError("Please log in to delete time entries");
        return;
      }

      try {
        await deleteZohoTimerInterval(event.backendIntervalId, authToken);
      } catch (error) {
        console.error("Failed to delete interval from backend:", error);
        if (error instanceof XanoTimerError) {
          setApiError(`Failed to delete time entry: ${error.message}`);
        } else {
          setApiError("Failed to delete time entry. Please try again.");
        }
        return; // Don't remove from frontend if backend delete failed
      }
    }

    // Remove the event from frontend state
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

  const handleTaskChange = (
    groupId: string,
    timerId: string,
    taskId: string | null,
    taskName: string
  ) => {
    updateGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          timers: group.timers.map((timer) =>
            timer.id === timerId ? {...timer, taskId, taskName} : timer
          ),
        };
      })
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
    setProjectSearchTerms((previous) => {
      if (!(groupId in previous)) {
        return previous;
      }
      const next = {...previous};
      delete next[groupId];
      return next;
    });
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

  const handleProjectSelect = (groupId: string, projectId: string | null) => {
    const selectedProject = projectId
      ? projects.find((project) => project.id === projectId)
      : null;
    const nextProjectName = selectedProject?.name ?? "";

    updateGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const hasProjectChanged = group.projectId !== projectId;
        const shouldUpdateName = group.projectName !== nextProjectName;

        if (!hasProjectChanged && !shouldUpdateName) {
          return group;
        }

        return {
          ...group,
          projectId,
          projectName: nextProjectName,
          timers: hasProjectChanged
            ? group.timers.map((timer) => ({
                ...timer,
                taskId: null,
                taskName: "",
              }))
            : group.timers,
        };
      })
    );

    setProjectSearchTerms((previous) => {
      if (previous[groupId] === "") {
        return previous;
      }
      return {...previous, [groupId]: ""};
    });
  };

  const handleProjectSearchChange = (groupId: string, value: string) => {
    setProjectSearchTerms((previous) => ({
      ...previous,
      [groupId]: value,
    }));
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

      {timerSyncError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {timerSyncError}
        </div>
      )}

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
        {groups.map((group) => {
          const matchedProject =
            group.projectId !== null
              ? projects.find((project) => project.id === group.projectId)
              : undefined;

          const searchTerm = projectSearchTerms[group.id] ?? "";

          const availableProjects = projects.filter(
            (project) =>
              project.id === group.projectId ||
              !selectedProjectIds.has(project.id)
          );

          const projectSelectDisabled =
            isLoadingProjects && !projects.length && !group.projectId;

          const groupTaskOptions =
            group.projectId !== null
              ? tasksByProject.get(group.projectId) ?? []
              : [];

          const timerTaskOptions = groupTaskOptions.map(({id, name}) => ({
            id,
            name,
          }));

          const isTaskSelectDisabled = !group.projectId;

          return (
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
                  <div className="mt-1">
                    <ProjectPicker
                      selectedProject={matchedProject}
                      fallbackProjectName={
                        group.projectId && !matchedProject && group.projectName
                          ? group.projectName
                          : null
                      }
                      availableProjects={availableProjects}
                      totalProjectCount={projects.length}
                      searchTerm={searchTerm}
                      onSearchChange={(value) =>
                        handleProjectSearchChange(group.id, value)
                      }
                      onSelect={(projectId) =>
                        handleProjectSelect(group.id, projectId)
                      }
                      isLoading={isLoadingProjects}
                      disabled={projectSelectDisabled}
                    />
                  </div>
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
                {group.timers.map((timer) => (
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
                      taskId={timer.taskId}
                      taskName={timer.taskName}
                      notes={timer.notes}
                      elapsed={timer.elapsed}
                      isCompact={isCompact}
                      isActive={runningSession?.timerId === timer.id}
                      taskOptions={timerTaskOptions}
                      isTaskSelectDisabled={isTaskSelectDisabled}
                      isTaskOptionsLoading={isLoadingTasks}
                      onTaskChange={(timerId, taskId, taskLabel) =>
                        handleTaskChange(group.id, timerId, taskId, taskLabel)
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
                ))}
              </div>
            </div>
          );
        })}
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
              onClose={() => {
                setTimeEntryModal(null);
                setApiError(null); // Clear error on close
              }}
              onAddTime={(startTime, endTime, selectedDate) => {
                handleAddManualTime(
                  timeEntryModal.groupId,
                  timeEntryModal.timerId,
                  startTime,
                  endTime,
                  selectedDate
                );
                setTimeEntryModal(null);
              }}
              projectName={group.projectName}
              taskName={timer.taskName}
              notes={timer.notes}
              isTimerActive={runningSession?.timerId === timer.id}
              isSubmitting={isSubmittingTime}
              apiError={apiError}
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
