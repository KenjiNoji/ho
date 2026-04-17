export function createSystemClock() {
    return {
        now() {
            return Date.now();
        },
    };
}

export function createManualClock(initialValue = 0) {
    let current = initialValue;

    return {
        now() {
            return current;
        },
        set(value) {
            current = value;
            return current;
        },
        advanceBy(value) {
            current += value;
            return current;
        },
    };
}