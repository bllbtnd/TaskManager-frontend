import React from 'react';
import { Card, Tag, Space, Tooltip } from 'antd';
import { GithubOutlined, LockOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GitHubIssue } from '../services/gitHubService';

interface GitHubIssueCardProps {
  issue: GitHubIssue;
  draggableId: string;
}

const GitHubIssueCard: React.FC<GitHubIssueCardProps> = ({ issue, draggableId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: draggableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        style={{
          marginBottom: 12,
          background: '#262626',
          border: '1px solid #434343',
          cursor: 'grab',
        }}
        hoverable
        title={
          <Space size={6} style={{ width: '100%' }}>
            <GithubOutlined style={{ color: '#1890ff', fontSize: 14 }} />
            <span style={{ fontSize: 12, color: '#999' }}>#{issue.gitHubIssueNumber}</span>
            <Tooltip title="Drag to change status">
              <LockOutlined style={{ color: '#999', fontSize: 12 }} />
            </Tooltip>
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
        </div>
      </Card>
    </div>
  );
};

export default GitHubIssueCard;
