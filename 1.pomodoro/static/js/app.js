import { createSystemClock } from "./pomodoro-clock.js";
import {
    pauseTimer,
    resetTimer,
    resumeTimer,
    startTimer,
    switchMode,
    syncTimer,
} from "./pomodoro-engine.js";
import { createInitialState, MODES } from "./pomodoro-state.js";


const MODE_META = {
    [MODES.focus]: {
        label: "Focus Session",
        caption: "Stay with one task until the bell rings.",
    },
    [MODES.shortBreak]: {
        label: "Short Break",
        caption: "Take a quick breather and reset your focus.",
    },
    [MODES.longBreak]: {
        label: "Long Break",
        caption: "Step back and recharge before the next cycle.",
    },
};


function formatTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}


function getModeButtonLabel(mode) {
    switch (mode) {
        case MODES.focus:
            return "Focus";
        case MODES.shortBreak:
            return "Short Break";
        case MODES.longBreak:
            return "Long Break";
        default:
            return mode;
    }
}


function mountPomodoroApp() {
    const modeLabel = document.querySelector('[data-testid="mode-label"]');
    const timeDisplay = document.querySelector('[data-testid="time-display"]');
    const timerCaption = document.querySelector('[data-testid="timer-caption"]');
    const todaySessions = document.querySelector('[data-testid="today-sessions"]');
    const nextLongBreak = document.querySelector('[data-testid="next-long-break"]');
    const currentCycle = document.querySelector('[data-testid="current-cycle"]');
    const startButton = document.querySelector('[data-action="start"]');
    const pauseButton = document.querySelector('[data-action="pause"]');
    const resetButton = document.querySelector('[data-action="reset"]');
    const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));

    if (
        !modeLabel ||
        !timeDisplay ||
        !timerCaption ||
        !todaySessions ||
        !nextLongBreak ||
        !currentCycle ||
        !startButton ||
        !pauseButton ||
        !resetButton ||
        modeButtons.length === 0
    ) {
        return;
    }

    const clock = createSystemClock();
    let state = createInitialState();

    function updateHeader() {
        const meta = MODE_META[state.mode];
        modeLabel.textContent = meta.label;
        timerCaption.textContent = meta.caption;
    }

    function updateTimerDisplay() {
        timeDisplay.textContent = formatTime(state.remainingSeconds);
    }

    function updateModeButtons() {
        modeButtons.forEach((button) => {
            const isSelected = button.dataset.mode === state.mode;
            button.classList.toggle("is-active", isSelected);
            button.setAttribute("aria-selected", String(isSelected));
        });
    }

    function updateControlButtons() {
        if (state.isRunning) {
            startButton.textContent = "Running";
            startButton.disabled = true;
        } else if (state.remainingSeconds < state.durations[state.mode]) {
            startButton.textContent = "Resume";
            startButton.disabled = false;
        } else {
            startButton.textContent = "Start";
            startButton.disabled = false;
        }

        pauseButton.disabled = !state.isRunning;
        resetButton.disabled = false;
    }

    function updateProgress() {
        todaySessions.textContent = `${state.completedFocusCount} sessions`;

        const progressInCycle = state.completedFocusCount % state.longBreakInterval;
        const cycleIndex = progressInCycle + 1;
        currentCycle.textContent = `Focus ${cycleIndex}`;

        const remainingToLongBreak = state.longBreakInterval - progressInCycle;
        if (remainingToLongBreak === state.longBreakInterval) {
            nextLongBreak.textContent = `${state.longBreakInterval} more focus`;
        } else {
            nextLongBreak.textContent = `${remainingToLongBreak} more focus`;
        }

        if (state.mode === MODES.longBreak) {
            nextLongBreak.textContent = "Long break in progress";
        }
    }

    function render() {
        updateHeader();
        updateTimerDisplay();
        updateModeButtons();
        updateControlButtons();
        updateProgress();
    }

    function runWithSync(updateFn) {
        state = syncTimer(state, clock.now());
        state = updateFn(state);
        render();
    }

    startButton.addEventListener("click", () => {
        runWithSync((currentState) => {
            if (currentState.remainingSeconds < currentState.durations[currentState.mode]) {
                return resumeTimer(currentState, clock.now());
            }

            return startTimer(currentState, clock.now());
        });
    });

    pauseButton.addEventListener("click", () => {
        runWithSync((currentState) => pauseTimer(currentState, clock.now()));
    });

    resetButton.addEventListener("click", () => {
        runWithSync((currentState) => resetTimer(currentState));
    });

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const nextMode = button.dataset.mode;
            if (!nextMode) {
                return;
            }

            runWithSync((currentState) => switchMode(currentState, nextMode));
        });
    });

    window.setInterval(() => {
        const nextState = syncTimer(state, clock.now());
        if (nextState !== state) {
            state = nextState;
            render();
        }
    }, 250);

    render();
    console.log("Pomodoro stage 4 controls are ready.");
}


document.addEventListener("DOMContentLoaded", mountPomodoroApp);