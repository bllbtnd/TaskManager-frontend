import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Statistic, Row, Col, Tabs, Modal } from 'antd';
import { CheckOutlined, CloseOutlined, TeamOutlined, ClockCircleOutlined, DeleteOutlined, FolderOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { notificationService } from '../services/notificationService';
import type { User, UserStats } from '../services/userService';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pending, userStats, users, stats] = await Promise.all([
        userService.getPendingUsers(),
        userService.getUserStats(),
        userService.getAllUsers(),
        userService.getAdminStats(),
      ]);
      setPendingUsers(pending);
      setStats(userStats);
      setAllUsers(users);
      setAdminStats(stats);
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
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteUser(record.id, `${record.firstName} ${record.lastName}`)}
          size="small"
        >
          Delete
        </Button>
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
        ]}
      />
    </div>
  );
};

export default AdminDashboard;
