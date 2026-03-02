import React, { useState } from 'react';
import { Card, Tag, Space, Tooltip, Modal, Form, Input, Button } from 'antd';
import { GithubOutlined, PlayCircleOutlined, PauseOutlined, StopOutlined, EditOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GitHubIssue } from '../services/gitHubService';
import type { TaskStatus } from '../services/taskService';
import { gitHubService } from '../services/gitHubService';
import { notificationService } from '../services/notificationService';
import { useTaskTimer } from '../hooks/useTaskTimer';

interface GitHubIssueCardProps {
  issue: GitHubIssue;
  draggableId: string;
  projectId: string;
  onIssueUpdate: (updatedIssue: GitHubIssue) => void;
  statusColumns?: { status: TaskStatus; title: string; color: string }[];
}

const GitHubIssueCard: React.FC<GitHubIssueCardProps> = ({ issue, draggableId, projectId, onIssueUpdate, statusColumns = [] }) => {
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Get current column index
  const currentStatus = issue.boardStatus || 'TO_DO';
  const currentColumnIndex = statusColumns.findIndex(col => col.status === currentStatus);
  const canMoveLeft = currentColumnIndex > 0;
  const canMoveRight = currentColumnIndex < statusColumns.length - 1;

  const handleMoveLeft = async () => {
    if (!canMoveLeft) return;
    const newStatus = statusColumns[currentColumnIndex - 1].status;
    const targetState: 'open' | 'closed' = newStatus === 'DONE' ? 'closed' : 'open';
    try {
      await gitHubService.updateGitHubIssueStatus(projectId, issue.id, targetState, newStatus);
      onIssueUpdate({ ...issue, gitHubState: targetState, boardStatus: newStatus });
      notificationService.success(`Issue moved to ${newStatus.replace(/_/g, ' ')}`);
    } catch (error) {
      notificationService.error('Failed to move issue');
    }
  };

  const handleMoveRight = async () => {
    if (!canMoveRight) return;
    const newStatus = statusColumns[currentColumnIndex + 1].status;
    const targetState: 'open' | 'closed' = newStatus === 'DONE' ? 'closed' : 'open';
    try {
      await gitHubService.updateGitHubIssueStatus(projectId, issue.id, targetState, newStatus);
      onIssueUpdate({ ...issue, gitHubState: targetState, boardStatus: newStatus });
      notificationService.success(`Issue moved to ${newStatus.replace(/_/g, ' ')}`);
    } catch (error) {
      notificationService.error('Failed to move issue');
    }
  };

  const handleEditClick = () => {
    form.setFieldsValue({
      activeWorkMs: issue.activeWorkMs ? Math.floor(issue.activeWorkMs / 1000) : 0,
      idleTimeMs: issue.timeSpentMs && issue.activeWorkMs ? Math.floor((issue.timeSpentMs - issue.activeWorkMs) / 1000) : 0,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values: any) => {
    try {
      const activeWorkMs = (values.activeWorkMs || 0) * 1000;
      const idleTimeMs = (values.idleTimeMs || 0) * 1000;
      const timeSpentMs = activeWorkMs + idleTimeMs;

      await gitHubService.updateGitHubIssueStatus(
        projectId,
        issue.id,
        issue.gitHubState,
        issue.boardStatus || 'TO_DO',
        timeSpentMs,
        activeWorkMs
      );
      
      // Merge the time updates with the issue
      onIssueUpdate({ ...issue, timeSpentMs, activeWorkMs });
      notificationService.success('Issue time updated successfully');
      setEditModalVisible(false);
    } catch (error) {
      notificationService.error('Failed to update issue time');
    }
  };

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
          canMoveLeft ? (
            <Tooltip key="move-left" title="Move to previous column">
              <ArrowLeftOutlined
                style={{ color: '#1890ff', fontSize: 16 }}
                onClick={(e) => { e.stopPropagation(); handleMoveLeft(); }}
              />
            </Tooltip>
          ) : (
            <ArrowLeftOutlined
              key="move-left-disabled"
              style={{ color: '#8c8c8c', fontSize: 16, cursor: 'not-allowed' }}
            />
          ),
          canMoveRight ? (
            <Tooltip key="move-right" title="Move to next column">
              <ArrowRightOutlined
                style={{ color: '#1890ff', fontSize: 16 }}
                onClick={(e) => { e.stopPropagation(); handleMoveRight(); }}
              />
            </Tooltip>
          ) : (
            <ArrowRightOutlined
              key="move-right-disabled"
              style={{ color: '#8c8c8c', fontSize: 16, cursor: 'not-allowed' }}
            />
          ),
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
          <Tooltip key="edit" title="Edit time">
            <EditOutlined
              style={{ fontSize: 16 }}
              onClick={(e) => { e.stopPropagation(); handleEditClick(); }}
            />
          </Tooltip>,
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

      <Modal
        title="Edit Issue Time"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSaveEdit} layout="vertical">
          <Form.Item 
            name="activeWorkMs" 
            label="Active Work Time (seconds)"
            tooltip="Time spent actively working on this issue"
          >
            <Input type="number" min={0} placeholder="0" />
          </Form.Item>

          <Form.Item 
            name="idleTimeMs" 
            label="Idle Time (seconds)"
            tooltip="Time spent on breaks while timer was running"
          >
            <Input type="number" min={0} placeholder="0" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GitHubIssueCard;
