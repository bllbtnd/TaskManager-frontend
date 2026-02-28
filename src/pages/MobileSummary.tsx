import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Row, Spin, Tag, Typography } from 'antd';
import { LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import type { Task } from '../services/taskService';

const { Title, Text } = Typography;

interface ProjectTaskSummary {
  projectId: string;
  projectName: string;
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

const MobileSummary: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [projectSummaries, setProjectSummaries] = useState<ProjectTaskSummary[]>([]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const projects = await projectService.getUserProjects();
      const tasksByProject = await Promise.all(
        projects.map(async (project) => {
          const tasks = await taskService.getProjectTasks(project.id);
          return { project, tasks };
        })
      );

      const summary = tasksByProject.map(({ project, tasks }) => {
        const todo = tasks.filter((task) => task.status === 'TO_DO').length;
        const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
        const done = tasks.filter((task) => task.status === 'DONE').length;

        return {
          projectId: project.id,
          projectName: project.name,
          total: tasks.length,
          todo,
          inProgress,
          done,
        };
      });

      setProjectSummaries(summary);
    } catch (error) {
      notificationService.error('Failed to load mobile summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const totals = useMemo(() => {
    const allTasks = projectSummaries.reduce(
      (acc, project) => {
        acc.total += project.total;
        acc.todo += project.todo;
        acc.inProgress += project.inProgress;
        acc.done += project.done;
        return acc;
      },
      { total: 0, todo: 0, inProgress: 0, done: 0 }
    );

    return {
      projects: projectSummaries.length,
      ...allTasks,
    };
  }, [projectSummaries]);

  const recentProjects = [...projectSummaries]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: 16 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card
          style={{
            background: '#1f1f1f',
            border: '1px solid #303030',
          }}
          styles={{ body: { padding: 16 } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <Title level={4} style={{ color: '#fff', marginBottom: 4 }}>
                Hi, {user?.firstName || 'there'}
              </Title>
              <Text style={{ color: '#8c8c8c' }}>Mobile quick summary</Text>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button icon={<ReloadOutlined />} onClick={fetchSummary} loading={loading}>
                Refresh
              </Button>
              <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>

          <Alert
            type="warning"
            showIcon
            message="Desktop app recommended"
            description="This app is currently optimized for PC. On mobile, you can view summary information only."
            style={{ marginTop: 16, marginBottom: 16 }}
          />

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={8}>
                  <Card size="small" style={{ background: '#262626', border: '1px solid #303030' }}>
                    <Text style={{ color: '#8c8c8c' }}>Projects</Text>
                    <Title level={3} style={{ color: '#fff', margin: 0 }}>{totals.projects}</Title>
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card size="small" style={{ background: '#262626', border: '1px solid #303030' }}>
                    <Text style={{ color: '#8c8c8c' }}>Total Tasks</Text>
                    <Title level={3} style={{ color: '#fff', margin: 0 }}>{totals.total}</Title>
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card size="small" style={{ background: '#262626', border: '1px solid #303030' }}>
                    <Text style={{ color: '#8c8c8c' }}>Done</Text>
                    <Title level={3} style={{ color: '#52c41a', margin: 0 }}>{totals.done}</Title>
                  </Card>
                </Col>
              </Row>

              <Card
                size="small"
                title={<span style={{ color: '#fff' }}>Task Status Overview</span>}
                style={{ background: '#262626', border: '1px solid #303030', marginBottom: 16 }}
              >
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag color="default">To Do: {totals.todo}</Tag>
                  <Tag color="processing">In Progress: {totals.inProgress}</Tag>
                  <Tag color="success">Done: {totals.done}</Tag>
                </div>
              </Card>

              <Card
                size="small"
                title={<span style={{ color: '#fff' }}>Top Projects by Task Count</span>}
                style={{ background: '#262626', border: '1px solid #303030' }}
              >
                {recentProjects.length === 0 ? (
                  <Text style={{ color: '#8c8c8c' }}>No projects yet.</Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentProjects.map((project) => (
                      <div
                        key={project.projectId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #303030',
                          paddingBottom: 8,
                        }}
                      >
                        <Text style={{ color: '#fff' }}>{project.projectName}</Text>
                        <Tag color="blue">{project.total} tasks</Tag>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MobileSummary;
