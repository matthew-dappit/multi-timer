"use client";

interface TimerProps {
  id: string;
  taskName: string;
  notes: string;
  isCompact: boolean;
  onTaskChange: (id: string, task: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}

export default function Timer({
  id,
  taskName,
  notes,
  isCompact,
  onTaskChange,
  onNotesChange,
}: TimerProps) {
  // Placeholder for time display
  const formattedTime = "00:00:00";
  const hasNotes = notes.trim() !== "";
  const notesLabel = hasNotes ? notes : "Add note";

  if (isCompact) {
    return (
      <div
        className="flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      >
        <span className="font-mono text-2xl font-light text-gray-900 dark:text-gray-100">
          {formattedTime}
        </span>

        <div
          className={`break-words text-sm font-medium ${
            hasNotes
              ? "text-gray-700 dark:text-gray-200"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {notesLabel}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-gray-300" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Idle
        </span>
      </div>

      <input
        value={taskName}
        onChange={(event) => onTaskChange(id, event.target.value)}
        placeholder="Task name"
        className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm font-medium text-gray-900 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400 dark:border-gray-700 dark:text-gray-100"
      />

      <div className="text-center">
        <div className="font-mono text-3xl font-light text-gray-900 dark:text-gray-100">
          {formattedTime}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(event) => onNotesChange(id, event.target.value)}
        placeholder="Notes"
        rows={2}
        className="w-full flex-1 resize-none rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400 dark:border-gray-700 dark:text-gray-200"
      />

      <button
        disabled
        className="w-full rounded-md bg-gray-300 px-3 py-2 text-sm font-semibold text-white transition cursor-not-allowed opacity-50"
      >
        Start (Disabled)
      </button>
    </div>
  );
}
