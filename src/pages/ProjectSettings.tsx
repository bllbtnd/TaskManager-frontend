import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Card, Spin, Space, List, Popconfirm, Modal, Typography } from 'antd';
import { ArrowLeftOutlined, UserAddOutlined, DeleteOutlined, SaveOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { notificationService } from '../services/notificationService';
import { projectService } from '../services/projectService';
import type { Project, ProjectRequest } from '../services/projectService';
import { userService } from '../services/userService';
import type { UserProfile } from '../services/userService';

const { TextArea } = Input;
const { Title, Text } = Typography;

const ProjectSettings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectData, profile, members] = await Promise.all([
        projectService.getProject(projectId),
        userService.getCurrentUserProfile(),
        projectService.getProjectMembers(projectId),
      ]);

      setProject(projectData);
      setCurrentUser(profile);
      setMemberEmails(members);

      // Check if current user is the owner
      if (profile.id !== projectData.ownerId) {
        notificationService.error('Only the project owner can access settings');
        navigate(`/projects/${projectId}`);
        return;
      }

      form.setFieldsValue({
        name: projectData.name,
        description: projectData.description,
        githubUrl: projectData.githubUrl || '',
      });
    } catch (error) {
      notificationService.error('Failed to fetch project data');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: ProjectRequest) => {
    if (!projectId) return;
    setSaving(true);
    try {
      await projectService.updateProject(projectId, values);
      notificationService.success('Project updated successfully');
      await fetchData();
    } catch (error) {
      notificationService.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!projectId || !inviteEmail.trim()) {
      notificationService.error('Please enter an email');
      return;
    }

    setInviteLoading(true);
    try {
      await projectService.inviteUser(projectId, { email: inviteEmail.trim() });
      notificationService.success('User invited successfully');
      setInviteEmail('');
      await fetchData();
    } catch (error) {
      notificationService.error('Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!projectId) return;
    try {
      await projectService.removeUser(projectId, email);
      notificationService.success('User removed successfully');
      await fetchData();
    } catch (error) {
      notificationService.error('Failed to remove user');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    try {
      await projectService.deleteProject(projectId);
      notificationService.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      notificationService.error('Failed to delete project');
    }
  };

  const showDeleteConfirm = () => {
    Modal.confirm({
      title: 'Delete Project',
      content: (
        <div>
          <p>Are you sure you want to delete this project?</p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            This action is irreversible and will delete:
          </p>
          <ul style={{ color: '#ff4d4f' }}>
            <li>All tasks in this project</li>
            <li>All time logs associated with tasks</li>
            <li>All project data</li>
          </ul>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: handleDeleteProject,
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project || !currentUser) {
    return null;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/projects/${projectId}`)}
          style={{ marginBottom: 16 }}
        >
          Back to Project
        </Button>
        <Title level={2} style={{ margin: 0 }}>Project Settings</Title>
        <Text type="secondary">{project.name}</Text>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {/* General Settings */}
        <Card title="General Settings" style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              label="Project Name"
              name="name"
              rules={[{ required: true, message: 'Please enter project name' }]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={4} placeholder="Enter project description" />
            </Form.Item>

            <Form.Item
              label="GitHub URL (Optional)"
              name="githubUrl"
            >
              <Input placeholder="https://github.com/username/repo" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Team Management */}
        <Card title="Team Management" style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Invite User</Text>
            <Space.Compact style={{ width: '100%', maxWidth: 400 }}>
              <Input
                placeholder="Enter user email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onPressEnter={handleInviteUser}
              />
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                loading={inviteLoading}
                onClick={handleInviteUser}
              >
                Invite
              </Button>
            </Space.Compact>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>Team Members ({memberEmails.length})</Text>
            <List
              dataSource={memberEmails}
              renderItem={(email, index) => {
                const isOwner = index === 0;
                return (
                  <List.Item
                    style={{
                      background: '#262626',
                      marginBottom: 8,
                      padding: '12px 16px',
                      borderRadius: 6,
                      border: '1px solid #303030',
                    }}
                    actions={[
                      !isOwner && (
                        <Popconfirm
                          title="Remove user"
                          description={`Are you sure you want to remove ${email} from this project?`}
                          onConfirm={() => handleRemoveUser(email)}
                          okText="Remove"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<UserDeleteOutlined />}
                            size="small"
                          >
                            Remove
                          </Button>
                        </Popconfirm>
                      ),
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text>{email}</Text>
                          {isOwner && (
                            <Text
                              style={{
                                background: '#1890ff',
                                color: '#fff',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                              }}
                            >
                              Owner
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card
          title={<Text style={{ color: '#ff4d4f' }}>Danger Zone</Text>}
          style={{ background: '#1f1f1f', border: '1px solid #ff4d4f' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ display: 'block' }}>Delete Project</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Once deleted, all tasks and data will be permanently removed
              </Text>
            </div>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={showDeleteConfirm}
            >
              Delete Project
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProjectSettings;
