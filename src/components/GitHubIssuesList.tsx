import React, { useState, useEffect } from 'react';
import { Card, Table, Empty, Button, Spin, Tag, Space, Typography } from 'antd';
import { SyncOutlined, GithubOutlined, LinkOutlined } from '@ant-design/icons';
import { gitHubService } from '../services/gitHubService';
import type { GitHubIssue } from '../services/gitHubService';
import { notificationService } from '../services/notificationService';

const { Text } = Typography;

interface GitHubIssuesListProps {
  projectId: string;
  compact?: boolean;
  onSync?: () => void;
}

const GitHubIssuesList: React.FC<GitHubIssuesListProps> = ({ projectId, compact = false, onSync }) => {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [projectId]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await gitHubService.getGitHubIssues(projectId);
      setIssues(data);
    } catch (error) {
      notificationService.error('Failed to fetch GitHub issues');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await gitHubService.syncGitHubIssues(projectId);
      await fetchIssues();
      if (onSync) onSync();
      notificationService.success('GitHub issues synced');
    } catch (error) {
      notificationService.error('Failed to sync GitHub issues');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
        <Spin size="small" />
      </div>
    );
  }

  const columns = compact
    ? [
        {
          title: '#',
          dataIndex: 'gitHubIssueNumber',
          width: 50,
          render: (num: number) => `#${num}`,
        },
        {
          title: 'Title',
          dataIndex: 'gitHubTitle',
          render: (text: string, record: GitHubIssue) => (
            <a href={record.gitHubUrl} target="_blank" rel="noopener noreferrer" title={text}>
              {text.substring(0, 30)}...
            </a>
          ),
        },
        {
          title: 'State',
          dataIndex: 'gitHubState',
          width: 80,
          render: (state: string) => (
            <Tag color={state === 'open' ? 'green' : 'default'}>
              {state.toUpperCase()}
            </Tag>
          ),
        },
      ]
    : [
        {
          title: '#',
          dataIndex: 'gitHubIssueNumber',
          width: 70,
          render: (num: number) => `#${num}`,
        },
        {
          title: 'Title',
          dataIndex: 'gitHubTitle',
          render: (text: string, record: GitHubIssue) => (
            <a href={record.gitHubUrl} target="_blank" rel="noopener noreferrer">
              {text}
            </a>
          ),
        },
        {
          title: 'State',
          dataIndex: 'gitHubState',
          width: 100,
          filters: [
            { text: 'Open', value: 'open' },
            { text: 'Closed', value: 'closed' },
          ],
          onFilter: (value: boolean | React.Key, record: GitHubIssue) => record.gitHubState === value,
          render: (state: string) => (
            <Tag color={state === 'open' ? 'green' : 'default'}>
              {state.toUpperCase()}
            </Tag>
          ),
        },
        {
          title: 'Assignee',
          dataIndex: 'gitHubAssignee',
          width: 120,
          render: (assignee?: string) => assignee || '-',
        },
      ];

  if (issues.length === 0) {
    return (
      <Card
        style={{
          background: '#1f1f1f',
          border: '1px solid #303030',
          marginBottom: 24,
        }}
      >
        <Empty
          description="No GitHub issues synced"
          style={{ marginTop: 20 }}
        >
          <Button type="primary" onClick={handleSync} loading={syncing}>
            Sync Issues Now
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Card
      style={{
        background: '#1f1f1f',
        border: '1px solid #303030',
        marginBottom: 24,
      }}
      title={
        <Space>
          <GithubOutlined />
          <span>GitHub Issues</span>
          <Text type="secondary">({issues.length})</Text>
        </Space>
      }
      extra={
        <Button
          icon={<SyncOutlined />}
          loading={syncing}
          onClick={handleSync}
          size="small"
        >
          Sync
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={issues}
        rowKey="id"
        pagination={compact ? false : { pageSize: 10 }}
        size={compact ? 'small' : 'middle'}
      />
    </Card>
  );
};

export default GitHubIssuesList;
