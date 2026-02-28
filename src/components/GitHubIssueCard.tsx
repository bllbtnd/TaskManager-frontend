import React from 'react';
import { Card, Tag, Space, Tooltip } from 'antd';
import { GithubOutlined, LockOutlined } from '@ant-design/icons';
import type { GitHubIssue } from '../services/gitHubService';

interface GitHubIssueCardProps {
  issue: GitHubIssue;
}

const GitHubIssueCard: React.FC<GitHubIssueCardProps> = ({ issue }) => {
  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        background: '#262626',
        border: '1px solid #434343',
        cursor: 'default',
      }}
      hoverable={false}
      title={
        <Space size={6} style={{ width: '100%' }}>
          <GithubOutlined style={{ color: '#1890ff', fontSize: 14 }} />
          <span style={{ fontSize: 12, color: '#999' }}>#{issue.gitHubIssueNumber}</span>
          <Tooltip title="Synced from GitHub - read-only">
            <LockOutlined style={{ color: '#999', fontSize: 12 }} />
          </Tooltip>
        </Space>
      }
      bodyStyle={{ padding: '8px' }}
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
  );
};

export default GitHubIssueCard;
