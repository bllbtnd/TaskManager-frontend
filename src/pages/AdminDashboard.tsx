import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Statistic, Row, Col, Tabs, Modal, Drawer, Collapse, Empty, Spin, Descriptions } from 'antd';
import { CheckOutlined, CloseOutlined, TeamOutlined, ClockCircleOutlined, DeleteOutlined, FolderOutlined, CheckSquareOutlined, EyeOutlined } from '@ant-design/icons';
import { userService } from '../services/userService';
import { bugReportService } from '../services/bugReportService';
import { notificationService } from '../services/notificationService';
import type { User, UserStats, UserProjectDetail } from '../services/userService';
import type { BugReport } from '../services/bugReportService';

interface AdminStats {
  users: number;
  projects: number;
  tasks: number;
}

const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats>({ users: 0, projects: 0, tasks: 0 });
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<UserProjectDetail[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pending, userStats, users, stats, reports] = await Promise.all([
        userService.getPendingUsers(),
        userService.getUserStats(),
        userService.getAllUsers(),
        userService.getAdminStats(),
        bugReportService.getAllReports(),
      ]);
      setPendingUsers(pending);
      setStats(userStats);
      setAllUsers(users);
      setAdminStats(stats);
      setBugReports(reports);
    } catch (error) {
      notificationService.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await userService.approveUser(userId, status);
      notificationService.success(`User ${status.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      notificationService.error('Failed to update user status');
    }
  };

  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user);
    setDrawerVisible(true);
    setLoadingProjects(true);
    try {
      const projects = await userService.getUserProjects(user.id);
      setUserProjects(projects);
    } catch (error) {
      notificationService.error('Failed to load user projects');
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.deleteUser(userId);
          notificationService.success('User deleted successfully');
          fetchData();
        } catch (error) {
          notificationService.error('Failed to delete user');
        }
      },
    });
  };

  const handleResolveBugReport = async (reportId: string) => {
    try {
      await bugReportService.resolveReport(reportId);
      notificationService.success('Bug report marked as resolved');
      fetchData();
    } catch (error) {
      notificationService.error('Failed to resolve bug report');
    }
  };

  const pendingColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: User) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Registration Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApproval(record.id, 'APPROVED')}
            size="small"
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleApproval(record.id, 'REJECTED')}
            size="small"
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const usersColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: User) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Registered',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewUserDetails(record)}
            size="small"
          >
            View Details
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id, `${record.firstName} ${record.lastName}`)}
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const bugReportColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const color = type === 'FEATURE_REQUEST' ? 'purple' : 'red';
        const label = type === 'FEATURE_REQUEST' ? 'Feature Request' : 'Bug Report';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Reporter',
      dataIndex: 'createdByEmail',
      key: 'createdByEmail',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'RESOLVED' ? 'green' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <span title={text}>{text.length > 60 ? `${text.slice(0, 60)}...` : text}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BugReport) => (
        record.status === 'OPEN' && (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleResolveBugReport(record.id)}
            size="small"
          >
            Resolve
          </Button>
        )
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: '#fff', marginBottom: 24 }}>Admin Dashboard</h1>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
              <Statistic
                title="Total Users"
                value={stats.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
              <Statistic
                title="Pending"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
              <Statistic
                title="Approved"
                value={stats.approved}
                prefix={<CheckOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
              <Statistic
                title="Rejected"
                value={stats.rejected}
                prefix={<CloseOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
            <Statistic
              title="Total Projects"
              value={adminStats.projects}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
            <Statistic
              title="Total Tasks"
              value={adminStats.tasks}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="pending"
        style={{ color: '#fff' }}
        items={[
          {
            key: 'pending',
            label: 'Pending Approvals',
            children: (
              <Card
                style={{ background: '#1f1f1f', border: '1px solid #303030' }}
              >
                <Table
                  columns={pendingColumns}
                  dataSource={pendingUsers}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'users',
            label: 'All Users',
            children: (
              <Card
                style={{ background: '#1f1f1f', border: '1px solid #303030' }}
              >
                <Table
                  columns={usersColumns}
                  dataSource={allUsers}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'bug-reports',
            label: 'Reports',
            children: (
              <Card
                style={{ background: '#1f1f1f', border: '1px solid #303030' }}
              >
                <Table
                  columns={bugReportColumns}
                  dataSource={bugReports}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* User Details Drawer */}
      <Drawer
        title={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} - Projects & Tasks` : 'User Details'}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={800}
      >
        {selectedUser && (
          <div>
            <Descriptions
              column={1}
              style={{ marginBottom: 24 }}
              items={[
                { label: 'Email', children: selectedUser.email },
                { label: 'Role', children: <Tag color="blue">{selectedUser.role}</Tag> },
                { label: 'Status', children: <Tag color={selectedUser.status === 'APPROVED' ? 'green' : 'orange'}>{selectedUser.status}</Tag> },
                { label: 'Registered', children: new Date(selectedUser.createdAt).toLocaleDateString() },
              ]}
            />

            {loadingProjects ? (
              <Spin />
            ) : userProjects.length === 0 ? (
              <Empty description="No projects found" />
            ) : (
              <div>
                <h3>Projects ({userProjects.length})</h3>
                <Collapse
                  items={userProjects.map((project) => ({
                    key: project.id,
                    label: (
                      <Space>
                        <FolderOutlined />
                        <span>{project.name}</span>
                        <Tag color="cyan">{project.tasks?.length || 0} tasks</Tag>
                      </Space>
                    ),
                    children: (
                      <div style={{ paddingLeft: 16 }}>
                        <p><strong>Description:</strong> {project.description || 'N/A'}</p>
                        <p><strong>Created:</strong> {project.createdAt}</p>
                        <p><strong>Members:</strong> {project.memberIds?.length || 0}</p>

                        {project.tasks && project.tasks.length > 0 ? (
                          <div style={{ marginTop: 16 }}>
                            <h4>Tasks</h4>
                            <Collapse
                              items={project.tasks.map((task) => ({
                                key: task.id,
                                label: (
                                  <Space>
                                    <CheckSquareOutlined />
                                    <span>{task.title}</span>
                                    <Tag color={task.status === 'DONE' ? 'green' : task.status === 'IN_PROGRESS' ? 'blue' : 'default'}>
                                      {task.status?.replace(/_/g, ' ')}
                                    </Tag>
                                  </Space>
                                ),
                                children: (
                                  <div style={{ paddingLeft: 16 }}>
                                    <p><strong>Description:</strong> {task.description || 'N/A'}</p>
                                    <p><strong>Status:</strong> {task.status?.replace(/_/g, ' ')}</p>
                                    <p><strong>Created:</strong> {task.createdAt}</p>
                                    {task.deadline && <p><strong>Deadline:</strong> {task.deadline}</p>}
                                    {task.completedAt && <p><strong>Completed:</strong> {task.completedAt}</p>}
                                    {task.assignedToEmails && task.assignedToEmails.length > 0 && (
                                      <p>
                                        <strong>Assigned To:</strong>{' '}
                                        {task.assignedToEmails.map((email) => (
                                          <Tag key={email} style={{ marginRight: 4 }}>{email}</Tag>
                                        ))}
                                      </p>
                                    )}
                                  </div>
                                ),
                              }))}
                            />
                          </div>
                        ) : (
                          <p style={{ marginTop: 16, color: '#999' }}>No tasks in this project</p>
                        )}
                      </div>
                    ),
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminDashboard;
