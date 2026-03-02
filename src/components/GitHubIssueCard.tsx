import React, { useState } from 'react';
import { Card, Tag, Space, Tooltip } from 'antd';
import { GithubOutlined, PlayCircleOutlined, PauseOutlined, StopOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GitHubIssue } from '../services/gitHubService';
import { gitHubService } from '../services/gitHubService';
import { notificationService } from '../services/notificationService';
import { useTaskTimer } from '../hooks/useTaskTimer';

interface GitHubIssueCardProps {
  issue: GitHubIssue;
  draggableId: string;
  projectId: string;
  onIssueUpdate: (updatedIssue: GitHubIssue) => void;
}

const GitHubIssueCard: React.FC<GitHubIssueCardProps> = ({ issue, draggableId, projectId, onIssueUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: draggableId, disabled: issue.timerActive });

  const timer = useTaskTimer(
    issue.timerActive || false,
    issue.timerStartedAt,
    issue.pausedAt,
    issue.sessionActiveWorkMs,
    issue.sessionStartedAt,
    issue.activeWorkMs || 0,
    issue.timeSpentMs || 0
  );

  const [_isToggling, setIsToggling] = useState(false);

  const handleStartTimer = async () => {
    setIsToggling(true);
    try {
      const updated = await gitHubService.startIssueTimer(projectId, issue.id);
      onIssueUpdate(updated);
      notificationService.success('Timer started');
    } catch { notificationService.error('Failed to start timer'); }
    finally { setIsToggling(false); }
  };

  const handlePauseTimer = async () => {
    setIsToggling(true);
    try {
      const updated = await gitHubService.pauseIssueTimer(projectId, issue.id);
      onIssueUpdate(updated);
      notificationService.info('Timer paused');
    } catch { notificationService.error('Failed to pause timer'); }
    finally { setIsToggling(false); }
  };

  const handleResumeTimer = async () => {
    setIsToggling(true);
    try {
      const updated = await gitHubService.resumeIssueTimer(projectId, issue.id);
      onIssueUpdate(updated);
      notificationService.success('Timer resumed');
    } catch { notificationService.error('Failed to resume timer'); }
    finally { setIsToggling(false); }
  };

  const handleStopTimer = async () => {
    setIsToggling(true);
    try {
      const updated = await gitHubService.stopIssueTimer(projectId, issue.id);
      onIssueUpdate(updated);
      notificationService.success('Timer stopped');
    } catch { notificationService.error('Failed to stop timer'); }
    finally { setIsToggling(false); }
  };

  const formatTotalTime = (ms?: number) => {
    if (!ms) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isDragging ? 0.5 : 1,
    cursor: issue.timerActive ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(issue.timerActive ? {} : listeners)}>
      <Card
        size="small"
        style={{
          marginBottom: 12,
          background: issue.timerActive ? '#1a3a3a' : isDragging ? '#1a3a3a' : '#262626',
          border: issue.timerActive ? '2px solid #1890ff' : isDragging ? '2px solid #1890ff' : '1px solid #434343',
          cursor: issue.timerActive ? 'not-allowed' : 'grab',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        hoverable={!issue.timerActive}
        actions={[
          issue.timerActive ? (
            <div key="timer-controls" style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              {timer.isPaused ? (
                <Tooltip title="Resume work">
                  <PlayCircleOutlined
                    style={{ color: '#52c41a', fontSize: 16 }}
                    onClick={(e) => { e.stopPropagation(); handleResumeTimer(); }}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Take a break">
                  <PauseOutlined
                    style={{ color: '#faad14', fontSize: 16 }}
                    onClick={(e) => { e.stopPropagation(); handlePauseTimer(); }}
                  />
                </Tooltip>
              )}
              <Tooltip title="Stop timer">
                <StopOutlined
                  style={{ color: '#ff4d4f', fontSize: 16 }}
                  onClick={(e) => { e.stopPropagation(); handleStopTimer(); }}
                />
              </Tooltip>
            </div>
          ) : issue.boardStatus === 'IN_PROGRESS' ? (
            <Tooltip key="start" title="Start timer">
              <PlayCircleOutlined
                style={{ color: '#52c41a', fontSize: 16 }}
                onClick={(e) => { e.stopPropagation(); handleStartTimer(); }}
              />
            </Tooltip>
          ) : (
            <Tooltip key="start-disabled" title="Timer can only be started for 'In Progress' issues">
              <PlayCircleOutlined
                style={{ color: '#8c8c8c', fontSize: 16, cursor: 'not-allowed' }}
              />
            </Tooltip>
          ),
        ]}
        title={
          <Space size={6} style={{ width: '100%' }}>
            <GithubOutlined style={{ color: '#1890ff', fontSize: 14 }} />
            <span style={{ fontSize: 12, color: '#999' }}>#{issue.gitHubIssueNumber}</span>
          </Space>
        }
        styles={{ body: { padding: '8px' } }}
      >
        <div style={{ marginBottom: 8 }}>
          <a
            href={issue.gitHubUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              wordBreak: 'break-word'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {issue.gitHubTitle}
            <span style={{ marginLeft: 6, fontSize: 11 }}>→</span>
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <Tag
              color={issue.gitHubState === 'open' ? 'green' : 'default'}
              style={{ fontSize: 11 }}
            >
              {issue.gitHubState.toUpperCase()}
            </Tag>
            {issue.gitHubAssignee && (
              <Tag color="blue" style={{ fontSize: 11 }}>
                {issue.gitHubAssignee}
              </Tag>
            )}
          </div>
          <div>
            {issue.timerActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                  <span style={{ color: '#52c41a', fontWeight: 600 }}>
                    {timer.formatTime(timer.activeWorkMs)}
                  </span>
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    {timer.formatTime(Math.max(0, timer.totalElapsedMs - timer.activeWorkMs))}
                  </span>
                </div>
                {timer.isPaused && (
                  <div style={{ fontSize: 10, color: '#faad14', fontWeight: 600 }}>On Break</div>
                )}
              </div>
            ) : (issue.timeSpentMs || issue.activeWorkMs) ? (
              <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#52c41a' }}>
                  {formatTotalTime(issue.activeWorkMs || 0)}
                </span>
                <span style={{ color: '#ff4d4f' }}>
                  {formatTotalTime(Math.max(0, (issue.timeSpentMs || 0) - (issue.activeWorkMs || 0)))}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GitHubIssueCard;
