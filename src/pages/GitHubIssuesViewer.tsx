import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Table, Card, Spin, Empty, Space, Typography, Tag } from 'antd';
import { ArrowLeftOutlined, GithubOutlined, SyncOutlined } from '@ant-design/icons';
import { gitHubService } from '../services/gitHubService';
import type { GitHubIssue } from '../services/gitHubService';
import { notificationService } from '../services/notificationService';
import { projectService } from '../services/projectService';
import type { Project } from '../services/projectService';

const { Title, Text } = Typography;

const GitHubIssuesViewer: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectData, issuesData] = await Promise.all([
        projectService.getProject(projectId),
        gitHubService.getGitHubIssues(projectId),
      ]);
      setProject(projectData);
      setIssues(issuesData);
    } catch (error) {
      notificationService.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!projectId) return;
    setSyncing(true);
    try {
      const result = await gitHubService.syncGitHubIssues(projectId);
      notificationService.success(`Synced ${result.issueCount} issues`);
      await fetchData();
    } catch (error) {
      notificationService.error('Failed to sync issues');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  if (!project.githubUrl) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/projects/${projectId}`)}
          style={{ marginBottom: 16 }}
        >
          Back
        </Button>
        <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
          <Empty
            description="No GitHub Repository Connected"
            style={{ marginTop: 60 }}
          >
            <Button
              type="primary"
              onClick={() => navigate(`/projects/${projectId}/settings`)}
            >
              Go to Project Settings
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  const columns = [
    {
      title: '#',
      dataIndex: 'gitHubIssueNumber',
      width: 70,
      sorter: (a: GitHubIssue, b: GitHubIssue) => a.gitHubIssueNumber - b.gitHubIssueNumber,
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
      title: 'Labels',
      dataIndex: 'gitHubLabels',
      render: (labels?: string) => {
        if (!labels) return '-';
        return labels.split(', ').map((label) => (
          <Tag key={label} color="blue" style={{ marginBottom: 4 }}>
            {label}
          </Tag>
        ));
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'gitHubAssignee',
      render: (assignee?: string) => assignee || '-',
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/projects/${projectId}`)}
          style={{ marginBottom: 16 }}
        >
          Back to Project
        </Button>
        <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
          <Space>
            <GithubOutlined />
            GitHub Issues
          </Space>
        </Title>
        <Text type="secondary">{project.name}</Text>
      </div>

      <Card style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Text strong>Repository: </Text>
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              {project.githubUrl}
            </a>
          </div>
          <Button
            icon={<SyncOutlined />}
            loading={syncing}
            onClick={handleSync}
          >
            Sync Issues
          </Button>
        </div>
      </Card>

      <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
        {issues.length === 0 ? (
          <Empty
            description="No issues synced yet"
            style={{ marginTop: 40 }}
          >
            <Button type="primary" onClick={handleSync} loading={syncing}>
              Sync Issues Now
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={issues}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        )}
      </Card>
    </div>
  );
};

export default GitHubIssuesViewer;
