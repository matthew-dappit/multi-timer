// Xano Timer API Client
// Handles all interactions with Xano backend for timer and interval management

const WEBAPP_API_BASE_URL =
  process.env.NEXT_PUBLIC_WEBAPP_API_BASE_URL ?? "https://api.dappit.org/api:THWVRjoL";

// Type definitions matching Xano schemas from NEXT-STEPS-INFO.md

export interface ZohoTimer {
  id: number;
  dappit_user_id: number;
  zoho_project_id: string;
  zoho_task_id: string;
  notes: string;
  active_date: string; // YYYY-MM-DD format
  total_duration: number; // seconds
  status: "idle" | "running" | "stopped";
  synced_to_zoho: boolean;
  zoho_time_entry_id: string;
  created_at: number;
  updated_at: number;
}

export interface ZohoTimerInterval {
  id: number;
  created_at: number;
  zoho_timer_id: number;
  start_time: number; // Unix timestamp
  end_time: number; // Unix timestamp
  duration: number; // seconds
}

export interface CreateTimerPayload {
  zoho_project_id: string;
  zoho_task_id: string;
  notes: string;
  active_date: string; // YYYY-MM-DD format
}

export interface CreateIntervalPayload {
  zoho_timer_id: number;
  start_time: number; // Unix timestamp
  end_time: number; // Unix timestamp
  duration: number; // seconds
}

export class XanoTimerError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "XanoTimerError";
  }
}

/**
 * Create a new timer in Xano backend
 * Used when user adds manual time or starts a timer for the first time on a given date
 */
export async function createZohoTimer(
  payload: CreateTimerPayload,
  authToken: string
): Promise<ZohoTimer> {
  try {
    const response = await fetch(`${WEBAPP_API_BASE_URL}/zoho_timers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new XanoTimerError(
        errorText || `Failed to create timer (${response.status})`,
        response.status
      );
    }

    const timer: ZohoTimer = await response.json();
    return timer;
  } catch (error) {
    if (error instanceof XanoTimerError) {
      throw error;
    }
    throw new XanoTimerError(
      `Network error creating timer: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a new time interval in Xano backend
 * Links the interval to an existing timer
 */
export async function createZohoTimerInterval(
  payload: CreateIntervalPayload,
  authToken: string
): Promise<ZohoTimerInterval> {
  try {
    const response = await fetch(`${WEBAPP_API_BASE_URL}/zoho_timer_intervals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new XanoTimerError(
        errorText || `Failed to create interval (${response.status})`,
        response.status
      );
    }

    const interval: ZohoTimerInterval = await response.json();
    return interval;
  } catch (error) {
    if (error instanceof XanoTimerError) {
      throw error;
    }
    throw new XanoTimerError(
      `Network error creating interval: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get all timers for a user on a specific date
 * Used to check if a timer already exists before creating a new one
 */
export async function getTimersForDate(
  userId: number,
  activeDate: string, // YYYY-MM-DD format
  authToken: string
): Promise<ZohoTimer[]> {
  try {
    const url = new URL(`${WEBAPP_API_BASE_URL}/zoho_timers`);
    url.searchParams.append("user_id", userId.toString());
    url.searchParams.append("active_date", activeDate);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new XanoTimerError(
        errorText || `Failed to fetch timers (${response.status})`,
        response.status
      );
    }

    const data = await response.json();

    // API returns { all_timers: ZohoTimer[] } according to swagger docs
    if (data && Array.isArray(data.all_timers)) {
      return data.all_timers;
    }

    // Fallback if structure is different
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof XanoTimerError) {
      throw error;
    }
    throw new XanoTimerError(
      `Network error fetching timers: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Helper: Format a Date object to YYYY-MM-DD string
 */
export function formatDateForXano(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return formatDateForXano(new Date());
}
