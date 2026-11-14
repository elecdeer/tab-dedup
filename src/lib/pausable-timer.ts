/** Why the timer is currently held. Each reason is tracked separately so they can overlap. */
export type PauseReason = "hover" | "focus";

/** A one-shot timer that can be held for several independent reasons. */
export interface PausableTimer {
  /** Holds the timer for `reason`; the remaining time is kept. */
  pause(reason: PauseReason): void;
  /** Releases `reason`; the timer restarts from the remaining time once no reason is left. */
  resume(reason: PauseReason): void;
  /** Stops the timer for good without calling `onExpire`. */
  cancel(): void;
}

/**
 * Starts a timer that calls `onExpire` after `durationMs` of running time.
 * Time spent while paused (for any reason) does not count.
 */
export function startPausableTimer(durationMs: number, onExpire: () => void): PausableTimer {
  const reasons = new Set<PauseReason>();
  let remaining = durationMs;
  let startedAt = 0;
  let handle: ReturnType<typeof setTimeout> | undefined;
  let done = false;

  const run = (): void => {
    startedAt = Date.now();
    handle = setTimeout(() => {
      done = true;
      handle = undefined;
      onExpire();
    }, remaining);
  };

  const stop = (): void => {
    if (handle === undefined) return;
    clearTimeout(handle);
    handle = undefined;
    remaining = Math.max(0, remaining - (Date.now() - startedAt));
  };

  run();

  return {
    pause(reason) {
      if (done) return;
      reasons.add(reason);
      stop();
    },
    resume(reason) {
      if (done || !reasons.delete(reason) || reasons.size > 0) return;
      run();
    },
    cancel() {
      done = true;
      stop();
    },
  };
}
