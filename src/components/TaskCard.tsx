import React, { useState } from 'react';
import { Card, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlayCircleOutlined, StopOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../services/taskService';
import { taskService } from '../services/taskService';
import { notificationService } from '../services/notificationService';
import { useTaskTimer } from '../hooks/useTaskTimer';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  projectId: string;
  onTaskUpdate: (updatedTask: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, projectId, onTaskUpdate }) => {
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

  const timer = useTaskTimer(task.id, task.timeSpentMs || 0);

  const [_isToggling, setIsToggling] = useState(false);

  const handleStartTimer = async () => {
    setIsToggling(true);
    try {
      const updatedTask = await taskService.startTimer(projectId, task.id);
      timer.startTimer();
      onTaskUpdate(updatedTask);
      notificationService.success('Timer started');
    } catch (error) {
      notificationService.error('Failed to start timer');
    } finally {
      setIsToggling(false);
    }
  };

  const handleStopTimer = async () => {
    setIsToggling(true);
    try {
      timer.stopTimer();
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
    transition,
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
        }}
        hoverable={!task.timerActive}
        actions={[
          task.timerActive ? (
            <StopOutlined
              key="stop"
              style={{ color: '#ff4d4f', fontSize: 16 }}
              onClick={(e) => {
                e.stopPropagation();
                handleStopTimer();
              }}
              title="Stop timer"
            />
          ) : (
            <PlayCircleOutlined
              key="play"
              style={{ color: '#52c41a', fontSize: 16 }}
              onClick={(e) => {
                e.stopPropagation();
                handleStartTimer();
              }}
              title="Start timer"
            />
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
            {task.assignedToEmails.map((email) => (
              <Tooltip key={email} title={email}>
                <Tag icon={<UserOutlined />} style={{ fontSize: 11 }}>
                  {email.split('@')[0]}
                </Tag>
              </Tooltip>
            ))}
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
          <div style={{
            fontSize: 12,
            color: task.timerActive ? '#1890ff' : '#8c8c8c',
            fontWeight: task.timerActive ? 600 : 400,
          }}>
            {task.timerActive ? (
              <>{timer.formatTime(timer.totalMs)}</>
            ) : task.timeSpentMs ? (
              <>Total: {formatTotalTime(task.timeSpentMs)}</>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TaskCard;
