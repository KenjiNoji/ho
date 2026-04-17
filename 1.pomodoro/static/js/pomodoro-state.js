export const MODES = Object.freeze({
    focus: "focus",
    shortBreak: "shortBreak",
    longBreak: "longBreak",
});

export const DEFAULT_DURATIONS = Object.freeze({
    [MODES.focus]: 25 * 60,
    [MODES.shortBreak]: 5 * 60,
    [MODES.longBreak]: 15 * 60,
});

export function createInitialState(overrides = {}) {
    const durations = {
        ...DEFAULT_DURATIONS,
        ...(overrides.durations ?? {}),
    };

    const mode = overrides.mode ?? MODES.focus;

    return {
        mode,
        durations,
        longBreakInterval: overrides.longBreakInterval ?? 4,
        remainingSeconds: overrides.remainingSeconds ?? durations[mode],
        isRunning: overrides.isRunning ?? false,
        endAt: overrides.endAt ?? null,
        completedFocusCount: overrides.completedFocusCount ?? 0,
        lastCompletedMode: overrides.lastCompletedMode ?? null,
    };
}