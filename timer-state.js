const MODES = {
  work: { label: '作業', minutes: 25 },
  short: { label: '小休憩', minutes: 5 },
  long: { label: '長休憩', minutes: 15 },
};

const STATE_KEY = 'timerState';

function defaultState() {
  return {
    mode: 'work',
    running: false,
    endTime: null,
    remainingSeconds: MODES.work.minutes * 60,
  };
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATE_KEY));
    if (!raw || !MODES[raw.mode]) return defaultState();
    return { ...defaultState(), ...raw };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function getRemainingSeconds(state) {
  if (!state.running || state.endTime === null) return state.remainingSeconds;
  return Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
