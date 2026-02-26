import { useState, useEffect, useCallback } from 'react';

interface TimerState {
  isRunning: boolean;
  elapsedMs: number;
  totalMs: number;
}

export const useTaskTimer = (taskId: string, initialTimeSpentMs: number = 0) => {
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    elapsedMs: 0,
    totalMs: initialTimeSpentMs,
  });

  const STORAGE_KEY = `task_timer_${taskId}`;

  // Load timer state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { startedAt, totalMs } = JSON.parse(stored);
      const now = Date.now();
      const elapsed = now - startedAt + totalMs;
      setTimer({
        isRunning: true,
        elapsedMs: elapsed,
        totalMs: elapsed,
      });
    }
  }, [taskId, STORAGE_KEY]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => ({
          ...prev,
          elapsedMs: prev.elapsedMs + 1000,
          totalMs: prev.totalMs + 1000,
        }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer.isRunning]);

  const startTimer = useCallback(() => {
    const startedAt = Date.now();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        startedAt,
        totalMs: timer.totalMs,
      })
    );
    setTimer((prev) => ({
      ...prev,
      isRunning: true,
      elapsedMs: 0,
    }));
  }, [taskId, timer.totalMs, STORAGE_KEY]);

  const stopTimer = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      elapsedMs: 0,
    }));
    return timer.totalMs;
  }, [taskId, timer.totalMs, STORAGE_KEY]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return {
    ...timer,
    startTimer,
    stopTimer,
    formatTime,
  };
};
