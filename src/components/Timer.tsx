"use client";

interface TimerProps {
  id: string;
  taskName: string;
  notes: string;
  elapsed: number;
  isCompact: boolean;
  isActive?: boolean;
  onTaskChange: (id: string, task: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export default function Timer({
  id,
  taskName,
  notes,
  elapsed,
  isCompact,
  isActive = false,
  onTaskChange,
  onNotesChange,
  onStart,
  onStop,
}: TimerProps) {
  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formattedTime = formatTime(elapsed);
  const hasNotes = notes.trim() !== "";
  const notesLabel = hasNotes ? notes : "Add note";

  const handleToggle = () => {
    if (isActive && onStop) {
      onStop();
    } else if (!isActive && onStart) {
      onStart();
    }
  };

  if (isCompact) {
    const borderColor = isActive
      ? "border-teal-400 ring-2 ring-teal-400/50"
      : "border-gray-200 dark:border-gray-700";

    return (
      <div
        onClick={handleToggle}
        className={`flex h-full flex-col gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md dark:bg-gray-800 cursor-pointer ${borderColor}`}
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

  const statusColor = isActive ? "bg-teal-400" : "bg-gray-300";
  const statusText = isActive ? "Running" : "Idle";
  const buttonBgColor = isActive ? "#FF7F50" : "#01D9B5"; // coral : turquoise
  const buttonText = isActive ? "Stop" : "Start";
  const borderColor = isActive
    ? "border-teal-400 ring-2 ring-teal-400/50"
    : "border-gray-200 dark:border-gray-700";

  return (
    <div
      className={`flex h-full flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow dark:bg-gray-800 ${borderColor}`}
    >
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${statusColor}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {statusText}
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
        onClick={handleToggle}
        className="w-full rounded-md px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
        style={{backgroundColor: buttonBgColor}}
      >
        {buttonText}
      </button>
    </div>
  );
}
