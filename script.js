const MODES = {
  work: { label: '作業', minutes: 25 },
  short: { label: '小休憩', minutes: 5 },
  long: { label: '長休憩', minutes: 15 },
};

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

let currentMode = 'work';
let remainingSeconds = MODES[currentMode].minutes * 60;
let intervalId = null;
let pomodoroCount = Number(localStorage.getItem('pomodoroCount') || 0);
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

pomodoroCountEl.textContent = pomodoroCount;

function updateDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timerDisplay.textContent =
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function switchMode(mode) {
  currentMode = mode;
  remainingSeconds = MODES[mode].minutes * 60;
  modeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === mode));
  updateDisplay();
  stopTimer();
}

function startTimer() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    remainingSeconds -= 1;
    updateDisplay();
    if (remainingSeconds <= 0) {
      stopTimer();
      alarmSound.play().catch(() => {});
      if (currentMode === 'work') {
        pomodoroCount += 1;
        pomodoroCountEl.textContent = pomodoroCount;
        localStorage.setItem('pomodoroCount', pomodoroCount);
      }
      switchMode(currentMode === 'work' ? 'short' : 'work');
    }
  }, 1000);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
}

function stopTimer() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetTimer() {
  stopTimer();
  remainingSeconds = MODES[currentMode].minutes * 60;
  updateDisplay();
}

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

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

updateDisplay();
renderTasks();
