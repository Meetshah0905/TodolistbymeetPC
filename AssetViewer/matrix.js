const STORAGE_KEY = 'focuslist_tasks_v1';

const CATEGORY_DETAILS = {
  IU: {
    title: 'Quadrant I · Do it first',
    description: 'Important & urgent',
    code: 'IU'
  },
  IBNU: {
    title: 'Quadrant II · Schedule it',
    description: 'Important but not urgent',
    code: 'IBNU'
  },
  NIBU: {
    title: 'Quadrant III · Delegate it',
    description: 'Not important but urgent',
    code: 'NIBU'
  },
  NINU: {
    title: 'Quadrant IV · Delete it',
    description: 'Not important & not urgent',
    code: 'NINU'
  }
};

const CATEGORY_SEQUENCE = Object.keys(CATEGORY_DETAILS);

const matrixState = {
  tasks: [],
  currentDate: normalizeDateInfo(new Date())
};

const elements = {
  grid: document.getElementById('matrixGrid'),
  dateDisplay: document.querySelector('[data-matrix-date]'),
  prevBtn: document.querySelector('[data-matrix-prev]'),
  nextBtn: document.querySelector('[data-matrix-next]'),
  todayBtn: document.querySelector('[data-matrix-today]')
};

document.addEventListener('DOMContentLoaded', initMatrix);

function initMatrix() {
  matrixState.tasks = loadTasks();
  initDateNavigation();
  initAddForms();
  renderMatrix();

  window.addEventListener('tasksUpdated', () => {
    matrixState.tasks = loadTasks();
    renderMatrix();
  });

  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      matrixState.tasks = loadTasks();
      renderMatrix();
    }
  });

}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTask);
  } catch (error) {
    console.warn('Matrix view failed to load tasks', error);
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  } catch (error) {
    console.warn('Matrix view failed to save tasks', error);
  }
}

function normalizeTask(task) {
  if (!task || typeof task !== 'object') return task;
  const clone = { ...task };
  let category = clone.category;

  if (!category && clone.priority) {
    category = clone.priority === 'high' ? 'IU' : clone.priority === 'medium' ? 'IBNU' : 'NINU';
  }

  if (!category || !CATEGORY_DETAILS[category]) {
    category = 'IU';
  }

  clone.category = category;
  delete clone.priority;

  const dateInfo = deriveTaskDateInfo(clone);
  clone.date = dateInfo.key;
  clone.dateValue = dateInfo.value;

  return clone;
}

function renderMatrix() {
  const tasksForDate = matrixState.tasks.filter(task => isTaskOnCurrentDate(task));
  CATEGORY_SEQUENCE.forEach(category => {
    const listEl = document.querySelector(`[data-category-list="${category}"]`);
    const countEl = document.querySelector(`[data-count="${category}"]`);
    const titleInput = document.querySelector(`[data-add-title="${category}"]`);
    const noteInput = document.querySelector(`[data-add-note="${category}"]`);
    if (!listEl || !countEl) return;

    const tasksForCategory = tasksForDate
      .filter(task => (task.category || 'IU') === category)
      .sort(sortByUrgency);

    countEl.textContent = tasksForCategory.length;
    listEl.innerHTML = '';
    if (titleInput) titleInput.dataset.count = String(tasksForCategory.length);
    if (noteInput) noteInput.dataset.count = String(tasksForCategory.length);

    if (tasksForCategory.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'matrix-empty';
      empty.textContent = 'No tasks here yet. Reclassify something from your list to populate this quadrant.';
      listEl.appendChild(empty);
      return;
    }

    tasksForCategory.forEach(task => {
      listEl.appendChild(createTaskCard(task));
    });
  });
}

function sortByUrgency(a, b) {
  const statusValue = statusOrder(a.status) - statusOrder(b.status);
  if (statusValue !== 0) return statusValue;

  const dueDiff = (getDueTimestamp(a) ?? Number.MAX_SAFE_INTEGER) - (getDueTimestamp(b) ?? Number.MAX_SAFE_INTEGER);
  if (dueDiff !== 0) return dueDiff;

  return (a.createdAt || 0) - (b.createdAt || 0);
}

function statusOrder(status) {
  switch (status) {
    case 'active':
      return 0;
    case 'done':
      return 1;
    case 'cancelled':
      return 2;
    default:
      return 0;
  }
}

function getDueTimestamp(task) {
  if (!task.dueDate) return null;
  const date = new Date(task.dueDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

function createTaskCard(task) {
  const card = document.createElement('article');
  card.className = `matrix-task-card status-${task.status}`;

  const header = document.createElement('div');
  header.className = 'matrix-task-header';

  const title = document.createElement('h4');
  title.textContent = task.title || 'Untitled task';
  header.appendChild(title);

  const statusBadge = document.createElement('span');
  statusBadge.className = `matrix-status matrix-status-${task.status || 'active'}`;
  statusBadge.textContent = task.status === 'done' ? 'Completed' : task.status === 'cancelled' ? 'Cancelled' : 'Active';
  header.appendChild(statusBadge);

  card.appendChild(header);

  if (task.note) {
    const note = document.createElement('p');
    note.className = 'matrix-note';
    note.textContent = task.note;
    card.appendChild(note);
  }

  const meta = document.createElement('div');
  meta.className = 'matrix-meta';

  const dueLabel = formatDueLabel(task);
  if (dueLabel) {
    const due = document.createElement('span');
    due.className = `matrix-chip ${dueStatus(task)}`;
    due.textContent = dueLabel;
    meta.appendChild(due);
  }

  if (task.estimateMinutes) {
    const estimate = document.createElement('span');
    estimate.className = 'matrix-chip estimate';
    estimate.textContent = `${task.estimateMinutes} min`;
    meta.appendChild(estimate);
  }

  if (Array.isArray(task.tags) && task.tags.length > 0) {
    task.tags.slice(0, 4).forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'matrix-chip tag';
      tagEl.textContent = `#${tag}`;
      meta.appendChild(tagEl);
    });
  }

  if (meta.childElementCount > 0) {
    card.appendChild(meta);
  }

  const footer = document.createElement('div');
  footer.className = 'matrix-footer';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'matrix-action';
  toggleBtn.textContent = task.status === 'done' ? 'Mark Active' : 'Mark Done';
  toggleBtn.addEventListener('click', event => {
    event.stopPropagation();
    toggleTaskDone(task.id);
  });
  footer.appendChild(toggleBtn);

  if (task.status === 'cancelled') {
    const restoreBtn = document.createElement('button');
    restoreBtn.type = 'button';
    restoreBtn.className = 'matrix-action';
    restoreBtn.textContent = 'Restore';
    restoreBtn.addEventListener('click', event => {
      event.stopPropagation();
      restoreTask(task.id);
    });
    footer.appendChild(restoreBtn);
  } else {
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'matrix-action';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', event => {
      event.stopPropagation();
      cancelTask(task.id);
    });
    footer.appendChild(cancelBtn);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'matrix-action danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', event => {
    event.stopPropagation();
    deleteTask(task.id);
  });
  footer.appendChild(deleteBtn);

  card.appendChild(footer);

  return card;
}

function toggleTaskDone(taskId) {
  const nextTasks = matrixState.tasks.map(task => {
    if (task.id === taskId) {
      const nextStatus = task.status === 'done' ? 'active' : 'done';
      return { ...task, status: nextStatus };
    }
    return task;
  });
  matrixState.tasks = nextTasks;
  saveTasks(nextTasks);
  renderMatrix();
}

function cancelTask(taskId) {
  const nextTasks = matrixState.tasks.map(task => (task.id === taskId ? { ...task, status: 'cancelled' } : task));
  matrixState.tasks = nextTasks;
  saveTasks(nextTasks);
  renderMatrix();
}

function restoreTask(taskId) {
  const nextTasks = matrixState.tasks.map(task => (task.id === taskId ? { ...task, status: 'active' } : task));
  matrixState.tasks = nextTasks;
  saveTasks(nextTasks);
  renderMatrix();
}

function deleteTask(taskId) {
  const nextTasks = matrixState.tasks.filter(task => task.id !== taskId);
  matrixState.tasks = nextTasks;
  saveTasks(nextTasks);
  renderMatrix();
}

function formatDueLabel(task) {
  if (!task.dueDate) return null;
  const date = new Date(task.dueDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function dueStatus(task) {
  if (!task.dueDate) return 'future';
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return 'future';
  const today = new Date();
  const dueDate = new Date(due.toDateString());
  const todayDate = new Date(today.toDateString());
  if (dueDate.getTime() < todayDate.getTime()) return 'overdue';
  if (dueDate.getTime() === todayDate.getTime()) return 'due-today';
  return 'future';
}

function initAddForms() {
  document.querySelectorAll('[data-add-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const category = form.getAttribute('data-add-form');
      const titleInput = form.querySelector(`[data-add-title="${category}"]`);
      const noteInput = form.querySelector(`[data-add-note="${category}"]`);
      if (!titleInput) return;

      const title = titleInput.value.trim();
      const note = noteInput ? noteInput.value.trim() : '';
      if (!title) {
        titleInput.focus();
        return;
      }

      addTaskFromMatrix({
        title,
        note: note || undefined,
        category
      });

      titleInput.value = '';
      if (noteInput) noteInput.value = '';
      titleInput.focus();
    });
  });
}

function addTaskFromMatrix({ title, note, category }) {
  const now = Date.now();
  const day = new Date(matrixState.currentDate.value);
  const payload = {
    id: now.toString(),
    title,
    note,
    category,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    date: day.toDateString(),
    dateValue: day.getTime(),
    pomoSessions: 0,
    targetPomos: 4
  };

  const tasks = [...matrixState.tasks, payload];
  matrixState.tasks = tasks;
  saveTasks(tasks);
  renderMatrix();
}

function deriveTaskDateInfo(task) {
  if (task.dateValue !== undefined && task.dateValue !== null && !Number.isNaN(Number(task.dateValue))) {
    const info = normalizeDateInfo(Number(task.dateValue));
    return info;
  }

  if (task.date) {
    return normalizeDateInfo(task.date);
  }

  if (task.createdAt) {
    return normalizeDateInfo(task.createdAt);
  }

  return normalizeDateInfo(new Date());
}

function initDateNavigation() {
  updateDateDisplay();
  elements.prevBtn?.addEventListener('click', () => {
    const previous = new Date(matrixState.currentDate.value);
    previous.setDate(previous.getDate() - 1);
    matrixState.currentDate = normalizeDateInfo(previous);
    updateDateDisplay();
    renderMatrix();
  });

  elements.nextBtn?.addEventListener('click', () => {
    const next = new Date(matrixState.currentDate.value);
    next.setDate(next.getDate() + 1);
    matrixState.currentDate = normalizeDateInfo(next);
    updateDateDisplay();
    renderMatrix();
  });

  elements.todayBtn?.addEventListener('click', () => {
    matrixState.currentDate = normalizeDateInfo(new Date());
    updateDateDisplay();
    renderMatrix();
  });
}

function updateDateDisplay() {
  if (!elements.dateDisplay) return;
  elements.dateDisplay.textContent = formatDateLabel(matrixState.currentDate);
}

function formatDateLabel(dateInfo) {
  const today = normalizeDateInfo(new Date());
  if (dateInfo.value === today.value) {
    return 'Today';
  }

  const yesterday = new Date(today.value);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateInfo.value === normalizeDateInfo(yesterday).value) {
    return 'Yesterday';
  }

  const tomorrow = new Date(today.value);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateInfo.value === normalizeDateInfo(tomorrow).value) {
    return 'Tomorrow';
  }

  return dateInfo.date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function normalizeDateInfo(source) {
  const base = new Date(source);
  if (Number.isNaN(base.getTime())) {
    return normalizeDateInfo(new Date());
  }
  base.setHours(0, 0, 0, 0);
  return {
    date: base,
    value: base.getTime(),
    key: base.toDateString()
  };
}

function isTaskOnCurrentDate(task) {
  if (!task) return false;
  const target = matrixState.currentDate;

  if (task.dateValue !== undefined && task.dateValue !== null) {
    const numeric = typeof task.dateValue === 'string' ? Number(task.dateValue) : task.dateValue;
    if (!Number.isNaN(numeric) && numeric === target.value) {
      return true;
    }
  }

  if (task.date) {
    const key = formatDateKey(task.date);
    if (key === target.key) {
      return true;
    }
  }

  if (task.createdAt) {
    const created = normalizeDateInfo(task.createdAt);
    if (created.value === target.value) {
      return true;
    }
  }

  return false;
}

function formatDateKey(date) {
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) {
    return normalizeDateInfo(new Date()).key;
  }
  normalized.setHours(0, 0, 0, 0);
  return normalized.toDateString();
}
