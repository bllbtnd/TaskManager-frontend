import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Empty, Tooltip } from 'antd';
import { PlusOutlined, FolderOutlined, DeleteOutlined, EditOutlined, GithubOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import type { Project, ProjectRequest } from '../services/projectService';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';

const { TextArea } = Input;

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const [projectsData, profile] = await Promise.all([
        projectService.getUserProjects(),
        userService.getCurrentUserProfile(),
      ]);
      setProjects(projectsData);
      setCurrentUserId(profile.id);
    } catch (error) {
      notificationService.error('Failed to fetch projects');
    }
  };

  const handleCreateOrUpdate = async (values: ProjectRequest) => {
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, values);
        notificationService.success('Project updated successfully');
      } else {
        await projectService.createProject(values);
        notificationService.success('Project created successfully');
      }
      setModalVisible(false);
      setEditingProject(null);
      form.resetFields();
      fetchProjects();
    } catch (error) {
      notificationService.error('Operation failed');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      githubUrl: project.githubUrl,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await projectService.deleteProject(id);
          notificationService.success('Project deleted successfully');
          fetchProjects();
        } catch (error) {
          notificationService.error('Failed to delete project');
        }
      },
    });
  };

  const handleLeave = async (projectId: string) => {
    Modal.confirm({
      title: 'Leave Project',
      content: 'Are you sure you want to leave this project?',
      okText: 'Leave',
      okType: 'danger',
      onOk: async () => {
        try {
          await projectService.leaveProject(projectId);
          notificationService.success('You left the project');
          fetchProjects();
        } catch (error) {
          notificationService.error('Failed to leave project');
        }
      },
    });
  };

  const openCreateModal = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#fff', margin: 0 }}>Projects</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          size="large"
        >
          Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card style={{ background: '#1f1f1f', border: '1px solid #303030', minHeight: 400 }}>
          <Empty
            description="No projects yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 60 }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Create Your First Project
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((project) => {
            const isOwner = currentUserId && project.ownerId === currentUserId;
            return (
            <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
              <Card
                hoverable
                style={{
                  background: '#1f1f1f',
                  border: '1px solid #303030',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
                actions={
                  isOwner
                    ? [
                        <EditOutlined
                          key="edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(project);
                          }}
                        />,
                        <DeleteOutlined
                          key="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project.id);
                          }}
                        />,
                      ]
                    : [
                        <LogoutOutlined
                          key="leave"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeave(project.id);
                          }}
                        />,
                      ]
                }
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <FolderOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </div>
                <Card.Meta
                  title={<div style={{ color: '#fff', textAlign: 'center' }}>{project.name}</div>}
                  description={
                    <div style={{ color: '#8c8c8c', textAlign: 'center', fontSize: 12 }}>
                      {project.description || 'No description'}
                    </div>
                  }
                />
                {project.githubUrl && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <Tooltip title={project.githubUrl}>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <GithubOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                      </a>
                    </Tooltip>
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 12, color: '#595959', textAlign: 'center' }}>
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </Card>
            </Col>
            );
          })}
        </Row>
      )}

      <Modal
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProject(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateOrUpdate} layout="vertical">
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} placeholder="Enter project description" />
          </Form.Item>

          <Form.Item
            name="githubUrl"
            label="GitHub Repository (Optional)"
            rules={[
              {
                pattern: /^(https:\/\/github\.com\/.*)?$/,
                message: 'Please enter a valid GitHub URL',
              },
            ]}
          >
            <Input placeholder="https://github.com/username/repo-name" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingProject ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
