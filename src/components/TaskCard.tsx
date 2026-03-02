import React, { useState } from 'react';
import { Card, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlayCircleOutlined, StopOutlined, PauseOutlined, CalendarOutlined, UserOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus } from '../services/taskService';
import { taskService } from '../services/taskService';
import { notificationService } from '../services/notificationService';
import { useTaskTimer } from '../hooks/useTaskTimer';
import type { UserProfile } from '../services/userService';
import type { Project } from '../services/projectService';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  projectId: string;
  onTaskUpdate: (updatedTask: Task) => void;
  currentUser: UserProfile | null;
  project: Project | null;
  statusColumns?: { status: TaskStatus; title: string; color: string }[];
  memberDetails?: Map<string, { firstName: string; lastName: string }>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, projectId, onTaskUpdate, currentUser, project, statusColumns = [], memberDetails = new Map() }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: task.timerActive,
  });

  const timer = useTaskTimer(
    task.timerActive || false,
    task.timerStartedAt,
    task.pausedAt,
    task.sessionActiveWorkMs,
    task.sessionStartedAt,
    task.activeWorkMs || 0,
    task.timeSpentMs || 0
  );

  const [_isToggling, setIsToggling] = useState(false);

  // Check if current user can control the timer (owner or assigned)
  const canControlTimer = currentUser && project && (
    project.ownerId === currentUser.id ||
    (task.assignedToEmails && task.assignedToEmails.includes(currentUser.email))
  );

  // Check if current user can move task (owner or assigned)
  const canMoveTask = currentUser && project && (
    project.ownerId === currentUser.id ||
    (task.assignedToEmails && task.assignedToEmails.includes(currentUser.email))
  );

  // Get current column index
  const currentColumnIndex = statusColumns.findIndex(col => col.status === task.status);
  const canMoveLeft = currentColumnIndex > 0;
  const canMoveRight = currentColumnIndex < statusColumns.length - 1;
  const hasGitHubConnected = !!currentUser?.githubUsername;
  const isGitHubLinkedTask = !!task.linkedGitHubIssueId;

  const handleMoveLeft = async () => {
    if (!canMoveLeft || !projectId) return;
    if (isGitHubLinkedTask && !hasGitHubConnected) {
      notificationService.error('You must connect your GitHub account to move GitHub-linked tasks');
      return;
    }
    const newStatus = statusColumns[currentColumnIndex - 1].status;
    try {
      const updatedTask = await taskService.updateTaskStatus(projectId, task.id, newStatus);
      onTaskUpdate(updatedTask);
      notificationService.success(`Task moved to ${newStatus.replace(/_/g, ' ')}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to move task';
      notificationService.error(errorMsg);
    }
  };

  const handleMoveRight = async () => {
    if (!canMoveRight || !projectId) return;
    if (isGitHubLinkedTask && !hasGitHubConnected) {
      notificationService.error('You must connect your GitHub account to move GitHub-linked tasks');
      return;
    }
    const newStatus = statusColumns[currentColumnIndex + 1].status;
    try {
      const updatedTask = await taskService.updateTaskStatus(projectId, task.id, newStatus);
      onTaskUpdate(updatedTask);
      notificationService.success(`Task moved to ${newStatus.replace(/_/g, ' ')}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to move task';
      notificationService.error(errorMsg);
    }
  };

  const handleStartTimer = async () => {
    setIsToggling(true);
    try {
      const updatedTask = await taskService.startTimer(projectId, task.id);
      onTaskUpdate(updatedTask);
      notificationService.success('Timer started');
    } catch (error) {
      notificationService.error('Failed to start timer');
    } finally {
      setIsToggling(false);
    }
  };

  const handlePauseTimer = async () => {
    setIsToggling(true);
    try {
      const updatedTask = await taskService.pauseTimer(projectId, task.id);
      onTaskUpdate(updatedTask);
      notificationService.info('Timer paused - on break');
    } catch (error) {
      notificationService.error('Failed to pause timer');
    } finally {
      setIsToggling(false);
    }
  };

  const handleResumeTimer = async () => {
    setIsToggling(true);
    try {
      const updatedTask = await taskService.resumeTimer(projectId, task.id);
      onTaskUpdate(updatedTask);
      notificationService.success('Timer resumed');
    } catch (error) {
      notificationService.error('Failed to resume timer');
    } finally {
      setIsToggling(false);
    }
  };

  const handleStopTimer = async () => {
    setIsToggling(true);
    try {
      const updatedTask = await taskService.stopTimer(projectId, task.id);
      onTaskUpdate(updatedTask);
      notificationService.success('Timer stopped');
    } catch (error) {
      notificationService.error('Failed to stop timer');
    } finally {
      setIsToggling(false);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isDragging ? 0.5 : 1,
    cursor: task.timerActive ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
  };

  const formatTotalTime = (ms?: number) => {
    if (!ms) return '0s';
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(task.timerActive ? {} : listeners)}>
      <Card
        size="small"
        style={{
          marginBottom: 12,
          background: task.timerActive ? '#1a3a3a' : '#262626',
          border: task.timerActive ? '2px solid #1890ff' : '1px solid #434343',
          cursor: task.timerActive ? 'not-allowed' : 'grab',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        hoverable={!task.timerActive}
        actions={[
          canMoveTask && canMoveLeft && !(isGitHubLinkedTask && !hasGitHubConnected) ? (
            <Tooltip key="move-left" title="Move to previous column">
              <ArrowLeftOutlined
                style={{ color: '#1890ff', fontSize: 16 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveLeft();
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip 
              key="move-left-disabled"
              title={isGitHubLinkedTask && !hasGitHubConnected ? "Connect GitHub to move this task" : "Cannot move further left"}
            >
              <ArrowLeftOutlined
                style={{ color: '#8c8c8c', fontSize: 16, cursor: 'not-allowed' }}
              />
            </Tooltip>
          ),
          canMoveTask && canMoveRight && !(isGitHubLinkedTask && !hasGitHubConnected) ? (
            <Tooltip key="move-right" title="Move to next column">
              <ArrowRightOutlined
                style={{ color: '#1890ff', fontSize: 16 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveRight();
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip 
              key="move-right-disabled"
              title={isGitHubLinkedTask && !hasGitHubConnected ? "Connect GitHub to move this task" : "Cannot move further right"}
            >
              <ArrowRightOutlined
                style={{ color: '#8c8c8c', fontSize: 16, cursor: 'not-allowed' }}
              />
            </Tooltip>
          ),
          canControlTimer ? (
            task.timerActive ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {timer.isPaused ? (
                  <Tooltip title="Resume work">
                    <PlayCircleOutlined
                      key="resume"
                      style={{ color: '#52c41a', fontSize: 16 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResumeTimer();
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="Take a break (pause timer)">
                    <PauseOutlined
                      key="pause"
                      style={{ color: '#faad14', fontSize: 16 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePauseTimer();
                      }}
                    />
                  </Tooltip>
                )}
                <Tooltip title="Stop timer">
                  <StopOutlined
                    key="stop"
                    style={{ color: '#ff4d4f', fontSize: 16 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStopTimer();
                    }}
                  />
                </Tooltip>
              </div>
            ) : task.status === 'IN_PROGRESS' ? (
              <PlayCircleOutlined
                key="play"
                style={{ color: '#52c41a', fontSize: 16 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTimer();
                }}
                title="Start timer"
              />
            ) : (
              <Tooltip title="Timer can only be started for 'In Progress' tasks">
                <PlayCircleOutlined
                  key="play-disabled"
                  style={{ color: '#8c8c8c', fontSize: 16, cursor: 'not-allowed' }}
                />
              </Tooltip>
            )
          ) : (
            <Tooltip title="Only assigned users or project owner can control timer">
              <PlayCircleOutlined
                key="play-disabled"
                style={{ color: '#8c8c8c', fontSize: 16, cursor: 'not-allowed' }}
              />
            </Tooltip>
          ),
          <EditOutlined
            key="edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          />,
          <DeleteOutlined
            key="delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          />,
        ]}
      >
        <h4 style={{ color: '#fff', marginBottom: 8, marginTop: 0 }}>{task.title}</h4>
        {task.description && (
          <p style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
            {task.description}
          </p>
        )}
        {task.assignedToEmails && task.assignedToEmails.length > 0 && (
          <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {task.assignedToEmails.map((email) => {
              const details = memberDetails.get(email);
              let displayName = email.split('@')[0];
              
              if (details) {
                if (details.firstName && details.lastName) {
                  displayName = `${details.firstName} ${details.lastName}`;
                } else if (details.firstName) {
                  displayName = details.firstName;
                } else if (details.lastName) {
                  displayName = details.lastName;
                }
              }
              
              return (
                <Tooltip key={email} title={email}>
                  <Tag icon={<UserOutlined />} style={{ fontSize: 11 }}>
                    {displayName}
                  </Tag>
                </Tooltip>
              );
            })}
          </div>
        )}
        {task.deadline && (
          <div style={{ marginBottom: 8 }}>
            <Tag
              icon={<CalendarOutlined />}
              color={new Date(task.deadline) < new Date() && task.status !== 'DONE' ? 'red' : 'blue'}
              style={{ fontSize: 11 }}
            >
              {new Date(task.deadline).toLocaleDateString()}
            </Tag>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#595959' }}>
            {new Date(task.createdAt).toLocaleDateString()}
          </div>
          <div>
            {task.timerActive ? (
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
                  <div style={{
                    fontSize: 10,
                    color: '#faad14',
                    fontWeight: 600,
                  }}>
                    On Break
                  </div>
                )}
              </div>
            ) : (task.timeSpentMs || task.activeWorkMs) ? (
              <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#52c41a' }}>
                  {formatTotalTime(task.activeWorkMs || 0)}
                </span>
                <span style={{ color: '#ff4d4f' }}>
                  {formatTotalTime(Math.max(0, (task.timeSpentMs || 0) - (task.activeWorkMs || 0)))}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TaskCard;
