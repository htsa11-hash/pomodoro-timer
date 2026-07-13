const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const pomodoroCountEl = document.getElementById('pomodoroCount');
const alarmSound = document.getElementById('alarmSound');

let state = loadState();
let tickId = null;
let pomodoroCount = Number(localStorage.getItem('pomodoroCount') || 0);
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

pomodoroCountEl.textContent = pomodoroCount;

function render() {
  const remaining = getRemainingSeconds(state);
  timerDisplay.textContent = formatTime(remaining);
  modeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === state.mode));
  startBtn.disabled = state.running;
  pauseBtn.disabled = !state.running;
}

function tick() {
  const remaining = getRemainingSeconds(state);
  if (remaining <= 0 && state.running) {
    handleFinish();
    return;
  }
  render();
}

function handleFinish() {
  stopTimer();
  alarmSound.play().catch(() => {});
  if (state.mode === 'work') {
    pomodoroCount += 1;
    pomodoroCountEl.textContent = pomodoroCount;
    localStorage.setItem('pomodoroCount', pomodoroCount);
  }
  switchMode(state.mode === 'work' ? 'short' : 'work');
}

function switchMode(mode) {
  state = { mode, running: false, endTime: null, remainingSeconds: MODES[mode].minutes * 60 };
  saveState(state);
  render();
}

function startTimer() {
  if (state.running) return;
  const remaining = getRemainingSeconds(state);
  state = { ...state, running: true, endTime: Date.now() + remaining * 1000 };
  saveState(state);
  render();
}

function stopTimer() {
  const remaining = getRemainingSeconds(state);
  state = { ...state, running: false, endTime: null, remainingSeconds: remaining };
  saveState(state);
  render();
}

function resetTimer() {
  state = { ...state, running: false, endTime: null, remainingSeconds: MODES[state.mode].minutes * 60 };
  saveState(state);
  render();
}

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

window.addEventListener('storage', (e) => {
  if (e.key === 'timerState') {
    state = loadState();
    render();
  }
  if (e.key === 'pomodoroCount') {
    pomodoroCount = Number(e.newValue || 0);
    pomodoroCountEl.textContent = pomodoroCount;
  }
});

tickId = setInterval(tick, 1000);

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    if (task.done) li.classList.add('done');

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const doneBtn = document.createElement('button');
    doneBtn.textContent = task.done ? '↩️' : '✅';
    doneBtn.title = task.done ? '未完了に戻す' : '完了にする';
    doneBtn.addEventListener('click', () => {
      tasks[index].done = !tasks[index].done;
      saveTasks();
      renderTasks();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = '削除';
    deleteBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    actions.appendChild(doneBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(span);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ text, done: false });
  taskInput.value = '';
  saveTasks();
  renderTasks();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

render();
renderTasks();
