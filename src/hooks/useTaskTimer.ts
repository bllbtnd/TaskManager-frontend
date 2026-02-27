import { useState, useEffect, useCallback } from 'react';

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedMs: number;
  activeWorkMs: number;
  totalElapsedMs: number;
}

export const useTaskTimer = (taskId: string, initialTimeSpentMs: number = 0, initialActiveWorkMs: number = 0) => {
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    elapsedMs: 0,
    activeWorkMs: initialActiveWorkMs,
    totalElapsedMs: initialTimeSpentMs,
  });

  const STORAGE_KEY = `task_timer_${taskId}`;

  // Load timer state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { startedAt, totalElapsedMs, activeWorkMs } = JSON.parse(stored);
      const now = Date.now();
      const elapsed = now - startedAt;
      setTimer({
        isRunning: true,
        isPaused: false,
        elapsedMs: elapsed,
        activeWorkMs: activeWorkMs + elapsed,
        totalElapsedMs: totalElapsedMs + elapsed,
      });
    }
  }, [taskId, STORAGE_KEY]);

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (timer.isRunning && !timer.isPaused) {
      interval = setInterval(() => {
        setTimer((prev) => ({
          ...prev,
          elapsedMs: prev.elapsedMs + 1000,
          activeWorkMs: prev.activeWorkMs + 1000,
          totalElapsedMs: prev.totalElapsedMs + 1000,
        }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.isPaused]);

  const startTimer = useCallback(() => {
    const startedAt = Date.now();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        startedAt,
        totalElapsedMs: timer.totalElapsedMs,
        activeWorkMs: timer.activeWorkMs,
      })
    );
    setTimer((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      elapsedMs: 0,
    }));
  }, [taskId, timer.totalElapsedMs, timer.activeWorkMs, STORAGE_KEY]);

  const pauseTimer = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resumeTimer = useCallback(() => {
    const startedAt = Date.now();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        startedAt,
        totalElapsedMs: timer.totalElapsedMs,
        activeWorkMs: timer.activeWorkMs,
      })
    );
    setTimer((prev) => ({
      ...prev,
      isPaused: false,
      elapsedMs: 0,
    }));
  }, [taskId, timer.totalElapsedMs, timer.activeWorkMs, STORAGE_KEY]);

  const stopTimer = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const activeWork = timer.activeWorkMs;
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      elapsedMs: 0,
    }));
    return activeWork;
  }, [taskId, timer.activeWorkMs, STORAGE_KEY]);

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
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
  };
};
