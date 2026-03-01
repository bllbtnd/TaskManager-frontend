import { useState, useEffect } from 'react';

interface TimerDisplay {
  activeWorkMs: number;
  totalElapsedMs: number;
  isPaused: boolean;
}

/**
 * Parse a server date string as UTC.
 * The backend uses LocalDateTime (no timezone) but the server runs in UTC.
 * Without a 'Z' suffix, JS Date() interprets it as local time, causing offset errors.
 */
const parseServerDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  // If it already has timezone info, parse as-is
  if (dateStr.endsWith('Z') || dateStr.includes('+') || /\d{2}:\d{2}:\d{2}-/.test(dateStr)) {
    return new Date(dateStr).getTime();
  }
  // Treat as UTC
  return new Date(dateStr + 'Z').getTime();
};

export const useTaskTimer = (
  timerActive: boolean,
  timerStartedAt: string | undefined,
  pausedAt: string | undefined,
  sessionActiveWorkMs: number | undefined,
  sessionStartedAt: string | undefined,
  baseActiveWorkMs: number,
  baseTotalMs: number
) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second when timer is active (including paused)
  useEffect(() => {
    if (timerActive) {
      setCurrentTime(Date.now());
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

    const lastResumeTime = parseServerDate(timerStartedAt);
    const originalStart = sessionStartedAt ? parseServerDate(sessionStartedAt) : lastResumeTime;
    const accumulated = sessionActiveWorkMs || 0;

    if (pausedAt) {
      // Paused: active work is frozen, but total elapsed keeps ticking
      return {
        activeWorkMs: baseActiveWorkMs + accumulated,
        totalElapsedMs: baseTotalMs + (currentTime - originalStart),
        isPaused: true,
      };
    } else {
      // Running: current active segment = now - last resume time
      const currentActiveSegment = currentTime - lastResumeTime;
      // Total elapsed from original session start to now
      const sessionTotal = currentTime - originalStart;
      return {
        activeWorkMs: baseActiveWorkMs + accumulated + currentActiveSegment,
        totalElapsedMs: baseTotalMs + sessionTotal,
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
