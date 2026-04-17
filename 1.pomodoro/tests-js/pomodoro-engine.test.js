import test from "node:test";
import assert from "node:assert/strict";

import { createManualClock } from "../static/js/pomodoro-clock.js";
import {
    getRemainingSeconds,
    pauseTimer,
    resetTimer,
    resumeTimer,
    startTimer,
    switchMode,
    syncTimer,
} from "../static/js/pomodoro-engine.js";
import { createInitialState, MODES } from "../static/js/pomodoro-state.js";


test("startTimer sets running state and endAt from current time", () => {
    const clock = createManualClock(10_000);
    const state = createInitialState();

    const nextState = startTimer(state, clock.now());

    assert.equal(nextState.isRunning, true);
    assert.equal(nextState.endAt, 10_000 + 25 * 60 * 1000);
    assert.equal(nextState.remainingSeconds, 25 * 60);
});


test("pauseTimer captures remaining seconds and stops the timer", () => {
    const clock = createManualClock(0);
    const state = startTimer(createInitialState(), clock.now());

    clock.advanceBy(70_000);
    const nextState = pauseTimer(state, clock.now());

    assert.equal(nextState.isRunning, false);
    assert.equal(nextState.endAt, null);
    assert.equal(nextState.remainingSeconds, 1430);
});


test("resumeTimer restarts from the paused remaining duration", () => {
    const clock = createManualClock(0);
    const started = startTimer(createInitialState(), clock.now());

    clock.advanceBy(120_000);
    const paused = pauseTimer(started, clock.now());
    const resumed = resumeTimer(paused, clock.now());

    assert.equal(resumed.isRunning, true);
    assert.equal(resumed.endAt, clock.now() + paused.remainingSeconds * 1000);
});


test("resetTimer restores the active mode duration and clears runtime state", () => {
    const customState = createInitialState({
        mode: MODES.shortBreak,
        durations: {
            [MODES.focus]: 1500,
            [MODES.shortBreak]: 300,
            [MODES.longBreak]: 900,
        },
        remainingSeconds: 120,
        isRunning: true,
        endAt: 5000,
    });

    const nextState = resetTimer(customState);

    assert.equal(nextState.isRunning, false);
    assert.equal(nextState.endAt, null);
    assert.equal(nextState.remainingSeconds, 300);
});


test("switchMode stops the timer and loads the selected mode duration", () => {
    const state = createInitialState();

    const nextState = switchMode(state, MODES.longBreak);

    assert.equal(nextState.mode, MODES.longBreak);
    assert.equal(nextState.isRunning, false);
    assert.equal(nextState.remainingSeconds, 15 * 60);
});


test("getRemainingSeconds calculates the countdown from endAt", () => {
    const clock = createManualClock(0);
    const state = startTimer(createInitialState(), clock.now());

    clock.advanceBy(30_000);

    assert.equal(getRemainingSeconds(state, clock.now()), 1470);
});


test("syncTimer transitions completed focus sessions into short break", () => {
    const clock = createManualClock(0);
    const state = startTimer(createInitialState(), clock.now());

    clock.advanceBy(25 * 60 * 1000);
    const nextState = syncTimer(state, clock.now());

    assert.equal(nextState.mode, MODES.shortBreak);
    assert.equal(nextState.isRunning, false);
    assert.equal(nextState.remainingSeconds, 5 * 60);
    assert.equal(nextState.completedFocusCount, 1);
    assert.equal(nextState.lastCompletedMode, MODES.focus);
});


test("syncTimer transitions to long break when focus count reaches interval", () => {
    const clock = createManualClock(0);
    const state = createInitialState({
        longBreakInterval: 2,
        completedFocusCount: 1,
    });
    const started = startTimer(state, clock.now());

    clock.advanceBy(25 * 60 * 1000);
    const nextState = syncTimer(started, clock.now());

    assert.equal(nextState.mode, MODES.longBreak);
    assert.equal(nextState.isRunning, false);
    assert.equal(nextState.remainingSeconds, 15 * 60);
    assert.equal(nextState.completedFocusCount, 2);
});


test("syncTimer transitions completed breaks back to focus without incrementing focus count", () => {
    const clock = createManualClock(0);
    const state = createInitialState({
        mode: MODES.shortBreak,
        completedFocusCount: 3,
        remainingSeconds: 5 * 60,
    });
    const started = startTimer(state, clock.now());

    clock.advanceBy(5 * 60 * 1000);
    const nextState = syncTimer(started, clock.now());

    assert.equal(nextState.mode, MODES.focus);
    assert.equal(nextState.completedFocusCount, 3);
    assert.equal(nextState.remainingSeconds, 25 * 60);
    assert.equal(nextState.lastCompletedMode, MODES.shortBreak);
});


test("syncTimer updates remaining seconds while a session is still in progress", () => {
    const clock = createManualClock(0);
    const state = startTimer(createInitialState(), clock.now());

    clock.advanceBy(15_000);
    const nextState = syncTimer(state, clock.now());

    assert.equal(nextState.mode, MODES.focus);
    assert.equal(nextState.isRunning, true);
    assert.equal(nextState.remainingSeconds, 1485);
});