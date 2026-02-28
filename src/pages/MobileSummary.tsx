import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Spin, Tag, Typography } from 'antd';
import { LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';

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
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #1d2b2b 0%, #141414 45%)',
        padding: 12,
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Card
          style={{
            background: '#1b1b1f',
            border: '1px solid #2f2f35',
            borderRadius: 14,
          }}
          styles={{ body: { padding: 14 } }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0, lineHeight: 1.25 }}>
                Hi, {user?.firstName || 'there'}
              </Title>
              <Text style={{ color: '#8c8c8c', display: 'block', marginTop: 4 }}>
                Mobile quick summary
              </Text>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Button icon={<ReloadOutlined />} onClick={fetchSummary} loading={loading} block>
                Refresh
              </Button>
              <Button danger icon={<LogoutOutlined />} onClick={handleLogout} block>
                Logout
              </Button>
            </div>
          </div>

          <Alert
            type="warning"
            showIcon
            message="Desktop app recommended"
            description="This app is currently optimized for PC. On mobile, you can view summary information only."
            style={{ marginTop: 8, marginBottom: 14, borderRadius: 10 }}
          />

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <Card size="small" style={{ background: '#24242a', border: '1px solid #2f2f35', borderRadius: 10 }}>
                  <Text style={{ color: '#8c8c8c' }}>Projects</Text>
                  <Title level={3} style={{ color: '#fff', margin: 0 }}>{totals.projects}</Title>
                </Card>
                <Card size="small" style={{ background: '#24242a', border: '1px solid #2f2f35', borderRadius: 10 }}>
                  <Text style={{ color: '#8c8c8c' }}>Total Tasks</Text>
                  <Title level={3} style={{ color: '#fff', margin: 0 }}>{totals.total}</Title>
                </Card>
                <Card
                  size="small"
                  style={{
                    background: '#24242a',
                    border: '1px solid #2f2f35',
                    borderRadius: 10,
                    gridColumn: '1 / -1',
                  }}
                >
                  <Text style={{ color: '#8c8c8c' }}>Done</Text>
                  <Title level={3} style={{ color: '#52c41a', margin: 0 }}>{totals.done}</Title>
                </Card>
              </div>

              <Card
                size="small"
                title={<span style={{ color: '#fff' }}>Task Status Overview</span>}
                style={{ background: '#24242a', border: '1px solid #2f2f35', borderRadius: 10, marginBottom: 14 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{ background: '#1c1c21', border: '1px solid #333', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <Title level={5} style={{ color: '#d9d9d9', margin: 0 }}>{totals.todo}</Title>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>To Do</Text>
                  </div>
                  <div style={{ background: '#1c1c21', border: '1px solid #333', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <Title level={5} style={{ color: '#1890ff', margin: 0 }}>{totals.inProgress}</Title>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>In Progress</Text>
                  </div>
                  <div style={{ background: '#1c1c21', border: '1px solid #333', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <Title level={5} style={{ color: '#52c41a', margin: 0 }}>{totals.done}</Title>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>Done</Text>
                  </div>
                </div>
              </Card>

              <Card
                size="small"
                title={<span style={{ color: '#fff' }}>Top Projects by Task Count</span>}
                style={{ background: '#24242a', border: '1px solid #2f2f35', borderRadius: 10 }}
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
                          borderBottom: '1px solid #2f2f35',
                          paddingBottom: 8,
                          gap: 8,
                        }}
                      >
                        <Text style={{ color: '#fff', flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                          {project.projectName}
                        </Text>
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
