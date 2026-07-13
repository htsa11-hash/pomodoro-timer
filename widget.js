const widgetMode = document.getElementById('widgetMode');
const widgetDisplay = document.getElementById('widgetDisplay');
const toggleBtn = document.getElementById('widgetToggleBtn');
const resetBtn = document.getElementById('widgetResetBtn');

let state = loadState();

function render() {
  widgetMode.textContent = MODES[state.mode].label;
  widgetDisplay.textContent = formatTime(getRemainingSeconds(state));
  toggleBtn.textContent = state.running ? '一時停止' : '開始';
}

function tick() {
  if (state.running && getRemainingSeconds(state) <= 0) {
    state = { ...state, running: false, endTime: null, remainingSeconds: 0 };
    saveState(state);
  }
  render();
}

toggleBtn.addEventListener('click', () => {
  if (state.running) {
    state = { ...state, running: false, endTime: null, remainingSeconds: getRemainingSeconds(state) };
  } else {
    state = { ...state, running: true, endTime: Date.now() + getRemainingSeconds(state) * 1000 };
  }
  saveState(state);
  render();
});

resetBtn.addEventListener('click', () => {
  state = { ...state, running: false, endTime: null, remainingSeconds: MODES[state.mode].minutes * 60 };
  saveState(state);
  render();
});

window.addEventListener('storage', (e) => {
  if (e.key === 'timerState') {
    state = loadState();
    render();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

setInterval(tick, 1000);
render();
