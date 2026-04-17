import { MODES } from "./pomodoro-state.js";


function assertValidMode(mode, durations) {
    if (!(mode in durations)) {
        throw new Error(`Unknown pomodoro mode: ${mode}`);
    }
}


function clampRemainingSeconds(endAt, now) {
    return Math.max(0, Math.ceil((endAt - now) / 1000));
}


export function getRemainingSeconds(state, now) {
    if (!state.isRunning || state.endAt === null) {
        return state.remainingSeconds;
    }

    return clampRemainingSeconds(state.endAt, now);
}


export function startTimer(state, now) {
    if (state.isRunning) {
        return state;
    }

    return {
        ...state,
        isRunning: true,
        endAt: now + state.remainingSeconds * 1000,
    };
}


export function pauseTimer(state, now) {
    if (!state.isRunning || state.endAt === null) {
        return state;
    }

    return {
        ...state,
        isRunning: false,
        endAt: null,
        remainingSeconds: clampRemainingSeconds(state.endAt, now),
    };
}


export function resumeTimer(state, now) {
    return startTimer(state, now);
}


export function resetTimer(state) {
    return {
        ...state,
        isRunning: false,
        endAt: null,
        remainingSeconds: state.durations[state.mode],
    };
}


export function switchMode(state, mode) {
    assertValidMode(mode, state.durations);

    return {
        ...state,
        mode,
        isRunning: false,
        endAt: null,
        remainingSeconds: state.durations[mode],
    };
}


function getNextModeAfterCompletion(state, completedFocusCount) {
    if (state.mode === MODES.focus) {
        const isLongBreakTurn = completedFocusCount % state.longBreakInterval === 0;
        return isLongBreakTurn ? MODES.longBreak : MODES.shortBreak;
    }

    return MODES.focus;
}


export function syncTimer(state, now) {
    if (!state.isRunning || state.endAt === null) {
        return state;
    }

    const remainingSeconds = clampRemainingSeconds(state.endAt, now);

    if (remainingSeconds > 0) {
        return {
            ...state,
            remainingSeconds,
        };
    }

    const completedFocusCount = state.mode === MODES.focus
        ? state.completedFocusCount + 1
        : state.completedFocusCount;
    const nextMode = getNextModeAfterCompletion(state, completedFocusCount);

    return {
        ...state,
        mode: nextMode,
        isRunning: false,
        endAt: null,
        remainingSeconds: state.durations[nextMode],
        completedFocusCount,
        lastCompletedMode: state.mode,
    };
}