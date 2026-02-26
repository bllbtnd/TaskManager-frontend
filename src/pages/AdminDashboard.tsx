import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Statistic, Row, Col } from 'antd';
import { CheckOutlined, CloseOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import type { User, UserStats } from '../services/userService';

const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pending, userStats] = await Promise.all([
        userService.getPendingUsers(),
        userService.getUserStats(),
      ]);
      setPendingUsers(pending);
      setStats(userStats);
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

  const columns = [
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

      <Card
        title="Pending User Approvals"
        style={{ background: '#1f1f1f', border: '1px solid #303030' }}
      >
        <Table
          columns={columns}
          dataSource={pendingUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
