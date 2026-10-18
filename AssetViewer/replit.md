# Focus List - To-Do & Pomodoro

## Overview
A minimalist iOS-style web application combining a Coda-style task manager with a Flocus-style Pomodoro timer. Built with vanilla HTML, CSS, and JavaScript for maximum simplicity and performance.

## Project Purpose
Help users stay focused and productive by managing tasks with priority levels and tracking work sessions with an integrated Pomodoro timer.

## Current State
**Status**: ✅ MVP Complete + Enhanced Design
**Last Updated**: November 12, 2025

## Recent Changes
- **Custom Confirmation Modal** (Latest - November 12, 2025):
  - Replaced boring native browser confirm dialog with beautiful custom modal
  - iOS-inspired design with glassmorphism, backdrop blur, and smooth animations
  - Modal features: Warning icon bounce animation, slide-in entrance, fade-in overlay
  - Gradient danger button with hover effects and shadow elevation
  - Click outside modal or press Escape to dismiss
  - Fully accessible with ARIA labels and keyboard navigation
  - Dark mode support with theme-aware styling
  - Mobile responsive with vertical button layout on small screens

- **Improved Task List Visibility and Scrolling** (November 12, 2025):
  - Fixed task list layout to prevent text overflow and content getting cut off
  - Made task list scrollable container flexible with proper height management
  - Enhanced text wrapping with word-break, overflow-wrap, and hyphens for long titles/notes
  - Improved grid layout with fixed column widths for consistent spacing (24px 24px 80px 1fr auto)
  - Task content area now gets maximum available space (1fr column)
  - Better scrollbar visibility with wider, more prominent design (8px width)
  - Fixed element alignment with proper sizing for all task components
  - Added flex: 1 to task-list for dynamic height based on available space
  - Set max-height on todo-panel to prevent excessive growth
  - Reduced gaps between elements from 1rem to 0.75rem for tighter layout
  - Fixed-width priority chips (80px) for consistent appearance
  - Removed unnecessary margins for cleaner alignment

- **Enhanced To-Do Panel Design**:
  - Added dark gradient background (black to gray with subtle color accents)
  - Improved task card styling with glassmorphism effect and hover animations
  - Enhanced priority chips with glow effects
  - Better filter chip visibility with semi-transparent styling
  - Gradient progress bar with blue-to-green color transition
  - Improved typography and spacing for better readability
  - Custom scrollbar styling

- **Fixed Pomodoro Visibility Issues**:
  - Fixed active mode pill text color (now always dark on white background)
  - Improved contrast for all pill states

- **Initial Release**:
  - Created complete iOS-style To-Do + Pomodoro web app
  - Implemented task management with drag-to-reorder, inline editing, priority chips
  - Built Pomodoro timer with customizable durations and task integration
  - Added light/dark/system theme support with CSS variables
  - Integrated LocalStorage for persistence across sessions
  - Added keyboard shortcuts for improved productivity
  - Configured web server workflow on port 5000

## Features

### Task Management (To-Do Panel)
- **Add Tasks**: Title (required) and note (optional)
- **Priority Levels**: High, Medium, Low with visual chips
- **Task States**: Active (default), Done (checkbox), Cancelled, Restore
- **Progress Tracking**: Smart calculation = `done / (total - cancelled)`
- **Live Counts**: Total, Active, Done, Cancelled
- **Filters**: All, Active, Done, Cancelled
- **Search**: Filter tasks by title or note
- **Drag-to-Reorder**: Reorganize tasks with persistence
- **Inline Editing**: Edit task title and notes directly (contenteditable)

### Pomodoro Timer (Focus Panel)
- **Hero Background**: Full-bleed image with dim overlay
- **Three Modes**: Focus (25 min), Short Break (5 min), Long Break (15 min)
- **Customizable Durations**: Edit Work/Short/Long timings in settings
- **Task Integration**: Attach tasks to timer, auto-complete on work session finish
- **Controls**: Start/Pause, Reset, Attach Selected Task
- **Settings**: 
  - Editable durations (Work 5-90 min, Short 3-30 min, Long 5-60 min)
  - Rounds until long break (1-12, default 4)
  - Auto-next session toggle
  - Sound on/off for completion beep
- **Rounds Counter**: Tracks completed work sessions

### Theming
- **Three Modes**: Light, Dark, System (respects prefers-color-scheme)
- **iOS Design**: Rounded corners, soft shadows, SF-like system fonts
- **Color Tokens**: 
  - Primary: #0a84ff (iOS blue)
  - Accent: #34c759 (iOS green)
  - Danger: #ff3b30 (light) / #ff453a (dark)

### Keyboard Shortcuts
- `Space`: Start/Pause timer
- `1/2/3`: Switch between Focus/Short/Long modes
- `R`: Reset timer
- `Enter`: Add new task (when in task input)

### Persistence
All data saved to LocalStorage:
- Tasks: `focuslist_tasks_v1`
- Theme: `theme`
- Pomodoro settings: `durWork`, `durShort`, `durLong`, `roundsLong`, `autoNext`, `soundOn`
- Pomodoro state: `roundsDone`, `attachedTaskId`

## Project Architecture

### File Structure
```
/
├── index.html          # Main HTML structure
├── styles.css          # iOS-style theming and responsive design
├── app.js              # All application logic
├── assets/
│   └── bg-1.jpg       # Hero background image for Pomodoro
└── replit.md          # This file
```

### Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage API
- **Server**: Python HTTP server (port 5000)
- **No Dependencies**: Zero external libraries or frameworks

### Design Patterns
- **State Management**: Single `state` object with tasks and Pomodoro settings
- **Event-Driven**: Event listeners for user interactions
- **Component-Based UI**: Separate panels for To-Do and Pomodoro
- **Responsive Design**: CSS Grid with mobile stack layout
- **Accessibility**: ARIA labels, live regions, focus management

## Key Implementation Details

### Task Model
```javascript
{
  id: string (timestamp),
  title: string,
  note: string,
  priority: 'high' | 'medium' | 'low',
  status: 'active' | 'done' | 'cancelled',
  createdAt: number (timestamp)
}
```

### Progress Calculation
- Formula: `done / (total - cancelled)`
- If denominator is 0 → 0%
- Cancelling reduces denominator (doesn't count towards progress)
- Restoring adds back to denominator

### Pomodoro Work Cycle
1. On work session complete:
   - Increment rounds counter
   - If task attached and Active → mark as Done
   - Switch to Short Break (or Long every N rounds)
   - If Auto-next enabled → start next session automatically

## Accessibility Features
- `aria-live="polite"` on counts and progress label
- Visible focus rings for keyboard navigation
- ARIA labels on all interactive elements
- Color contrast meets WCAG AA standards
- Keyboard shortcuts for main actions

## Browser Compatibility
- Modern browsers supporting ES6+
- CSS Grid and Flexbox
- LocalStorage API
- Web Audio API (for completion beep)

## Development Notes
- No build process required - just serve static files
- Python's http.server used for development
- All state managed client-side
- No backend or database needed

## Future Enhancements (Not in MVP)
- Browser notifications on session completion
- Background image picker (cycle through multiple images)
- Export/Import tasks as JSON
- Task statistics and completion trends
- Task tags and categories
- Long-press context menus
