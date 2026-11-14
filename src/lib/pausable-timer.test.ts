import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { startPausableTimer } from "./pausable-timer";

describe("startPausableTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onExpire once the duration has elapsed", () => {
    const onExpire = vi.fn();
    startPausableTimer(1000, onExpire);

    vi.advanceTimersByTime(999);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it("does not count time spent paused", () => {
    const onExpire = vi.fn();
    const timer = startPausableTimer(1000, onExpire);

    vi.advanceTimersByTime(400);
    timer.pause("hover");
    vi.advanceTimersByTime(5000);
    expect(onExpire).not.toHaveBeenCalled();

    timer.resume("hover");
    vi.advanceTimersByTime(599);
    expect(onExpire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it("stays paused until every pause reason is released", () => {
    const onExpire = vi.fn();
    const timer = startPausableTimer(1000, onExpire);

    timer.pause("hover");
    timer.pause("focus");
    timer.resume("hover");
    vi.advanceTimersByTime(5000);
    expect(onExpire).not.toHaveBeenCalled();

    timer.resume("focus");
    vi.advanceTimersByTime(1000);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it("ignores resume for a reason that was never paused", () => {
    const onExpire = vi.fn();
    const timer = startPausableTimer(1000, onExpire);

    vi.advanceTimersByTime(500);
    timer.resume("focus");
    vi.advanceTimersByTime(500);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it("never calls onExpire after cancel", () => {
    const onExpire = vi.fn();
    const timer = startPausableTimer(1000, onExpire);

    timer.cancel();
    timer.pause("hover");
    timer.resume("hover");
    vi.advanceTimersByTime(5000);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
