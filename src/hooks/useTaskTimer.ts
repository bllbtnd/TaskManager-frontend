import { useState, useEffect } from 'react';

interface TimerDisplay {
  activeWorkMs: number;
  totalElapsedMs: number;
  isPaused: boolean;
}

export const useTaskTimer = (
  timerActive: boolean,
  timerStartedAt: string | undefined,
  pausedAt: string | undefined,
  sessionActiveWorkMs: number | undefined,
  baseActiveWorkMs: number,
  baseTotalMs: number
) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second when timer is active
  useEffect(() => {
    if (timerActive) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerActive]);

  const calculateTimerDisplay = (): TimerDisplay => {
    if (!timerActive || !timerStartedAt) {
      // Timer not running, show base values
      return {
        activeWorkMs: baseActiveWorkMs,
        totalElapsedMs: baseTotalMs,
        isPaused: false,
      };
    }

    const startTime = new Date(timerStartedAt).getTime();
    const accumulated = sessionActiveWorkMs || 0;

    if (pausedAt) {
      // Paused: show accumulated active work, total from start to pause
      const pauseTime = new Date(pausedAt).getTime();
      const sessionTotal = pauseTime - startTime;
      return {
        activeWorkMs: baseActiveWorkMs + accumulated,
        totalElapsedMs: baseTotalMs + sessionTotal,
        isPaused: true,
      };
    } else {
      // Running: calculate only the current session time
      const elapsedSinceStart = currentTime - startTime;
      return {
        activeWorkMs: baseActiveWorkMs + accumulated + elapsedSinceStart,
        totalElapsedMs: baseTotalMs + elapsedSinceStart,
        isPaused: false,
      };
    }
  };

  const timer = calculateTimerDisplay();

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
    activeWorkMs: timer.activeWorkMs,
    totalElapsedMs: timer.totalElapsedMs,
    isPaused: timer.isPaused,
    formatTime,
  };
};
