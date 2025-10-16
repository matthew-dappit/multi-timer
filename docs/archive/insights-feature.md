# Time Insights Feature

## Overview

The **Time Insights** page provides a visual analytics dashboard for your time tracking data.

**Note:** This feature depends on timer tracking logic which has been cleared. Once new timer tracking is implemented, the Insights page will need to be updated to work with the new data structure. See `docs/timer-rebuild-plan.md` for details.

## Planned Features

- **Daily Summary Cards**: Total time, projects worked, and total sessions
- **Hourly Heatmap**: Visual breakdown of time spent per hour (bar chart with intensity colors)
- **Project Breakdown**: Time distribution across projects with percentage and progress bars

## Navigation

Access the Insights page via:
- Desktop: Click "Insights" in the navbar
- Mobile: Tap the hamburger menu → "Insights"

## Features

### Date Navigation
- Navigate between days using arrow buttons
- "Jump to today" link appears when viewing past dates
- Next day button disabled for today (can't view future)

### Hourly Breakdown
- 24-hour view with AM/PM labels
- Color intensity shows activity level (based on dappit-turquoise)
- Hover effects for better visibility
- Time duration displayed on active hours

### Project Summaries
- Color-coded projects (auto-assigned from palette)
- Shows total time, session count, and percentage
- Visual progress bars for quick comparison
- Sorted by total time (most active first)

### Empty State
- Displays friendly message when no time tracked for selected day
- Clock icon and helpful text

## Data Source

**Currently Disabled:** The Insights page will need to be updated once new timer tracking logic is implemented.

Previously read from:
- Key: `multi-timer/time-events`
- Data: Array of time event objects with timestamps, project names, and task names

See `docs/timer-rebuild-plan.md` for implementation details.

## Technical Details

### Component Structure
```
/insights (page route)
└── TimeInsights.tsx (main component)
```

### State Management
- Reads time events from localStorage on mount
- Filters events by selected date
- Calculates hourly breakdowns and project summaries
- Updates in real-time when date changes

### Styling
- Matches existing Dappit brand colors
- Responsive grid layout (3 columns on desktop, stacks on mobile)
- Dark mode support throughout
- Smooth transitions and hover effects

## Color Palette

Projects are auto-assigned colors from this palette (cycles if more than 8 projects):
1. `#01D9B5` - Dappit Turquoise
2. `#FF7F50` - Dappit Coral
3. `#6366F1` - Indigo
4. `#EC4899` - Pink
5. `#F59E0B` - Amber
6. `#10B981` - Emerald
7. `#8B5CF6` - Purple
8. `#EF4444` - Red

## Future Enhancements (Planned)

- Week/month view toggle
- Export data to CSV
- Comparison between days/weeks
- Custom date range selection
- Task-level breakdown (drill down from projects)
- Time tracking goals and targets
