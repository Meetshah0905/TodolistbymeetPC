const STORAGE_KEY = 'focuslist_tasks_v1';

const quotes = [
  "💰 Money doesn't buy happiness — it buys control: over your time, your peace, your distance from nonsense.",
  "🔇 When you're broke, everyone owns a piece of you. When you're rich, you own silence.",
  "🧾 \"It's not about money\" is something only people with money say.",
  "💣 Poverty isn't peaceful; it's panic that never ends.",
  "😤 You don't want luxury — you want freedom to choose Monday or sleep.",
  "🧘‍♂️ You can't meditate when rent's due.",
  "🔧 Money won't fix you — but it'll give you space to fix yourself.",
  "🚪 I'm not chasing wealth — I'm escaping limitation.",
  "💡 Every bill you pay with calmness is proof you were right to grind.",
  "🔥 Money isn't greed — it's oxygen for ambition. Without it, dreams suffocate.",
  "⚡ Be desperate — desperation is clarity with fire in it.",
  "🚫 Nobody's coming. Either you build it, or you stay stuck.",
  "💥 Pain is the down payment for peace.",
  "🏋️ Work so hard that laziness feels like self-betrayal.",
  "🧠 Discipline isn't about liking it — it's about hating regret more.",
  "⏳ You can suffer now and shape your future, or you can relax now and regret it forever.",
  "⏰ Every time you say \"I'll start tomorrow,\" someone else starts today — and you'll meet them again, far ahead.",
  "🩹 Most people quit right before it stops being painful — that's when it starts paying.",
  "🚀 You don't need balance yet, you need momentum. Balance comes later, when you've built the life that deserves it.",
  "🌍 The universe doesn't reward wanting — it rewards moving.",
  "🤫 Don't tell people your goals — they'll kill them with their fear.",
  "🐢 When people can't match your pace, they'll question your direction.",
  "💔 Some friends love you until you outgrow their excuses.",
  "📈 Never brag — let results be the rumor.",
  "🚫 Stop expecting loyalty from people who benefit from your confusion.",
  "🌫️ Learn to disappear until disappearing feels like home.",
  "🗣️ You owe nobody your progress story.",
  "👨‍👩‍👦 Your parents may not understand your dream, but they'll live better because you chased it.",
  "👁️ Not everyone is meant to clap for you — some are just there to notice how far you've gone.",
  "🔕 Silence makes noise when you're doing better.",
  "😮‍💨 \"I'm tired.\" Good — that means you're close.",
  "🪞 Every version of you that quit is watching this one. Don't fold again.",
  "⚔️ When it hurts, you're either breaking or building — choose which.",
  "📅 The future you is begging you not to waste today.",
  "🙏 You prayed for an opportunity — this grind is that opportunity.",
  "🔁 There's no secret — just do it longer than everyone else who gave up.",
  "💀 You don't need support — you need obsession.",
  "🎯 Keep the tunnel vision — light comes after repetition, not motivation.",
  "🌪️ Sometimes progress looks like isolation, confusion, or exhaustion — it's still progress.",
  "😎 The ones who laugh now will explain later.",
  "🍽️ Never show your hunger — just feed it quietly.",
  "♟️ Never show your full hand — peace is hidden leverage.",
  "💼 Never show the price you paid — just make it look effortless.",
  "🧱 You're not chasing validation; you're collecting evidence that you can't be broken.",
  "🏃‍♂️ Lose everything except your pace.",
  "🔁 The real flex is doing it twice after everyone watched you fall.",
  "🧊 You don't owe softness to a world that hardened you.",
  "⏰ Don't wait for motivation — wait for results; they motivate better.",
  "💀 It's not over until you say it's over.",
  "👑 Money. Power. Peace. All three belong to the same person — the one who didn't quit when it got boring.",
  "💼 Money doesn't change you — it exposes the version of you that was tired of pretending.",
  "🚫 Broke people think rich people are greedy. Rich people think time wasters are insane.",
  "🧱 Money builds walls between you and every fake apology you'll ever hear.",
  "🧮 Learn to make money while you sleep, or you'll trade sleep to make money.",
  "🧠 People who say \"money isn't everything\" usually borrowed it from someone who knew it is.",
  "📊 Money talks, but wealth whispers. Learn both languages.",
  "💸 A poor mindset spends on moments. A rich one spends on momentum.",
  "🏦 Every deposit is a vote for your future version.",
  "🕶️ Privacy is luxury's bodyguard.",
  "🧭 Don't chase expensive — chase expansive.",
  "🔥 No one respects effort until it's producing envy.",
  "🪞 You're not lazy — you're unaligned. Once it matters, you'll move.",
  "🚀 Move fast. You'll clean the mess later — just don't lose the motion.",
  "⚒️ Pressure isn't punishment; it's proof you're trusted with more.",
  "🕰️ 6 months of full focus can put you 5 years ahead of everyone who's \"planning.\"",
  "🏁 The grind doesn't kill you; hesitation does.",
  "🥶 Don't slow down because they're tired. They're tired because they slowed down.",
  "💪 Pain is feedback. Growth is payment.",
  "📆 Every boring Tuesday is deciding your next decade.",
  "🔋 Don't manage your energy — multiply it with purpose.",
  "🦴 Not every relative is family. Blood makes you related, loyalty makes you real.",
  "💬 People don't listen to understand — they listen to find weakness.",
  "👥 They'll call you selfish when you stop giving them access to your peace.",
  "🐍 Not everyone who checks on you wants you to heal.",
  "🔎 You can't teach vision to people addicted to comfort.",
  "📉 People respect distance more than kindness.",
  "💡 Stay mysterious. Curiosity keeps your value high.",
  "🧩 If they can't benefit from you, you'll see their true tone.",
  "🕊️ Some people don't hate you — they hate the version of themselves that gave up.",
  "🧤 Cold people aren't heartless; they're tired of being warm to the wrong crowd.",
  "💭 You don't need motivation — you need memory. Remember why you started.",
  "⚡ Every time you break your own promise, your self-respect takes a hit.",
  "💔 The price of comfort is potential.",
  "🧨 You'll never outgrow pain — you'll just get better at translating it into progress.",
  "🧩 You're not behind; you're still loading your version of success.",
  "🌒 Rest when you're done, not when you're doubtful.",
  "🚷 Stop waiting for peace to work — work until peace can exist.",
  "🎯 Clarity comes from motion, not meditation.",
  "🪶 Forgive yourself faster than you forgive others — you need that energy back.",
  "🏔️ One day you'll wake up in the life you built and thank your old self for refusing to quit.",
  "🧱 Don't show foundation work — people only respect buildings.",
  "🎭 Make your wins look normal; they'll never guess how heavy they were.",
  "🕶️ Privacy is the loudest statement in the room.",
  "⚙️ Never explain your plan — explain your results later.",
  "💬 When they say \"you've changed,\" it means your old version no longer serves them.",
  "🩸 Pain built me more than praise ever did.",
  "🗡️ Never get emotional about strategy.",
  "💣 What you can do quietly is what defines your real power.",
  "💡 Strategy beats speed — but when you have both, nobody can stop you.",
  "🕰️ The day you become consistent is the day luck starts looking like routine."
];

const CATEGORY_SEQUENCE = ['IU', 'IBNU', 'NIBU', 'NINU'];
const CATEGORY_DETAILS = {
  IU: { label: 'IU', title: 'Important & Urgent' },
  IBNU: { label: 'IBNU', title: 'Important but Not Urgent' },
  NIBU: { label: 'NIBU', title: 'Not Important but Urgent' },
  NINU: { label: 'NINU', title: 'Not Important & Not Urgent' }
};
const LEGACY_PRIORITY_MAP = {
  high: 'IU',
  medium: 'IBNU',
  low: 'NINU'
};

// Safe localStorage getter with fallback
function safeGetItem(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (e) {
    console.warn('localStorage access failed:', e);
    return defaultValue;
  }
}

// Safe localStorage setter
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage set failed:', e);
  }
}

const state = {
  tasks: [],
  filter: 'all',
  searchQuery: '',
  selectedTaskId: null,
  activeMoveTaskId: null,
  pomo: {
    mode: 'work',
    work: +(safeGetItem('durWork', '25')),
    short: +(safeGetItem('durShort', '5')),
    long: +(safeGetItem('durLong', '15')),
    roundsToLong: +(safeGetItem('roundsLong', '4')),
    autoNext: safeGetItem('autoNext', 'false') === 'true',
    soundOn: safeGetItem('soundOn', 'true') !== 'false',
    secs: 0,
    timer: null,
    running: false,
    roundsDone: +(safeGetItem('roundsDone', '0')),
    attachedTaskId: safeGetItem('attachedTaskId', null)
  }
};

function getModeDurationSeconds(mode) {
  switch (mode) {
    case 'short':
      return state.pomo.short * 60;
    case 'long':
      return state.pomo.long * 60;
    case 'deepwork':
      return state.pomo.secs || 0;
    case 'work':
    default:
      return state.pomo.work * 60;
  }
}

const storedPomoMode = safeGetItem('pomoMode', state.pomo.mode) || 'work';
state.pomo.mode = storedPomoMode;
const defaultDuration = getModeDurationSeconds(state.pomo.mode);
const storedRemaining = parseInt(safeGetItem('pomoRemainingSecs', `${defaultDuration}`), 10);
state.pomo.secs = Number.isNaN(storedRemaining) ? defaultDuration : storedRemaining;
state.pomo.running = safeGetItem('pomoRunning', 'false') === 'true';
state.pomo.startedAt = parseInt(safeGetItem('pomoStartedAt', '0'), 10) || null;
state.pomo.targetAt = parseInt(safeGetItem('pomoTargetAt', '0'), 10) || null;
state.pomo.deepworkBase = parseInt(safeGetItem('pomoDeepworkBase', '0'), 10) || 0;

let currentViewDate = new Date();
currentViewDate.setHours(0, 0, 0, 0);
let lastKnownSystemDateKey = currentViewDate.toDateString();

const elements = {
  taskList: document.getElementById('taskList'),
  taskTitle: document.getElementById('taskTitle'),
  taskNote: document.getElementById('taskNote'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  searchInput: document.getElementById('searchInput'),
  clearAll: document.getElementById('clearAll'),
  progressBar: document.getElementById('progressBar'),
  progressLabel: document.getElementById('progressLabel'),
  countTotal: document.getElementById('countTotal'),
  countActive: document.getElementById('countActive'),
  countDone: document.getElementById('countDone'),
  countCancelled: document.getElementById('countCancelled'),
  filterChips: document.querySelectorAll('.filter-chip'),
  themeToggle: document.getElementById('themeToggle'),
  timerDisplay: document.getElementById('timerDisplay'),
  startPauseBtn: document.getElementById('startPauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  attachTaskBtn: document.getElementById('attachTaskBtn'),
  modePills: document.querySelectorAll('.mode-pill'),
  pomoHeading: document.getElementById('pomoHeading'),
  attachedTask: document.getElementById('attachedTask'),
  roundsCount: document.getElementById('roundsCount'),
  durWork: document.getElementById('durWork'),
  durShort: document.getElementById('durShort'),
  durLong: document.getElementById('durLong'),
  roundsLong: document.getElementById('roundsLong'),
  autoNext: document.getElementById('autoNext'),
  soundOn: document.getElementById('soundOn'),
  confirmModal: document.getElementById('confirmModal'),
  modalCancel: document.getElementById('modalCancel'),
  modalConfirm: document.getElementById('modalConfirm'),
  heroVideo: document.getElementById('heroVideo'),
  heroBg: document.getElementById('heroBg')
};

let modalTriggerElement = null;
let quoteRotationInterval = null;

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function startQuoteRotation() {
  // Clear any existing interval
  if (quoteRotationInterval) {
    clearInterval(quoteRotationInterval);
    quoteRotationInterval = null;
  }

  // Only rotate if no task is attached and element exists
  if (!state.pomo.attachedTaskId && elements.pomoHeading) {
    // Make heading non-editable when showing quotes
    elements.pomoHeading.contentEditable = 'false';

    // Set initial quote immediately
    const initialQuote = getRandomQuote();
    if (initialQuote) {
      elements.pomoHeading.textContent = initialQuote;
    }

    // Rotate every 10 seconds (10000 milliseconds)
    quoteRotationInterval = setInterval(() => {
      // Double-check that no task is attached before rotating
      if (!state.pomo.attachedTaskId && elements.pomoHeading) {
        const newQuote = getRandomQuote();
        if (newQuote) {
          elements.pomoHeading.textContent = newQuote;
        }
      } else {
        // Stop if task got attached
        stopQuoteRotation();
      }
    }, 10000); // 10 seconds = 10000 milliseconds
  }
}

function stopQuoteRotation() {
  if (quoteRotationInterval) {
    clearInterval(quoteRotationInterval);
    quoteRotationInterval = null;
  }
}

function showModal() {
  modalTriggerElement = document.activeElement;
  elements.confirmModal.classList.add('active');
  elements.modalConfirm.focus();
  trapFocus(elements.confirmModal);
}

function hideModal() {
  elements.confirmModal.classList.remove('active');
  if (modalTriggerElement) {
    modalTriggerElement.focus();
    modalTriggerElement = null;
  }
}

function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleTabKey(e) {
    if (!elements.confirmModal.classList.contains('active')) {
      document.removeEventListener('keydown', handleTabKey);
      return;
    }

    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  document.addEventListener('keydown', handleTabKey);
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    state.tasks = Array.isArray(parsed) ? parsed.map(normalizeTask) : [];
    // Save tasks after normalization to persist taskDate field for legacy tasks
    saveTasks();
  } catch (e) {
    console.warn('Failed to load tasks from localStorage:', e);
    state.tasks = [];
  }
}

function normalizeTask(task) {
  if (!task || typeof task !== 'object') return task;
  const normalized = { ...task };
  if (!normalized.category) {
    if (normalized.priority && LEGACY_PRIORITY_MAP[normalized.priority]) {
      normalized.category = LEGACY_PRIORITY_MAP[normalized.priority];
    } else {
      normalized.category = 'IU';
    }
  }
  if (!CATEGORY_SEQUENCE.includes(normalized.category)) {
    normalized.category = 'IU';
  }
  delete normalized.priority;

  // Ensure taskDate exists - migrate from old date fields if needed
  if (!normalized.taskDate) {
    if (normalized.dateValue !== undefined && normalized.dateValue !== null) {
      const dateObj = new Date(normalized.dateValue);
      if (!Number.isNaN(dateObj.getTime())) {
        normalized.taskDate = formatDateAsYYYYMMDD(dateObj);
      }
    } else if (normalized.date) {
      const dateObj = new Date(normalized.date);
      if (!Number.isNaN(dateObj.getTime())) {
        normalized.taskDate = formatDateAsYYYYMMDD(dateObj);
      }
    } else if (normalized.createdAt) {
      // Fallback to createdAt for legacy tasks
      normalized.taskDate = formatDateAsYYYYMMDD(normalized.createdAt);
    } else {
      // Last resort: use today's date
      normalized.taskDate = formatDateAsYYYYMMDD(new Date());
    }
  }

  if (!normalized.dateValue || Number.isNaN(Number(normalized.dateValue))) {
    const derived = normalized.taskDate ? parseYYYYMMDDString(normalized.taskDate) : null;
    if (derived) {
      normalized.dateValue = derived.getTime();
      normalized.date = derived.toDateString();
    }
  }

  // Ensure timeBlock field exists (for Day Planner integration)
  if (!normalized.timeBlock) {
    normalized.timeBlock = null;
  }

  return normalized;
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    // Dispatch custom event for calendar view to listen
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  } catch (e) {
    console.warn('Failed to save tasks to localStorage:', e);
  }
}

function addTask(title, note = '', estimatedHours = 0, estimatedMinutes = 0) {
  // Use the currently selected date (currentViewDate), not today's date
  const selectedDate = currentViewDate ? new Date(currentViewDate) : new Date();
  selectedDate.setHours(0, 0, 0, 0);
  const taskDate = formatDateAsYYYYMMDD(selectedDate); // Store as YYYY-MM-DD string
  const dateValue = selectedDate.getTime();
  const dateLabel = selectedDate.toDateString();

  // Calculate estimated time in minutes
  const estimatedTimeMinutes = (parseInt(estimatedHours) || 0) * 60 + (parseInt(estimatedMinutes) || 0);

  // Calculate target pomodoros based on estimated time (default 25 min per pomodoro)
  const defaultPomoMinutes = 25;
  const targetPomos = estimatedTimeMinutes > 0
    ? Math.max(1, Math.ceil(estimatedTimeMinutes / defaultPomoMinutes))
    : 4; // Default to 4 if no time estimate

  const task = {
    id: Date.now().toString(),
    title,
    note,
    category: 'IU',
    status: 'active',
    createdAt: Date.now(),
    taskDate: taskDate, // Primary date field in YYYY-MM-DD format
    dateValue,
    date: dateLabel,
    pomoSessions: 0,
    targetPomos: targetPomos,
    estimatedHours: parseInt(estimatedHours) || 0,
    estimatedMinutes: parseInt(estimatedMinutes) || 0,
    estimatedTimeMinutes: estimatedTimeMinutes
  };
  state.tasks.push(task);
  saveTasks();
  renderTasks();
  updateCounts();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  if (state.selectedTaskId === id) state.selectedTaskId = null;
  if (state.pomo.attachedTaskId === id) {
    state.pomo.attachedTaskId = null;
    localStorage.removeItem('attachedTaskId');
    updateAttachedTask();
  }
  saveTasks();
  renderTasks();
  updateCounts();
}

function toggleTaskDone(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.status = task.status === 'done' ? 'active' : 'done';
    saveTasks();
    renderTasks();
    updateCounts();
  }
}

function cancelTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.status = 'cancelled';
    saveTasks();
    renderTasks();
    updateCounts();
  }
}

function restoreTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.status = 'active';
    saveTasks();
    renderTasks();
    updateCounts();
  }
}

function cycleCategory(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    const currentIndex = CATEGORY_SEQUENCE.indexOf(task.category);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % CATEGORY_SEQUENCE.length;
    task.category = CATEGORY_SEQUENCE[nextIndex];
    saveTasks();
    renderTasks();
  }
}

function updateTaskContent(id, field, value) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task[field] = value;
    saveTasks();
    // Update total estimated time if estimated time fields changed
    if (field === 'estimatedHours' || field === 'estimatedMinutes') {
      updateCounts();
    }
  }
}

function formatDateKey(date) {
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) {
    return new Date().toDateString();
  }
  normalized.setHours(0, 0, 0, 0);
  return normalized.toDateString();
}

// Format date as YYYY-MM-DD string for taskDate field
function formatDateAsYYYYMMDD(date) {
  let d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    d = new Date();
  }
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseYYYYMMDDString(value) {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if ([year, month, day].some((n) => Number.isNaN(n))) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTaskDateTimestamp(task) {
  if (!task) return null;
  if (task.taskDate) {
    const parsed = parseYYYYMMDDString(task.taskDate);
    if (parsed) {
      return parsed.getTime();
    }
  }

  const rawValue = task?.dateValue;
  if (rawValue !== undefined && rawValue !== null) {
    const numericValue = typeof rawValue === 'string' ? Number(rawValue) : rawValue;
    if (!Number.isNaN(numericValue)) {
      const date = new Date(numericValue);
      if (!Number.isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }
    }
  }

  if (task.date) {
    const parsed = new Date(task.date);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed.getTime();
    }
  }

  const fallback = new Date(task.createdAt || Date.now());
  fallback.setHours(0, 0, 0, 0);
  return fallback.getTime();
}

function setTaskDateFields(task, dateObj) {
  if (!task || !dateObj) return;
  const date = new Date(dateObj);
  if (Number.isNaN(date.getTime())) return;
  date.setHours(0, 0, 0, 0);
  task.taskDate = formatDateAsYYYYMMDD(date);
  task.dateValue = date.getTime();
  task.date = date.toDateString();
}

function getTasksForDate(tasks, date) {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) {
    return tasks;
  }
  target.setHours(0, 0, 0, 0);
  const selectedDateStr = formatDateAsYYYYMMDD(target); // Convert selected date to YYYY-MM-DD

  // Filter tasks strictly by taskDate field
  return tasks.filter(task => {
    // Primary check: taskDate field (YYYY-MM-DD format)
    if (task.taskDate) {
      return task.taskDate === selectedDateStr;
    }

    // Legacy support: if task doesn't have taskDate, check old date fields
    // But only for backward compatibility - new tasks should always have taskDate
    const rawDateValue = task?.dateValue;
    if (rawDateValue !== undefined && rawDateValue !== null) {
      const numericValue = typeof rawDateValue === 'string' ? Number(rawDateValue) : rawDateValue;
      if (!Number.isNaN(numericValue)) {
        const taskDate = new Date(numericValue);
        taskDate.setHours(0, 0, 0, 0);
        const taskDateStr = formatDateAsYYYYMMDD(taskDate);
        return taskDateStr === selectedDateStr;
      }
    }

    if (task.date) {
      const taskDate = new Date(task.date);
      if (!Number.isNaN(taskDate.getTime())) {
        taskDate.setHours(0, 0, 0, 0);
        const taskDateStr = formatDateAsYYYYMMDD(taskDate);
        return taskDateStr === selectedDateStr;
      }
    }

    // Only use createdAt as fallback for very old tasks with no date info
    // New tasks should always have taskDate set
    const created = new Date(task.createdAt || Date.now());
    created.setHours(0, 0, 0, 0);
    const createdDateStr = formatDateAsYYYYMMDD(created);
    return createdDateStr === selectedDateStr;
  });
}

function getFilteredTasks() {
  let filtered = state.tasks;

  // Filter by selected date
  if (currentViewDate) {
    filtered = getTasksForDate(filtered, currentViewDate);
  }

  if (state.filter !== 'all') {
    filtered = filtered.filter(t => t.status === state.filter);
  }

  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.note.toLowerCase().includes(query)
    );
  }

  return filtered;
}

function renderTasks() {
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    elements.taskList.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;">No tasks to show</p>';
    return;
  }

  elements.taskList.innerHTML = filtered
    .map(task => {
      const detail = CATEGORY_DETAILS[task.category] || CATEGORY_DETAILS.IU;
      return `
    <div class="task-item ${task.status} ${task.id === state.selectedTaskId ? 'selected' : ''}" 
         data-id="${task.id}" 
         draggable="true">
      <span class="drag-handle">☰</span>
      <input type="checkbox" 
             class="task-checkbox" 
             ${task.status === 'done' ? 'checked' : ''} 
             ${task.status === 'cancelled' ? 'disabled' : ''}>
      <button class="priority-chip ${detail.label}" title="${detail.title}" aria-label="${detail.title}">${detail.label}</button>
      <div class="task-content">
        <div class="task-title" contenteditable="${task.status !== 'cancelled'}">${task.title}</div>
        <div class="task-note" contenteditable="${task.status !== 'cancelled'}">${task.note}</div>
        ${(task.estimatedHours > 0 || task.estimatedMinutes > 0) ? `
          <div class="task-estimated-time">
            <span class="time-icon">⏱</span>
            <span>Estimated: ${task.estimatedHours > 0 ? task.estimatedHours + 'h' : ''} ${task.estimatedMinutes > 0 ? task.estimatedMinutes + 'm' : ''}</span>
          </div>
        ` : ''}
      </div>
      <div class="task-actions">
        <button class="btn-icon" title="Move task" data-action="move">📅</button>
        <button class="btn-icon" title="Attach to Pomodoro${(task.estimatedHours > 0 || task.estimatedMinutes > 0) ? ' (with estimated time)' : ''}" data-action="attach">⏱</button>
        ${task.status === 'cancelled'
          ? '<button class="btn-icon" title="Restore" data-action="restore">↩️</button>'
          : '<button class="btn-icon" title="Cancel" data-action="cancel">✕</button>'
        }
        <button class="btn-icon" title="Delete" data-action="delete">🗑</button>
      </div>
      <div class="task-move-panel ${state.activeMoveTaskId === task.id ? 'open' : ''}">
        <p class="task-move-title">Move task to</p>
        <div class="task-move-options">
          <button class="chip move-chip" data-move-today>Move to Today</button>
          <div class="task-move-date">
            <label for="moveDate-${task.id}">Pick a date</label>
            <div class="task-move-date-input">
              <input type="date" id="moveDate-${task.id}" data-move-date-input value="${task.taskDate || ''}">
              <button class="btn-ghost btn-compact" data-move-apply>Move</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    })
    .join('');

  attachTaskEventListeners();
  // Update total estimated time after rendering
  updateCounts();
}

function attachTaskEventListeners() {
  document.querySelectorAll('.task-item').forEach(item => {
    const id = item.dataset.id;

    item.addEventListener('click', (e) => {
      if (!e.target.closest('.task-actions') &&
        !e.target.closest('.task-checkbox') &&
        !e.target.closest('.priority-chip') &&
        !e.target.closest('[contenteditable]')) {
        state.selectedTaskId = id;
        renderTasks();
        updateAttachButton();
      }
    });

    const checkbox = item.querySelector('.task-checkbox');
    checkbox?.addEventListener('change', () => toggleTaskDone(id));

    const categoryChip = item.querySelector('.priority-chip');
    categoryChip?.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleCategory(id);
      categoryChip.setAttribute('aria-live', 'polite');
    });

    const titleEl = item.querySelector('.task-title');
    titleEl?.addEventListener('blur', () => {
      updateTaskContent(id, 'title', titleEl.textContent.trim() || 'Untitled');
    });
    titleEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleEl.blur();
      }
    });

    const noteEl = item.querySelector('.task-note');
    noteEl?.addEventListener('blur', () => {
      updateTaskContent(id, 'note', noteEl.textContent.trim());
    });
    noteEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        noteEl.blur();
      }
    });

    item.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'delete') deleteTask(id);
        if (action === 'cancel') cancelTask(id);
        if (action === 'restore') restoreTask(id);
        if (action === 'attach') {
          state.selectedTaskId = id;
          attachSelectedTask();
          // If task has estimated time, automatically set and start pomodoro
          const task = state.tasks.find(t => t.id === id);
          if (task && (task.estimatedHours > 0 || task.estimatedMinutes > 0) && !state.pomo.running) {
            setTimeout(() => {
              if (!state.pomo.running) {
                startPomo();
              }
            }, 100);
          }
        }
        if (action === 'move') {
          toggleTaskMovePanel(id);
        }
      });
    });

    const movePanel = item.querySelector('.task-move-panel');
    movePanel?.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    const moveTodayBtn = item.querySelector('[data-move-today]');
    moveTodayBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      moveTaskToDate(id, today);
    });

    const moveApplyBtn = item.querySelector('[data-move-apply]');
    const moveDateInput = item.querySelector('[data-move-date-input]');
    moveApplyBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      if (moveDateInput?.value) {
        moveTaskToDate(id, moveDateInput.value);
      }
    });

    moveDateInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && moveDateInput.value) {
        event.preventDefault();
        moveTaskToDate(id, moveDateInput.value);
      }
    });

    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      item.style.opacity = '0.5';
    });

    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      const draggedIndex = state.tasks.findIndex(t => t.id === draggedId);
      const targetIndex = state.tasks.findIndex(t => t.id === id);

      if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
        const [draggedTask] = state.tasks.splice(draggedIndex, 1);
        state.tasks.splice(targetIndex, 0, draggedTask);
        saveTasks();
        renderTasks();
      }
    });
  });
}

function updateCounts() {
  const tasksForDate = currentViewDate
    ? getTasksForDate(state.tasks, currentViewDate)
    : [...state.tasks];

  const total = tasksForDate.length;
  const active = tasksForDate.filter(t => t.status === 'active').length;
  const done = tasksForDate.filter(t => t.status === 'done').length;
  const cancelled = tasksForDate.filter(t => t.status === 'cancelled').length;
  const actionable = tasksForDate.filter(t => t.status !== 'cancelled');

  elements.countTotal.textContent = total;
  elements.countActive.textContent = active;
  elements.countDone.textContent = done;
  elements.countCancelled.textContent = cancelled;

  const denominator = actionable.length;
  const progress = denominator > 0 ? Math.round((done / denominator) * 100) : 0;
  const previousProgress = parseInt(elements.progressBar.getAttribute('aria-valuenow') || '0', 10);

  elements.progressBar.style.width = `${progress}%`;
  elements.progressBar.setAttribute('aria-valuenow', progress);
  elements.progressLabel.textContent = `${progress}%`;

  if (progress !== previousProgress) {
    elements.progressLabel.classList.add('updating');
    setTimeout(() => {
      elements.progressLabel.classList.remove('updating');
    }, 400);
  }

  // Check if day is completed
  const isDayCompleted = denominator > 0 && done === denominator;
  const todoPanel = document.querySelector('.todo-panel');

  if (isDayCompleted) {
    elements.progressBar.classList.add('complete');
    todoPanel?.classList.add('day-completed');

    // Check if we should trigger non-blocking confetti (only once per date)
    const dateKey = currentViewDate ? formatDateAsYYYYMMDD(currentViewDate) : formatDateAsYYYYMMDD(new Date());
    if (previousProgress !== 100 && !hasCelebratedForDate(dateKey)) {
      triggerNonBlockingCelebration(dateKey);
      markDateAsCelebrated(dateKey);
    }

    setTimeout(() => {
      elements.progressBar.classList.remove('complete');
    }, 3000);
  } else {
    elements.progressBar.classList.remove('complete');
    todoPanel?.classList.remove('day-completed');
  }

  updateTotalEstimatedTime(tasksForDate);
  updatePendingTasksMessage();
}

function updateTotalEstimatedTime(tasksForDate) {
  const totalEstimatedTimeEl = document.getElementById('totalEstimatedTime');
  const remainingTimeEl = document.getElementById('remainingTime');
  const totalAvailableHoursInput = document.getElementById('totalAvailableHours');

  if (!totalEstimatedTimeEl || !remainingTimeEl || !totalAvailableHoursInput) return;

  // Calculate total estimated time in minutes
  let totalMinutes = 0;
  tasksForDate.forEach(task => {
    if (task.estimatedHours || task.estimatedMinutes) {
      totalMinutes += (parseInt(task.estimatedHours) || 0) * 60 + (parseInt(task.estimatedMinutes) || 0);
    }
  });

  // Convert to hours and minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Format display for total estimated
  let timeDisplay = '';
  if (hours > 0) {
    timeDisplay += `${hours}h`;
  }
  if (minutes > 0 || hours === 0) {
    if (timeDisplay) timeDisplay += ' ';
    timeDisplay += `${minutes}m`;
  }
  if (!timeDisplay) {
    timeDisplay = '0h 0m';
  }

  totalEstimatedTimeEl.textContent = timeDisplay;

  // Get total available hours for current day
  const dateKey = currentViewDate ? formatDateAsYYYYMMDD(currentViewDate) : formatDateAsYYYYMMDD(new Date());
  const availableHoursKey = `availableHours_${dateKey}`;
  const savedHours = parseFloat(safeGetItem(availableHoursKey, '0')) || 0;

  // Use input value if set, otherwise use saved value
  let totalAvailableHours = parseFloat(totalAvailableHoursInput.value);
  if (isNaN(totalAvailableHours) || totalAvailableHoursInput.value === '') {
    totalAvailableHours = savedHours;
    if (savedHours > 0) {
      totalAvailableHoursInput.value = savedHours;
    }
  }

  // Calculate remaining time (can be negative if over budget)
  const totalAvailableMinutes = totalAvailableHours * 60;
  const remainingMinutes = totalAvailableMinutes - totalMinutes;
  const absRemainingMinutes = Math.abs(remainingMinutes);
  const remainingHours = Math.floor(absRemainingMinutes / 60);
  const remainingMins = absRemainingMinutes % 60;

  // Format remaining time display
  let remainingDisplay = '';
  const isNegative = remainingMinutes < 0;

  if (isNegative) {
    remainingDisplay = '-';
  }

  if (remainingHours > 0) {
    remainingDisplay += `${remainingHours}h`;
  }
  if (remainingMins > 0 || remainingHours === 0) {
    if (remainingDisplay && remainingDisplay !== '-') remainingDisplay += ' ';
    remainingDisplay += `${remainingMins}m`;
  }
  if (!remainingDisplay || remainingDisplay === '-') {
    remainingDisplay = '0h 0m';
  }

  remainingTimeEl.textContent = remainingDisplay;

  // Add visual indicator based on remaining time
  if (remainingMinutes < 0) {
    remainingTimeEl.style.color = '#ff453a'; // Red for over budget
  } else if (remainingMinutes < 60 && totalAvailableMinutes > 0) {
    remainingTimeEl.style.color = '#ffcc00'; // Amber for low remaining
  } else {
    remainingTimeEl.style.color = '#ffffff'; // White for normal
  }
}

function saveAvailableHours() {
  const totalAvailableHoursInput = document.getElementById('totalAvailableHours');
  if (!totalAvailableHoursInput) return;

  const dateKey = currentViewDate ? formatDateAsYYYYMMDD(currentViewDate) : formatDateAsYYYYMMDD(new Date());
  const availableHoursKey = `availableHours_${dateKey}`;
  const hours = parseFloat(totalAvailableHoursInput.value) || 0;

  safeSetItem(availableHoursKey, hours.toString());
  updateCounts(); // This will update the remaining time display
}

function updatePendingTasksMessage() {
  const messageEl = document.getElementById('pendingMessage');
  if (!messageEl) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayValue = today.getTime();

  const pendingByDay = new Map();

  state.tasks.forEach(task => {
    if (!task || task.status === 'done' || task.status === 'cancelled') {
      return;
    }

    const baseValue = getTaskDateTimestamp(task);

    if (baseValue >= todayValue) {
      return;
    }

    pendingByDay.set(baseValue, (pendingByDay.get(baseValue) || 0) + 1);
  });

  if (pendingByDay.size === 0) {
    messageEl.innerHTML = '';
    messageEl.classList.remove('visible');
    if (!messageEl.hasAttribute('hidden')) {
      messageEl.setAttribute('hidden', '');
    }
    return;
  }

  const [latestTime, count] = Array.from(pendingByDay.entries())
    .sort((a, b) => b[0] - a[0])[0];

  const latestDate = new Date(latestTime);
  const formattedDate = latestDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  const label = count === 1 ? 'pending task' : 'pending tasks';
  messageEl.innerHTML = `
    <span class="pending-message-icon">⚠️</span>
    <span class="pending-message-text">
      <strong>${count} ${label}</strong>
      <span>from ${formattedDate}</span>
    </span>
    <button class="btn-ghost btn-compact" id="movePendingToTodayBtn">Move all to Today</button>
  `;
  messageEl.classList.add('visible');
  messageEl.removeAttribute('hidden');

  const bulkMoveBtn = document.getElementById('movePendingToTodayBtn');
  bulkMoveBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    movePendingTasksToToday();
  });
}

function toggleTaskMovePanel(taskId) {
  state.activeMoveTaskId = state.activeMoveTaskId === taskId ? null : taskId;
  renderTasks();
}

function moveTaskToDate(taskId, targetDate) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  let nextDate = null;
  if (typeof targetDate === 'string') {
    nextDate = parseYYYYMMDDString(targetDate);
  } else if (targetDate instanceof Date) {
    nextDate = new Date(targetDate);
  }

  if (!nextDate || Number.isNaN(nextDate.getTime())) {
    return;
  }

  setTaskDateFields(task, nextDate);
  const currentViewStr = currentViewDate ? formatDateAsYYYYMMDD(currentViewDate) : null;
  if (state.selectedTaskId === taskId && task.taskDate !== currentViewStr) {
    state.selectedTaskId = null;
  }
  state.activeMoveTaskId = null;
  saveTasks();
  renderTasks();
  updateCounts();
}

function movePendingTasksToToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayValue = today.getTime();
  const todayStr = formatDateAsYYYYMMDD(today);
  let moved = 0;

  state.tasks.forEach(task => {
    if (!task || task.status !== 'active') {
      return;
    }
    const taskValue = getTaskDateTimestamp(task);
    if (taskValue !== null && taskValue < todayValue) {
      setTaskDateFields(task, today);
      moved++;
    }
  });

  if (moved > 0) {
    state.activeMoveTaskId = null;
    saveTasks();
    if (!currentViewDate || formatDateAsYYYYMMDD(currentViewDate) === todayStr) {
      currentViewDate = new Date(today);
    }
    renderTasks();
    updateCounts();
  }
}

// Celebrated dates tracking
function hasCelebratedForDate(dateKey) {
  try {
    const celebrated = JSON.parse(localStorage.getItem('celebratedDates') || '[]');
    return celebrated.includes(dateKey);
  } catch (e) {
    return false;
  }
}

function markDateAsCelebrated(dateKey) {
  try {
    const celebrated = JSON.parse(localStorage.getItem('celebratedDates') || '[]');
    if (!celebrated.includes(dateKey)) {
      celebrated.push(dateKey);
      localStorage.setItem('celebratedDates', JSON.stringify(celebrated));
    }
  } catch (e) {
    console.warn('Failed to save celebrated date:', e);
  }
}

// Non-blocking confetti effect
let confettiAnimationId = null;
let confettiParticles = [];
let confettiCanvas = null;

function triggerNonBlockingCelebration(dateKey) {
  // Get todo panel position
  const todoPanel = document.querySelector('.todo-panel');
  if (!todoPanel) return;

  // Create or get confetti canvas
  if (!confettiCanvas) {
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.className = 'non-blocking-confetti';
    confettiCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(confettiCanvas);
  }

  const canvas = confettiCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Get todo panel bounds to position confetti near it
  const panelRect = todoPanel.getBoundingClientRect();
  const centerX = panelRect.left + panelRect.width / 2;
  const centerY = panelRect.top + panelRect.height / 2;

  // Create confetti particles
  confettiParticles = [];
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#34c759', '#0a84ff'];
  const particleCount = 100;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const speed = Math.random() * 3 + 2;
    confettiParticles.push({
      x: centerX,
      y: centerY,
      size: Math.random() * 8 + 4,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'circle' : 'square'
    });
  }

  // Animate confetti (non-blocking, auto-stop after 2 seconds)
  const startTime = Date.now();
  const duration = 2000;

  function animateConfetti() {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      // Clean up
      if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiParticles = [];
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    confettiParticles = confettiParticles.filter(particle => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.rotation += particle.rotationSpeed;

      // Add gravity
      particle.speedY += 0.15;

      // Check if particle is still visible
      if (particle.y > canvas.height + 50 || particle.x < -50 || particle.x > canvas.width + 50) {
        return false;
      }

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = Math.max(0, 1 - (elapsed / duration));

      if (particle.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      }

      ctx.restore();
      return true;
    });

    if (confettiParticles.length > 0 && elapsed < duration) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    }
  }

  animateConfetti();

  // Handle window resize
  const handleResize = () => {
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  };
  window.addEventListener('resize', handleResize);

  // Clean up resize listener after celebration ends
  setTimeout(() => {
    window.removeEventListener('resize', handleResize);
  }, 2000);
}

elements.addTaskBtn.addEventListener('click', () => {
  const title = elements.taskTitle.value.trim();
  if (title) {
    const hours = document.getElementById('taskHours')?.value || 0;
    const minutes = document.getElementById('taskMinutes')?.value || 0;
    addTask(title, elements.taskNote.value.trim(), hours, minutes);
    elements.taskTitle.value = '';
    elements.taskNote.value = '';
    if (document.getElementById('taskHours')) document.getElementById('taskHours').value = 0;
    if (document.getElementById('taskMinutes')) document.getElementById('taskMinutes').value = 0;
  }
});

elements.taskTitle.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    elements.addTaskBtn.click();
  }
});

elements.searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  renderTasks();
});

elements.filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    elements.filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.filter = chip.dataset.filter;
    renderTasks();
  });
});

elements.clearAll.addEventListener('click', () => {
  showModal();
});

elements.modalCancel.addEventListener('click', () => {
  hideModal();
});

elements.modalConfirm.addEventListener('click', () => {
  state.tasks = [];
  state.selectedTaskId = null;
  state.pomo.attachedTaskId = null;
  localStorage.removeItem('attachedTaskId');
  saveTasks();
  renderTasks();
  updateCounts();
  updateAttachedTask();
  hideModal();
});

elements.confirmModal.querySelector('.modal-overlay').addEventListener('click', () => {
  hideModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && elements.confirmModal.classList.contains('active')) {
    hideModal();
  }
});

function formatTime(secs) {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, '0')}`;
}

function persistPomoState() {
  safeSetItem('pomoMode', state.pomo.mode);
  safeSetItem('pomoRemainingSecs', state.pomo.secs);
  safeSetItem('pomoRunning', state.pomo.running ? 'true' : 'false');
  safeSetItem('pomoStartedAt', state.pomo.startedAt ? String(state.pomo.startedAt) : '');
  safeSetItem('pomoTargetAt', state.pomo.targetAt ? String(state.pomo.targetAt) : '');
  safeSetItem('pomoDeepworkBase', state.pomo.deepworkBase || 0);
  safeSetItem('roundsDone', state.pomo.roundsDone);
}

function startPomoTicker() {
  stopPomoTicker();
  state.pomo.timer = setInterval(() => {
    syncPomoTimer();
  }, 1000);
}

function stopPomoTicker() {
  if (state.pomo.timer) {
    clearInterval(state.pomo.timer);
    state.pomo.timer = null;
  }
}

function syncPomoTimer() {
  if (state.pomo.running) {
    if (state.pomo.mode === 'deepwork') {
      const base = state.pomo.deepworkBase || 0;
      const elapsed = state.pomo.startedAt ? Math.floor((Date.now() - state.pomo.startedAt) / 1000) : 0;
      state.pomo.secs = base + Math.max(0, elapsed);
    } else if (state.pomo.targetAt) {
      const remaining = Math.round((state.pomo.targetAt - Date.now()) / 1000);
      state.pomo.secs = remaining > 0 ? remaining : 0;
      if (remaining <= 0) {
        state.pomo.running = false;
        state.pomo.startedAt = null;
        state.pomo.targetAt = null;
        stopPomoTicker();
        persistPomoState();
        onPomoComplete();
        return;
      }
    }
  }

  elements.timerDisplay.textContent = formatTime(state.pomo.secs);
  persistPomoState();
}

function initPomo() {
  if (!state.pomo.secs && state.pomo.mode !== 'deepwork') {
    state.pomo.secs = getModeDurationSeconds(state.pomo.mode);
  }
  elements.timerDisplay.textContent = formatTime(state.pomo.secs);
  elements.roundsCount.textContent = state.pomo.roundsDone;

  elements.durWork.value = state.pomo.work;
  elements.durShort.value = state.pomo.short;
  elements.durLong.value = state.pomo.long;
  elements.roundsLong.value = state.pomo.roundsToLong;
  elements.autoNext.checked = state.pomo.autoNext;
  elements.soundOn.checked = state.pomo.soundOn;

  elements.modePills.forEach(p => {
    p.classList.toggle('active', p.dataset.mode === state.pomo.mode);
  });

  if (state.pomo.running) {
    if (state.pomo.mode === 'deepwork') {
      if (!state.pomo.startedAt) {
        state.pomo.startedAt = Date.now();
        state.pomo.deepworkBase = state.pomo.secs;
      }
    } else {
      if (!state.pomo.targetAt) {
        state.pomo.startedAt = Date.now();
        state.pomo.targetAt = state.pomo.startedAt + state.pomo.secs * 1000;
      }
    }
    startPomoTicker();
    syncPomoTimer();
    elements.startPauseBtn.textContent = 'Pause';
  } else {
    stopPomoTicker();
    elements.startPauseBtn.textContent = 'Start';
  }

  updateAttachedTask();
  updateAttachButton();
}

function updateAttachedTask() {
  if (state.pomo.attachedTaskId) {
    const task = state.tasks.find(t => t.id === state.pomo.attachedTaskId);
    if (task) {
      elements.attachedTask.textContent = `Attached to: ${task.title}`;
      elements.pomoHeading.textContent = task.title;
      // Make heading editable when task is attached
      elements.pomoHeading.contentEditable = 'true';
      stopQuoteRotation(); // Stop quote rotation when task is attached
    } else {
      state.pomo.attachedTaskId = null;
      try { localStorage.removeItem('attachedTaskId'); } catch (e) { }
      elements.attachedTask.textContent = 'No task attached';
      startQuoteRotation(); // Resume quote rotation when task is detached
    }
  } else {
    elements.attachedTask.textContent = 'No task attached';
    startQuoteRotation(); // Start quote rotation when no task is attached
  }
}

function updateAttachButton() {
  if (state.selectedTaskId) {
    elements.attachTaskBtn.disabled = false;
    const task = state.tasks.find(t => t.id === state.selectedTaskId);
    if (task) {
      elements.attachTaskBtn.textContent = `Attach "${task.title.substring(0, 20)}${task.title.length > 20 ? '...' : ''}"`;
    }
  } else {
    elements.attachTaskBtn.disabled = true;
    elements.attachTaskBtn.textContent = 'Attach Selected Task';
  }
}

function attachSelectedTask() {
  if (state.selectedTaskId) {
    const task = state.tasks.find(t => t.id === state.selectedTaskId);
    state.pomo.attachedTaskId = state.selectedTaskId;
    safeSetItem('attachedTaskId', state.selectedTaskId);

    // If task has estimated time, set pomodoro timer to that time
    if (task && (task.estimatedHours > 0 || task.estimatedMinutes > 0)) {
      const estimatedMinutes = (task.estimatedHours || 0) * 60 + (task.estimatedMinutes || 0);
      if (estimatedMinutes > 0) {
        // Set work duration to estimated time
        state.pomo.work = estimatedMinutes;
        safeSetItem('durWork', estimatedMinutes);
        if (elements.durWork) elements.durWork.value = estimatedMinutes;

        // Set timer to estimated time if in work mode
        if (state.pomo.mode === 'work' || !state.pomo.running) {
          state.pomo.mode = 'work';
          state.pomo.secs = estimatedMinutes * 60;
          state.pomo.startedAt = null;
          state.pomo.targetAt = null;
          state.pomo.running = false;
          stopPomoTicker();
          elements.timerDisplay.textContent = formatTime(state.pomo.secs);
          // Update active mode pill
          elements.modePills.forEach(p => p.classList.remove('active'));
          const workPill = document.querySelector('[data-mode="work"]');
          if (workPill) workPill.classList.add('active');
          elements.startPauseBtn.textContent = 'Start';
        }
      }
    }

    updateAttachedTask();
    renderTasks();
    persistPomoState();
  }
}


elements.attachTaskBtn.addEventListener('click', attachSelectedTask);

elements.modePills.forEach(pill => {
  pill.addEventListener('click', () => {
    if (state.pomo.running) return;

    elements.modePills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.pomo.mode = pill.dataset.mode;

    state.pomo.secs = getModeDurationSeconds(state.pomo.mode);
    if (state.pomo.mode === 'deepwork') {
      state.pomo.deepworkBase = state.pomo.secs;
    }
    state.pomo.startedAt = null;
    state.pomo.targetAt = null;
    stopPomoTicker();
    elements.startPauseBtn.textContent = 'Start';
    elements.timerDisplay.textContent = formatTime(state.pomo.secs);
    persistPomoState();
  });
});

function startPomo() {
  if (state.pomo.running) return;

  state.pomo.running = true;
  state.pomo.startedAt = Date.now();

  if (state.pomo.mode === 'deepwork') {
    state.pomo.deepworkBase = state.pomo.secs;
    state.pomo.targetAt = null;
  } else {
    state.pomo.targetAt = state.pomo.startedAt + state.pomo.secs * 1000;
  }

  elements.startPauseBtn.textContent = 'Pause';
  startPomoTicker();
  persistPomoState();
  syncPomoTimer();
}

function pausePomo() {
  if (!state.pomo.running) return;
  syncPomoTimer();
  state.pomo.running = false;
  state.pomo.startedAt = null;
  state.pomo.targetAt = null;
  stopPomoTicker();
  elements.startPauseBtn.textContent = 'Start';
  if (state.pomo.mode === 'deepwork') {
    state.pomo.deepworkBase = state.pomo.secs;
  }
  persistPomoState();
}

function resetPomo() {
  stopPomoTicker();
  state.pomo.running = false;
  state.pomo.startedAt = null;
  state.pomo.targetAt = null;
  if (state.pomo.mode === 'work') state.pomo.secs = state.pomo.work * 60;
  else if (state.pomo.mode === 'short') state.pomo.secs = state.pomo.short * 60;
  else if (state.pomo.mode === 'long') state.pomo.secs = state.pomo.long * 60;
  else if (state.pomo.mode === 'deepwork') {
    state.pomo.secs = 0;
    state.pomo.deepworkBase = 0;
  }
  elements.timerDisplay.textContent = formatTime(state.pomo.secs);
  elements.startPauseBtn.textContent = 'Start';
  persistPomoState();
}

function onPomoComplete() {
  if (state.pomo.soundOn) {
    try {
      // Try to create audio context (may require user interaction on mobile)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        // Resume audio context if suspended (required for mobile browsers)
        if (audioContext.currentTime === 0 || audioContext.state === 'suspended') {
          audioContext.resume().catch(() => {
            // Audio context resume failed, continue silently
          });
        }

        const now = audioContext.currentTime;
        const baseTime = now;

        // Create a pleasant multi-tone chime sequence
        // Sequence: C5 -> E5 -> G5 (C major chord, ascending)
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        const durations = [0.15, 0.15, 0.3]; // Each note duration
        let currentTime = baseTime;

        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = 'sine'; // Smooth sine wave
          oscillator.frequency.value = freq;

          // Create a pleasant envelope (fade in and out)
          gainNode.gain.setValueAtTime(0, currentTime);
          gainNode.gain.linearRampToValueAtTime(0.4, currentTime + 0.02); // Quick fade in
          gainNode.gain.linearRampToValueAtTime(0.3, currentTime + durations[index] * 0.7); // Sustain
          gainNode.gain.linearRampToValueAtTime(0, currentTime + durations[index]); // Fade out

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(currentTime);
          oscillator.stop(currentTime + durations[index]);

          // Stagger the notes slightly for a pleasant arpeggio effect
          currentTime += durations[index] * 0.85;
        });
      }
    } catch (e) {
      // Audio playback failed (common on mobile without user interaction)
      console.log('Audio playback not available:', e);
    }
  }

  if (state.pomo.mode === 'work') {
    state.pomo.roundsDone++;
    safeSetItem('roundsDone', state.pomo.roundsDone);
    elements.roundsCount.textContent = state.pomo.roundsDone;

    if (state.pomo.attachedTaskId) {
      const task = state.tasks.find(t => t.id === state.pomo.attachedTaskId);
      if (task && task.status === 'active') {
        // Increment pomodoro sessions
        task.pomoSessions = (task.pomoSessions || 0) + 1;

        // Check if target pomodoros reached
        const target = task.targetPomos || 4;
        if (task.pomoSessions >= target) {
          task.status = 'done';
        }

        saveTasks();
        renderTasks();
        updateCounts();

        // Notify calendar view if open
        window.dispatchEvent(new CustomEvent('tasksUpdated'));
      }
    }

    if (state.pomo.roundsDone % state.pomo.roundsToLong === 0) {
      switchMode('long');
    } else {
      switchMode('short');
    }
  } else {
    switchMode('work');
  }

  persistPomoState();

  if (state.pomo.autoNext) {
    startPomo();
  } else {
    elements.startPauseBtn.textContent = 'Start';
  }
}

function switchMode(mode) {
  state.pomo.mode = mode;
  elements.modePills.forEach(p => p.classList.remove('active'));
  const modeButton = document.querySelector(`[data-mode="${mode}"]`);
  if (modeButton) modeButton.classList.add('active');

  state.pomo.running = false;
  state.pomo.startedAt = null;
  state.pomo.targetAt = null;
  stopPomoTicker();
  elements.startPauseBtn.textContent = 'Start';

  state.pomo.secs = getModeDurationSeconds(mode);
  if (mode === 'deepwork') {
    state.pomo.deepworkBase = state.pomo.secs;
  }

  elements.timerDisplay.textContent = formatTime(state.pomo.secs);
  persistPomoState();
}

elements.startPauseBtn.addEventListener('click', () => {
  if (state.pomo.running) {
    pausePomo();
  } else {
    startPomo();
  }
});

elements.resetBtn.addEventListener('click', resetPomo);

// Function to update timer settings
function updateTimerSettings() {
  const clamp = (n, a, b) => {
    if (isNaN(n) || n === '') return a;
    return Math.max(a, Math.min(b, n));
  };

  // Get and clamp values
  const workValue = clamp(+elements.durWork.value, +elements.durWork.min, +elements.durWork.max);
  const shortValue = clamp(+elements.durShort.value, +elements.durShort.min, +elements.durShort.max);
  const longValue = clamp(+elements.durLong.value, +elements.durLong.min, +elements.durLong.max);
  const roundsValue = clamp(+elements.roundsLong.value, +elements.roundsLong.min, +elements.roundsLong.max);

  // Update input values if they were invalid
  if (+elements.durWork.value !== workValue) elements.durWork.value = workValue;
  if (+elements.durShort.value !== shortValue) elements.durShort.value = shortValue;
  if (+elements.durLong.value !== longValue) elements.durLong.value = longValue;
  if (+elements.roundsLong.value !== roundsValue) elements.roundsLong.value = roundsValue;

  // Update state
  state.pomo.work = workValue;
  state.pomo.short = shortValue;
  state.pomo.long = longValue;
  state.pomo.roundsToLong = roundsValue;

  // Save to localStorage
  safeSetItem('durWork', state.pomo.work);
  safeSetItem('durShort', state.pomo.short);
  safeSetItem('durLong', state.pomo.long);
  safeSetItem('roundsLong', state.pomo.roundsToLong);

  // Update timer display if not running
  if (!state.pomo.running) {
    if (state.pomo.mode === 'work') state.pomo.secs = state.pomo.work * 60;
    else if (state.pomo.mode === 'short') state.pomo.secs = state.pomo.short * 60;
    else if (state.pomo.mode === 'long') state.pomo.secs = state.pomo.long * 60;
    else if (state.pomo.mode === 'deepwork') state.pomo.secs = 0;
    elements.timerDisplay.textContent = formatTime(state.pomo.secs);
  }

  persistPomoState();
}

[elements.durWork, elements.durShort, elements.durLong, elements.roundsLong].forEach(input => {
  // Only validate when user finishes editing (blur) or presses Enter (change)
  // This allows free typing and backspacing without interference
  input.addEventListener('blur', updateTimerSettings);
  input.addEventListener('change', updateTimerSettings);
});

elements.autoNext.addEventListener('change', () => {
  state.pomo.autoNext = elements.autoNext.checked;
  safeSetItem('autoNext', state.pomo.autoNext);
});

// Initialize video background
function initVideoBackground() {
  if (!elements.heroVideo || !elements.heroBg) return;

  const video = elements.heroVideo;
  const bg = elements.heroBg;
  let videoShown = false;
  let userInteracted = false;

  // Function to attempt video playback
  function attemptPlay() {
    if (videoShown) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Video started playing successfully
          if (!videoShown) {
            videoShown = true;
            video.classList.add('loaded');
            bg.classList.remove('video-failed');
          }
        })
        .catch(err => {
          // Autoplay prevented - will try again after user interaction
          if (!userInteracted) {
            // Set up user interaction handler
            const handleInteraction = () => {
              userInteracted = true;
              attemptPlay();
              document.removeEventListener('touchstart', handleInteraction);
              document.removeEventListener('click', handleInteraction);
            };
            document.addEventListener('touchstart', handleInteraction, { once: true });
            document.addEventListener('click', handleInteraction, { once: true });
          }
        });
    }
  }

  // Function to show video when ready
  function showVideo() {
    if (videoShown) return;
    video.classList.add('loaded');
    bg.classList.remove('video-failed');
    attemptPlay();
  }

  // Show video when enough data is loaded to play
  video.addEventListener('canplaythrough', showVideo);

  // Also show when video can start playing (less data needed)
  video.addEventListener('canplay', function () {
    if (!videoShown) {
      showVideo();
    }
  });

  // Handle video loading errors - fallback to image background
  video.addEventListener('error', function (e) {
    console.error('Video failed to load:', e);
    video.style.display = 'none';
    // Show background image fallback
    bg.classList.add('video-failed');
  });

  // Handle successful load - show video as soon as we have data
  video.addEventListener('loadeddata', function () {
    if (video.readyState >= 3 && !videoShown) {
      showVideo();
    }
  });

  // Show video even earlier if we have enough data
  video.addEventListener('loadedmetadata', function () {
    if (video.readyState >= 2 && !videoShown) {
      // Try to show video early if metadata is loaded
      setTimeout(() => {
        if (!videoShown && video.readyState >= 3) {
          showVideo();
        }
      }, 100);
    }
  });

  // Start loading the video immediately
  video.load();

  // If video is already loaded, show it immediately
  if (video.readyState >= 4) {
    showVideo();
  } else if (video.readyState >= 3) {
    // If we have enough data, show it
    showVideo();
  }
}

elements.soundOn.addEventListener('change', () => {
  state.pomo.soundOn = elements.soundOn.checked;
  safeSetItem('soundOn', state.pomo.soundOn);
});

elements.pomoHeading.addEventListener('focus', () => {
  // Only allow editing when a task is attached
  if (!state.pomo.attachedTaskId) {
    // Prevent focus/editing when quotes are showing
    elements.pomoHeading.blur();
    return false;
  }
});

elements.pomoHeading.addEventListener('blur', () => {
  if (state.pomo.attachedTaskId) {
    // Update task title if it was edited
    const task = state.tasks.find(t => t.id === state.pomo.attachedTaskId);
    if (task) {
      const newTitle = elements.pomoHeading.textContent.trim();
      if (newTitle && newTitle !== task.title) {
        task.title = newTitle;
        saveTasks();
        renderTasks();
        updateAttachedTask();
      }
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }

  if (e.key === ' ') {
    e.preventDefault();
    elements.startPauseBtn.click();
  }

  if (e.key === '1') {
    e.preventDefault();
    document.querySelector('[data-mode="work"]').click();
  }

  if (e.key === '2') {
    e.preventDefault();
    document.querySelector('[data-mode="short"]').click();
  }

  if (e.key === '3') {
    e.preventDefault();
    document.querySelector('[data-mode="long"]').click();
  }

  if (e.key === '4') {
    e.preventDefault();
    document.querySelector('[data-mode="deepwork"]').click();
  }

  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    resetPomo();
  }
});

// Listen for task updates from calendar view
window.addEventListener('tasksUpdated', () => {
  loadTasks();
  renderTasks();
  updateCounts();
});

// Also listen for storage changes (for cross-tab sync)
window.addEventListener('storage', () => {
  loadTasks();
  renderTasks();
  updateCounts();
});

function formatDateDisplay(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();

  if (dateStr === todayStr) {
    return 'Today';
  }

  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function updateDateDisplay() {
  const dateDisplay = document.getElementById('currentDateDisplay');
  if (dateDisplay) {
    dateDisplay.textContent = formatDateDisplay(currentViewDate);
  }
}

function initDateNavigation() {
  const prevBtn = document.getElementById('datePrevBtn');
  const nextBtn = document.getElementById('dateNextBtn');
  const todayBtn = document.getElementById('dateTodayBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentViewDate = new Date(currentViewDate);
      currentViewDate.setDate(currentViewDate.getDate() - 1);
      updateDateDisplay();
      loadAvailableHoursForDate();
      renderTasks();
      updateCounts();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentViewDate = new Date(currentViewDate);
      currentViewDate.setDate(currentViewDate.getDate() + 1);
      updateDateDisplay();
      loadAvailableHoursForDate();
      renderTasks();
      updateCounts();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      currentViewDate = new Date();
      currentViewDate.setHours(0, 0, 0, 0);
      updateDateDisplay();
      loadAvailableHoursForDate();
      renderTasks();
      updateCounts();
    });
  }

  // Add event listener for available hours input
  const totalAvailableHoursInput = document.getElementById('totalAvailableHours');
  if (totalAvailableHoursInput) {
    totalAvailableHoursInput.addEventListener('change', saveAvailableHours);
    totalAvailableHoursInput.addEventListener('blur', saveAvailableHours);
    totalAvailableHoursInput.addEventListener('input', () => {
      // Update remaining time in real-time as user types
      updateCounts();
    });
  }

  // Initialize date display
  updateDateDisplay();

  // Load available hours for current date
  loadAvailableHoursForDate();
}

function loadAvailableHoursForDate() {
  const totalAvailableHoursInput = document.getElementById('totalAvailableHours');
  if (!totalAvailableHoursInput) return;

  const dateKey = currentViewDate ? formatDateAsYYYYMMDD(currentViewDate) : formatDateAsYYYYMMDD(new Date());
  const availableHoursKey = `availableHours_${dateKey}`;
  const savedHours = parseFloat(safeGetItem(availableHoursKey, '0')) || 0;

  totalAvailableHoursInput.value = savedHours;
  updateCounts(); // Update remaining time display
}

function startDailyRolloverWatcher() {
  lastKnownSystemDateKey = new Date().toDateString();

  setInterval(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayKey = now.toDateString();

    if (todayKey === lastKnownSystemDateKey) {
      return;
    }

    const previousDay = new Date(now);
    previousDay.setDate(previousDay.getDate() - 1);
    const viewingKey = currentViewDate ? formatDateKey(currentViewDate) : null;
    const previousDayKey = previousDay.toDateString();

    lastKnownSystemDateKey = todayKey;

    if (viewingKey === previousDayKey) {
      currentViewDate = new Date(now);
      updateDateDisplay();
      renderTasks();
    } else {
      renderTasks();
    }

    updateCounts();
    syncPomoTimer();
  }, 60 * 1000);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    syncPomoTimer();
    persistPomoState();
    if (state.pomo.running) {
      stopPomoTicker();
    }
  } else {
    syncPomoTimer();
    if (state.pomo.running) {
      startPomoTicker();
    }
  }
});

window.addEventListener('blur', () => {
  syncPomoTimer();
  persistPomoState();
});

window.addEventListener('focus', () => {
  syncPomoTimer();
  if (state.pomo.running) {
    startPomoTicker();
  }
});

window.addEventListener('beforeunload', () => {
  syncPomoTimer();
  persistPomoState();
});

// Initialize app only when DOM is ready
function initApp() {
  // Check if all critical elements exist
  if (!elements.taskList || !elements.timerDisplay || !elements.pomoHeading) {
    console.error('Critical elements not found, retrying...');
    setTimeout(initApp, 100);
    return;
  }

  loadTasks();
  renderTasks();
  updateCounts();
  initPomo();
  initVideoBackground();
  initDateNavigation();
  startDailyRolloverWatcher();

  // Ensure quote rotation starts after all initialization is complete
  setTimeout(() => {
    // Force clear any stuck attached task to reset to quotes
    if (state.pomo.attachedTaskId) {
      state.pomo.attachedTaskId = null;
      try { localStorage.removeItem('attachedTaskId'); } catch (e) { }
      updateAttachedTask();
    }

    if (!state.pomo.attachedTaskId && elements.pomoHeading) {
      startQuoteRotation();
    }
  }, 100);

}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready
  initApp();
}
