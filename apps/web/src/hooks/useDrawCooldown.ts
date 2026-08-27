import { useCallback, useEffect, useRef, useState } from "react";

const TICK_MS = 100;

export function useDrawCooldown(durationMs: number, onExpire: () => void) {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const deadlineRef = useRef<number | null>(null);
  onExpireRef.current = onExpire;

  const clearTimerIds = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  function cancelTimer() {
    generationRef.current += 1;
    clearTimerIds();
  }

  const paused = pausedMs !== null;
  const remainingMs = paused
    ? pausedMs
    : deadline === null
      ? 0
      : Math.max(0, deadline - now);
  const active = paused || deadline !== null;

  useEffect(() => {
    if (deadline === null) return;
    const generation = generationRef.current;
    intervalRef.current = window.setInterval(() => setNow(Date.now()), TICK_MS);
    const wait = Math.max(0, deadline - Date.now());
    timeoutRef.current = window.setTimeout(() => {
      if (generation !== generationRef.current) return;
      timeoutRef.current = null;
      deadlineRef.current = null;
      setDeadline(null);
      onExpireRef.current();
    }, wait);
    return () => clearTimerIds();
  }, [deadline, clearTimerIds]);

  return {
    active,
    paused,
    remainingMs,
    remainingSec: remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0,
    progress: durationMs <= 0 ? 0 : remainingMs / durationMs,
    start: () => {
      cancelTimer();
      const t = Date.now();
      const next = t + durationMs;
      deadlineRef.current = next;
      setPausedMs(null);
      setNow(t);
      setDeadline(next);
    },
    clear: () => {
      cancelTimer();
      deadlineRef.current = null;
      setDeadline(null);
      setPausedMs(null);
    },
    pause: () => {
      if (deadlineRef.current === null) return;
      cancelTimer();
      setPausedMs(Math.max(0, deadlineRef.current - Date.now()));
      deadlineRef.current = null;
      setDeadline(null);
    },
    resume: () => {
      if (pausedMs === null) return;
      cancelTimer();
      const t = Date.now();
      const next = t + pausedMs;
      deadlineRef.current = next;
      setNow(t);
      setDeadline(next);
      setPausedMs(null);
    },
  };
}
