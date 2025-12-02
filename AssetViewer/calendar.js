const STORAGE_KEY = 'focuslist_tasks_v1';

// Safe localStorage functions
function safeGetItem(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (e) {
    console.warn('localStorage access failed:', e);
    return defaultValue;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage set failed:', e);
  }
}

// Load tasks from localStorage
function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load tasks:', e);
    return [];
  }
}

// Get tasks for a specific date, sorted by order
function getTasksForDate(tasks, date) {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) {
    return tasks;
  }
  target.setHours(0, 0, 0, 0);
  const targetValue = target.getTime();
  const targetKey = formatDateKey(target);
  const targetYMD = formatDateAsYYYYMMDD(target);

  const filtered = tasks.filter(task => {
    if (task.taskDate && targetYMD) {
      if (task.taskDate === targetYMD) {
        return true;
      }
    }

    const rawDateValue = task?.dateValue;
    if (rawDateValue !== undefined && rawDateValue !== null) {
      const numericValue = typeof rawDateValue === 'string' ? Number(rawDateValue) : rawDateValue;
      if (!Number.isNaN(numericValue) && numericValue === targetValue) {
        return true;
      }
    }

    if (task.date) {
      const normalizedKey = formatDateKey(task.date);
      if (normalizedKey === targetKey) {
        return true;
      }
    }

    const taskDate = new Date(task.createdAt || Date.now());
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === targetValue;
  });

  // Sort by calendarOrder (if exists), then by createdAt
  return filtered.sort((a, b) => {
    const orderA = a.calendarOrder !== undefined ? a.calendarOrder : Infinity;
    const orderB = b.calendarOrder !== undefined ? b.calendarOrder : Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // Fallback to creation time if no order set
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

// Format to YYYY-MM-DD string
function formatDateAsYYYYMMDD(date) {
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) {
    return '';
  }
  normalized.setHours(0, 0, 0, 0);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date as key (YYYY-MM-DD)
function formatDateKey(date) {
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) {
    return new Date().toDateString();
  }
  normalized.setHours(0, 0, 0, 0);
  return normalized.toDateString();
}

// Format date for display
function formatDateDisplay(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

// Get days for current view - center date at top, then future dates below
function getDaysForView(centerDate) {
  const days = [];

  // Normalize center date (today or selected date) to local midnight
  const center = new Date(centerDate);
  center.setHours(0, 0, 0, 0);

  // Always show 7 days: center date at top, followed by 6 future days
  for (let i = 0; i < 7; i++) {
    const date = new Date(center);
    date.setDate(center.getDate() + i);
    days.push(date);
  }

  return days;
}

// Calculate task progress
function calculateProgress(task) {
  // If task is done, show 100% progress
  if (task.status === 'done') {
    return 100;
  }
  
  // If task is cancelled, show 0% progress
  if (task.status === 'cancelled') {
    return 0;
  }
  
  // Calculate based on pomodoro sessions
  const pomoSessions = task.pomoSessions || 0;
  const target = task.targetPomos || 4;
  
  if (target === 0) return 0;
  
  return Math.min(100, Math.round((pomoSessions / target) * 100));
}

// Save tasks and notify other views
function saveTasks() {
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(tasks));
    // Dispatch custom event for list view to listen
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  } catch (e) {
    console.warn('Failed to save tasks:', e);
  }
}

// Update single task element without full re-render
function updateTaskElement(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
  if (!taskEl) return;

  // Ensure calendar grid stays visible
  if (elements.calendarGrid) {
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
    elements.calendarGrid.classList.add('updating');
  }

  // Use requestAnimationFrame to batch DOM updates and prevent flicker
  requestAnimationFrame(() => {
    const isDone = task.status === 'done';
    const isCancelled = task.status === 'cancelled';
    const progress = calculateProgress(task);
    const activePomo = activePomodoros[task.id];
    const workTime = pomoSettings.work * 60;
    const timeLeft = activePomo ? activePomo.timeLeft : (task.pomoTimeLeft || workTime);
    const isRunning = !!activePomo;

    // Update classes without triggering reflow
    const newClasses = ['calendar-task'];
    if (isDone) newClasses.push('done');
    if (isCancelled) newClasses.push('cancelled');
    taskEl.className = newClasses.join(' ');
    
    // Update checkbox
    const checkbox = taskEl.querySelector('.task-checkbox');
    if (checkbox) {
      checkbox.checked = isDone;
      checkbox.disabled = isCancelled;
    }

    // Update task title (only if changed)
    const titleText = taskEl.querySelector('.task-title-text');
    if (titleText && titleText.textContent !== task.title) {
      titleText.textContent = task.title;
    }

    // Update pomo time
    const pomoTime = taskEl.querySelector('.pomo-time');
    if (pomoTime) {
      const newTime = formatTime(timeLeft);
      if (pomoTime.textContent !== newTime) {
        pomoTime.textContent = newTime;
      }
      pomoTime.style.color = isRunning ? 'var(--accent)' : 'var(--text-secondary)';
    }

    // Update progress with smooth animation
    const progressBar = taskEl.querySelector('.task-progress-bar');
    const progressLabel = taskEl.querySelector('.task-progress-label');
    if (progressBar) {
      const currentWidth = parseFloat(progressBar.style.width) || 0;
      const newWidth = progress;
      
      // Only update if changed
      if (Math.abs(currentWidth - newWidth) > 0.1) {
        progressBar.style.width = `${newWidth}%`;
        
        // Add completion effect at 100%
        if (newWidth === 100) {
          progressBar.classList.add('complete');
          setTimeout(() => {
            progressBar.classList.remove('complete');
          }, 600);
        } else {
          progressBar.classList.remove('complete');
        }
      }
    }
    if (progressLabel) {
      const spans = progressLabel.querySelectorAll('span');
      if (spans.length > 1) {
        const newProgress = `${progress}%`;
        if (spans[1].textContent !== newProgress) {
          spans[1].textContent = newProgress;
          // Add pulse animation
          progressLabel.classList.add('updating');
          setTimeout(() => {
            progressLabel.classList.remove('updating');
          }, 400);
        }
      }
    }

    // Update buttons without replacing outerHTML (which causes reflow)
    const startBtn = taskEl.querySelector('.task-pomo-controls button[onclick*="startPomodoro"]');
    if (startBtn) {
      const newIcon = isRunning ? '⏸' : '▶';
      if (startBtn.innerHTML !== newIcon) {
        startBtn.innerHTML = newIcon;
      }
      startBtn.title = isRunning ? 'Pause' : 'Start';
      startBtn.disabled = isCancelled;
    }

    const resetBtn = taskEl.querySelector('.task-pomo-controls button[onclick*="resetPomodoro"]');
    if (resetBtn) {
      resetBtn.disabled = isCancelled;
    }

    // Update cancel/restore button without outerHTML replacement
    const cancelRestoreBtn = taskEl.querySelector('.task-pomo-controls button[onclick*="cancelTask"], .task-pomo-controls button[onclick*="restoreTask"]');
    if (cancelRestoreBtn) {
      const currentOnclick = cancelRestoreBtn.getAttribute('onclick') || '';
      if (isCancelled) {
        // Change to restore button
        if (currentOnclick.includes('cancelTask')) {
          cancelRestoreBtn.setAttribute('onclick', `restoreTask('${task.id}')`);
          cancelRestoreBtn.innerHTML = '↩';
          cancelRestoreBtn.title = 'Restore';
        }
      } else {
        // Change to cancel button
        if (currentOnclick.includes('restoreTask')) {
          cancelRestoreBtn.setAttribute('onclick', `cancelTask('${task.id}')`);
          cancelRestoreBtn.innerHTML = '✕';
          cancelRestoreBtn.title = 'Cancel';
        }
      }
    }
    
    // Ensure grid stays visible after updates
    if (elements.calendarGrid) {
      elements.calendarGrid.style.opacity = '1';
      elements.calendarGrid.style.visibility = 'visible';
    }
  });
}

// Toggle task done status
function toggleTaskDone(taskId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Ensure calendar grid is visible before update
  if (elements.calendarGrid) {
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
  }
  
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = task.status === 'done' ? 'active' : 'done';
    saveTasks();
    tasks = loadTasks();
    // Update immediately without delay
    updateTaskElement(taskId);
  }
  return false;
}

// Delete task with smooth animation
function deleteTask(taskId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Ensure calendar grid is visible before update
  if (elements.calendarGrid) {
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
  }
  
  const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskEl) {
    // Animate out
    taskEl.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    taskEl.style.opacity = '0';
    taskEl.style.transform = 'translateX(-20px)';
    taskEl.style.maxHeight = taskEl.offsetHeight + 'px';
    taskEl.style.marginBottom = '0';
    taskEl.style.paddingTop = '0';
    taskEl.style.paddingBottom = '0';
    
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
      
      // Remove the element
      taskEl.remove();
      
      // If no tasks left in day, show empty message smoothly
      const dayTasks = taskEl.closest('.day-tasks');
      if (dayTasks) {
        const remainingTasks = dayTasks.querySelectorAll('.calendar-task');
        if (remainingTasks.length === 0) {
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'empty-day';
          emptyDiv.textContent = 'No tasks';
          emptyDiv.style.opacity = '0';
          emptyDiv.style.transition = 'opacity 0.3s ease';
          dayTasks.appendChild(emptyDiv);
          setTimeout(() => {
            emptyDiv.style.opacity = '1';
          }, 10);
        }
      }
    }, 300);
  } else {
    // Fallback: if element not found, just update data
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
  }
}

// Cancel task
function cancelTask(taskId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Ensure calendar grid is visible before update
  if (elements.calendarGrid) {
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
  }
  
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'cancelled';
    saveTasks();
    tasks = loadTasks();
    updateTaskElement(taskId);
  }
  return false;
}

// Restore cancelled task
function restoreTask(taskId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Ensure calendar grid is visible before update
  if (elements.calendarGrid) {
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
  }
  
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'active';
    saveTasks();
    tasks = loadTasks();
    updateTaskElement(taskId);
  }
  return false;
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Initialize calendar
let currentViewDate = new Date();
let tasks = loadTasks();
let activePomodoros = {}; // Track active pomodoros per task
let daysToShow = 7; // Show 7 days at a time (today + 3 past + 3 future)

// Pomodoro settings
let pomoSettings = {
  work: +(safeGetItem('durWork', '25')),
  short: +(safeGetItem('durShort', '5')),
  long: +(safeGetItem('durLong', '15')),
  roundsToLong: +(safeGetItem('roundsLong', '4')),
  autoNext: safeGetItem('autoNext', 'false') === 'true',
  soundOn: safeGetItem('soundOn', 'true') !== 'false'
};

const elements = {
  calendarGrid: document.getElementById('calendarGrid'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  todayBtn: document.getElementById('todayBtn'),
  durWork: document.getElementById('durWork'),
  durShort: document.getElementById('durShort'),
  durLong: document.getElementById('durLong'),
  roundsLong: document.getElementById('roundsLong'),
  autoNext: document.getElementById('autoNext'),
  soundOn: document.getElementById('soundOn')
};

// Navigation - show previous dates above
elements.prevBtn.addEventListener('click', () => {
  currentViewDate = new Date(currentViewDate);
  currentViewDate.setDate(currentViewDate.getDate() - 7);
  renderCalendar();
});

// Navigation - show future dates below
elements.nextBtn.addEventListener('click', () => {
  currentViewDate = new Date(currentViewDate);
  currentViewDate.setDate(currentViewDate.getDate() + 7);
  renderCalendar();
});

elements.todayBtn.addEventListener('click', () => {
  currentViewDate = new Date();
  renderCalendar();
});

// Settings handlers
function updateTimerSettings() {
  const clamp = (n, a, b) => {
    if (isNaN(n) || n === '') return a;
    return Math.max(a, Math.min(b, n));
  };
  
  const workValue = clamp(+elements.durWork.value, +elements.durWork.min, +elements.durWork.max);
  const shortValue = clamp(+elements.durShort.value, +elements.durShort.min, +elements.durShort.max);
  const longValue = clamp(+elements.durLong.value, +elements.durLong.min, +elements.durLong.max);
  const roundsValue = clamp(+elements.roundsLong.value, +elements.roundsLong.min, +elements.roundsLong.max);
  
  if (+elements.durWork.value !== workValue) elements.durWork.value = workValue;
  if (+elements.durShort.value !== shortValue) elements.durShort.value = shortValue;
  if (+elements.durLong.value !== longValue) elements.durLong.value = longValue;
  if (+elements.roundsLong.value !== roundsValue) elements.roundsLong.value = roundsValue;
  
  pomoSettings.work = workValue;
  pomoSettings.short = shortValue;
  pomoSettings.long = longValue;
  pomoSettings.roundsToLong = roundsValue;
  
  safeSetItem('durWork', pomoSettings.work);
  safeSetItem('durShort', pomoSettings.short);
  safeSetItem('durLong', pomoSettings.long);
  safeSetItem('roundsLong', pomoSettings.roundsToLong);
}

[elements.durWork, elements.durShort, elements.durLong, elements.roundsLong].forEach(input => {
  input.addEventListener('blur', updateTimerSettings);
  input.addEventListener('change', updateTimerSettings);
});

elements.autoNext.addEventListener('change', () => {
  pomoSettings.autoNext = elements.autoNext.checked;
  safeSetItem('autoNext', pomoSettings.autoNext);
});

elements.soundOn.addEventListener('change', () => {
  pomoSettings.soundOn = elements.soundOn.checked;
  safeSetItem('soundOn', pomoSettings.soundOn);
});

// Initialize settings values
elements.durWork.value = pomoSettings.work;
elements.durShort.value = pomoSettings.short;
elements.durLong.value = pomoSettings.long;
elements.roundsLong.value = pomoSettings.roundsToLong;
elements.autoNext.checked = pomoSettings.autoNext;
elements.soundOn.checked = pomoSettings.soundOn;

// Start Pomodoro for a task
function startPomodoro(taskId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Ensure calendar grid is visible before update
  if (elements.calendarGrid) {
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
  }
  
  if (activePomodoros[taskId]) {
    // Already running, pause it
    clearInterval(activePomodoros[taskId].interval);
    delete activePomodoros[taskId];
    updateTaskElement(taskId);
    return false;
  }

  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const workTime = pomoSettings.work * 60; // Use settings work time
  let timeLeft = task.pomoTimeLeft || workTime;

  activePomodoros[taskId] = {
    timeLeft: timeLeft,
    interval: setInterval(() => {
      activePomodoros[taskId].timeLeft--;
      
      // Update task in storage
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.pomoTimeLeft = activePomodoros[taskId].timeLeft;
        saveTasks();
      }

      // Update display smoothly without re-render
      const timeEl = document.querySelector(`[data-task-id="${taskId}"] .pomo-time`);
      if (timeEl) {
        timeEl.textContent = formatTime(activePomodoros[taskId].timeLeft);
        // Update color if needed
        timeEl.style.color = 'var(--accent)';
      }

      // When timer completes
      if (activePomodoros[taskId].timeLeft <= 0) {
        clearInterval(activePomodoros[taskId].interval);
        delete activePomodoros[taskId];
        
        // Play completion sound if enabled
        if (pomoSettings.soundOn) {
          try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
              const audioContext = new AudioContextClass();
              if (audioContext.currentTime === 0 || audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
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
            console.log('Audio playback not available:', e);
          }
        }
        
        // Increment pomo sessions
        if (task) {
          task.pomoSessions = (task.pomoSessions || 0) + 1;
          delete task.pomoTimeLeft;
          saveTasks();
          tasks = loadTasks(); // Reload
          updateTaskElement(taskId);
        }
      }
    }, 1000)
  };

  // Update the task element smoothly without full re-render
  updateTaskElement(taskId);
}

// Reset Pomodoro for a task
function resetPomodoro(taskId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Ensure calendar grid is visible before update
  if (elements.calendarGrid) {
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
  }
  
  if (activePomodoros[taskId]) {
    clearInterval(activePomodoros[taskId].interval);
    delete activePomodoros[taskId];
  }

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    delete task.pomoTimeLeft;
    saveTasks();
    tasks = loadTasks();
  }

  // Add reset animation
  const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskEl) {
    taskEl.style.animation = 'none';
    setTimeout(() => {
      taskEl.style.animation = 'pulse 0.3s ease';
      updateTaskElement(taskId);
    }, 10);
  } else {
    // Fallback: if element not found, just update data
    // No need to re-render entire calendar
  }
}

// Render calendar with smooth animations
function renderCalendar(animate = true) {
  tasks = loadTasks(); // Reload tasks
  const days = getDaysForView(currentViewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Ensure grid stays visible - never hide it
  if (elements.calendarGrid) {
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
  }

  // Only animate if explicitly requested (e.g., navigation)
  if (animate) {
    // Use a temporary overlay instead of hiding the grid
    elements.calendarGrid.style.transition = 'opacity 0.2s ease';
  } else {
    // No transition for instant updates
    elements.calendarGrid.style.transition = 'none';
  }
  
  const renderContent = () => {
    // Build content first, then replace in one operation
    const newContent = days.map((date, index) => {
      const dateStr = formatDateKey(date);
      const targetYMD = formatDateAsYYYYMMDD(date);
      const dayTasks = getTasksForDate(tasks, date);
      const isToday = dateStr === formatDateKey(today);
      const isPast = date < today;
      const isFuture = date > today;

      return `
        <div class="calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}" 
             style="animation-delay: ${index * 0.05}s;">
        <div class="day-header">
          <div class="day-date">${formatDateDisplay(date)}</div>
        </div>
        <div class="day-tasks">
          ${dayTasks.length > 0 ? dayTasks.map(task => {
            const progress = calculateProgress(task);
            const activePomo = activePomodoros[task.id];
            const workTime = pomoSettings.work * 60;
            const timeLeft = activePomo ? activePomo.timeLeft : (task.pomoTimeLeft || workTime);
            const isRunning = !!activePomo;

            const isDone = task.status === 'done';
            const isCancelled = task.status === 'cancelled';

            return `
              <div class="calendar-task ${isDone ? 'done' : ''} ${isCancelled ? 'cancelled' : ''}" 
                   data-task-id="${task.id}" 
                   data-date-key="${targetYMD}"
                   draggable="true"
                   tabindex="0"
                   role="button"
                   aria-label="Task: ${task.title}">
                <div class="task-header-row">
                  <div class="task-name-row">
                    <input type="checkbox" class="task-checkbox" ${isDone ? 'checked' : ''} ${isCancelled ? 'disabled' : ''} 
                           onchange="toggleTaskDone('${task.id}')" title="${isCancelled ? 'Task cancelled' : 'Mark as done'}">
                    <div class="task-name">
                      ${task.emoji ? `<span class="task-emoji">${task.emoji}</span>` : ''}
                      <span class="task-title-text">${task.title}</span>
                    </div>
                  </div>
                  <div class="task-pomo-controls">
                    <span class="pomo-time" style="color: ${isRunning ? 'var(--accent)' : 'var(--text-secondary)'}">
                      ${formatTime(timeLeft)}
                    </span>
                    <button class="pomo-reset-btn" onclick="resetPomodoro('${task.id}', event)" title="Reset" ${isCancelled ? 'disabled' : ''}>
                      ↻
                    </button>
                    <button class="pomo-reset-btn" onclick="startPomodoro('${task.id}', event)" title="${isRunning ? 'Pause' : 'Start'}" ${isCancelled ? 'disabled' : ''}>
                      ${isRunning ? '⏸' : '▶'}
                    </button>
                    ${isCancelled 
                      ? `<button class="pomo-reset-btn" onclick="restoreTask('${task.id}', event)" title="Restore">↩</button>`
                      : `<button class="pomo-reset-btn" onclick="cancelTask('${task.id}', event)" title="Cancel">✕</button>`
                    }
                    <button class="pomo-reset-btn" onclick="deleteTask('${task.id}', event)" title="Delete" style="color: var(--danger);">🗑</button>
                  </div>
                </div>
                <div class="task-progress">
                  <div class="task-progress-label">
                    <span>Progress</span>
                    <span>${progress}%</span>
                  </div>
                  <div class="task-progress-bar-container">
                    <div class="task-progress-bar" style="width: ${progress}%"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('') : '<div class="empty-day">No tasks</div>'}
        </div>
      </div>
    `;
    }).join('');
    
    // Replace content synchronously to prevent flash
    // Build content in memory first, then replace in one operation
    elements.calendarGrid.innerHTML = newContent;
    
    // Ensure it stays visible immediately
    elements.calendarGrid.style.opacity = '1';
    elements.calendarGrid.style.visibility = 'visible';
    elements.calendarGrid.style.display = 'flex';
    
    // Initialize drag and drop for tasks
    initDragAndDrop();
  };
  
  // Render immediately without delay to prevent black screen
  renderContent();

  // Make functions globally available for onclick handlers
  window.startPomodoro = startPomodoro;
  window.resetPomodoro = resetPomodoro;
  window.toggleTaskDone = toggleTaskDone;
  window.deleteTask = deleteTask;
  window.cancelTask = cancelTask;
  window.restoreTask = restoreTask;
}

// Drag and drop functionality for reordering tasks
let draggedTask = null;
let draggedOverTask = null;

function initDragAndDrop() {
  const taskElements = document.querySelectorAll('.calendar-task[draggable="true"]');
  
  taskElements.forEach(taskEl => {
    taskEl.addEventListener('dragstart', handleDragStart);
    taskEl.addEventListener('dragover', handleDragOver);
    taskEl.addEventListener('dragenter', handleDragEnter);
    taskEl.addEventListener('dragleave', handleDragLeave);
    taskEl.addEventListener('drop', handleDrop);
    taskEl.addEventListener('dragend', handleDragEnd);
    
    // Prevent drag on interactive elements (buttons, checkboxes)
    const interactiveElements = taskEl.querySelectorAll('button, input, .task-pomo-controls');
    interactiveElements.forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      el.draggable = false;
    });
  });
}

function handleDragStart(e) {
  draggedTask = e.target;
  draggedTask.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', draggedTask.outerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  const target = e.target.closest('.calendar-task');
  if (target && target !== draggedTask && target.dataset.dateKey === draggedTask.dataset.dateKey) {
    draggedOverTask = target;
    target.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const target = e.target.closest('.calendar-task');
  if (target) {
    target.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const target = e.target.closest('.calendar-task');
  if (!target || !draggedTask || target === draggedTask) {
    return false;
  }
  
  // Only allow dropping within the same date
  if (target.dataset.dateKey !== draggedTask.dataset.dateKey) {
    return false;
  }
  
  const dayTasksContainer = target.closest('.day-tasks');
  if (!dayTasksContainer) {
    return false;
  }
  
  const allTasks = Array.from(dayTasksContainer.querySelectorAll('.calendar-task'));
  const draggedIndex = allTasks.indexOf(draggedTask);
  const targetIndex = allTasks.indexOf(target);
  
  if (draggedIndex === -1 || targetIndex === -1) {
    return false;
  }
  
  // Reorder in DOM
  if (draggedIndex < targetIndex) {
    dayTasksContainer.insertBefore(draggedTask, target.nextSibling);
  } else {
    dayTasksContainer.insertBefore(draggedTask, target);
  }
  
  // Update order in task data
  const dateKey = draggedTask.dataset.dateKey;
  const reorderedTasks = Array.from(dayTasksContainer.querySelectorAll('.calendar-task'));
  
  reorderedTasks.forEach((taskEl, index) => {
    const taskId = taskEl.dataset.taskId;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.calendarOrder = index;
      // Ensure taskDate is set for proper filtering
      if (!task.taskDate && dateKey) {
        task.taskDate = dateKey;
      }
    }
  });
  
  saveTasks();
  tasks = loadTasks();
  
  return false;
}

function handleDragEnd(e) {
  const taskEl = e.target;
  taskEl.classList.remove('dragging');
  
  // Remove drag-over class from all tasks
  document.querySelectorAll('.calendar-task').forEach(el => {
    el.classList.remove('drag-over');
  });
  
  draggedTask = null;
  draggedOverTask = null;
}

// Listen for task updates from list view
window.addEventListener('tasksUpdated', () => {
  // Don't re-render on external updates - just reload tasks
  // The calendar will update naturally when user interacts
  tasks = loadTasks();
  // Only update if calendar is already rendered
  if (elements.calendarGrid && elements.calendarGrid.children.length > 0) {
    // Update existing task elements instead of full re-render
    tasks.forEach(task => {
      const taskEl = document.querySelector(`[data-task-id="${task.id}"]`);
      if (taskEl) {
        updateTaskElement(task.id);
      }
    });
  }
});

// Also listen for storage changes (for cross-tab sync)
window.addEventListener('storage', () => {
  // Don't re-render on storage sync - just reload tasks
  tasks = loadTasks();
  // Only update if calendar is already rendered
  if (elements.calendarGrid && elements.calendarGrid.children.length > 0) {
    // Update existing task elements instead of full re-render
    tasks.forEach(task => {
      const taskEl = document.querySelector(`[data-task-id="${task.id}"]`);
      if (taskEl) {
        updateTaskElement(task.id);
      }
    });
  }
});

// Initialize app when DOM is ready
function initCalendarApp() {
  // Check if all elements exist
  if (!elements.calendarGrid || !elements.prevBtn || !elements.nextBtn || !elements.todayBtn) {
    console.error('Calendar elements not found, retrying...');
    setTimeout(initCalendarApp, 100);
    return;
  }

  renderCalendar();

  // Refresh every second to update timers
  setInterval(() => {
    Object.keys(activePomodoros).forEach(taskId => {
      const timeEl = document.querySelector(`[data-task-id="${taskId}"] .pomo-time`);
      if (timeEl && activePomodoros[taskId]) {
        timeEl.textContent = formatTime(activePomodoros[taskId].timeLeft);
      }
    });
  }, 1000);

}

// Keyboard shortcuts for calendar view
document.addEventListener('keydown', (e) => {
  // Don't trigger shortcuts when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }

  // Get focused task (if any)
  const focusedTask = document.querySelector('.calendar-task:focus-within');
  if (!focusedTask) return;

  const taskId = focusedTask.dataset.taskId;
  if (!taskId) return;

  // Delete task with Delete key
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    if (confirm('Delete this task?')) {
      deleteTask(taskId);
    }
  }

  // Cancel task with 'X' key
  if (e.key === 'x' || e.key === 'X') {
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== 'cancelled') {
      cancelTask(taskId);
    }
  }

  // Toggle done with Space or Enter
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    toggleTaskDone(taskId);
  }
});

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendarApp);
} else {
  // DOM is already ready
  initCalendarApp();
}

