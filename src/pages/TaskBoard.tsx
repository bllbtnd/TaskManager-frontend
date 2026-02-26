import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Modal, Form, Input, Select, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { notificationService } from '../services/notificationService';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { taskService } from '../services/taskService';
import type { Task, TaskRequest, TaskStatus } from '../services/taskService';
import { projectService } from '../services/projectService';
import type { Project } from '../services/projectService';
import TaskCard from '../components/TaskCard';
import DropZone from '../components/DropZone.tsx';

const { TextArea } = Input;

const TaskBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectData, tasksData] = await Promise.all([
        projectService.getProject(projectId),
        taskService.getProjectTasks(projectId),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (error) {
      notificationService.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (values: TaskRequest) => {
    if (!projectId) return;
    try {
      if (editingTask) {
        await taskService.updateTask(projectId, editingTask.id, values);
        notificationService.success('Task updated successfully');
      } else {
        await taskService.createTask(projectId, values);
        notificationService.success('Task created successfully');
      }
      setModalVisible(false);
      setEditingTask(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      notificationService.error('Operation failed');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      status: task.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!projectId) return;
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await taskService.deleteTask(projectId, taskId);
          notificationService.success('Task deleted successfully');
          fetchData();
        } catch (error) {
          notificationService.error('Failed to delete task');
        }
      },
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !projectId) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    
    if (!task) return;

    // The over.id should be the column status
    const newStatus = over.id as TaskStatus;

    if (newStatus && task.status !== newStatus && ['TO_DO', 'IN_PROGRESS', 'DONE'].includes(newStatus)) {
      try {
        await taskService.updateTaskStatus(projectId, taskId, newStatus);
        notificationService.success(`Task moved to ${newStatus.replace(/_/g, ' ')}`);
        fetchData();
      } catch (error) {
        notificationService.error('Failed to update task status');
      }
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ status: 'TO_DO' });
    setModalVisible(true);
  };

  const activeTask = tasks.find((task) => task.id === activeId);

  const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.timeSpentMs || 0), 0);

  const formatTotalTime = (ms: number) => {
    if (!ms) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const statusColumns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'TO_DO', title: 'To Do', color: '#d9d9d9' },
    { status: 'IN_PROGRESS', title: 'In Progress', color: '#1890ff' },
    { status: 'DONE', title: 'Done', color: '#52c41a' },
  ];

  const totalTasks = tasks.length;
  const toDoTasks = getTasksByStatus('TO_DO').length;
  const inProgressTasks = getTasksByStatus('IN_PROGRESS').length;
  const doneTasks = getTasksByStatus('DONE').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const avgTimePerTask = totalTasks > 0 ? Math.floor(totalTimeSpent / totalTasks) : 0;

  const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div style={{
      background: '#1f1f1f',
      border: '1px solid #303030',
      borderRadius: 8,
      padding: 16,
      flex: 1,
    }}>
      <p style={{ color: '#8c8c8c', fontSize: 12, margin: 0, marginBottom: 8 }}>{label}</p>
      <p style={{ color, fontSize: 24, fontWeight: 600, margin: 0 }}>{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0 }}>{project?.name || 'Project'}</h1>
          <p style={{ color: '#8c8c8c', margin: 0 }}>{project?.description}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} size="large">
          Add Task
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Time Spent" value={formatTotalTime(totalTimeSpent)} color="#1890ff" />
        <StatCard label="Total Tasks" value={totalTasks} color="#fff" />
        <StatCard label="Avg Time per Task" value={formatTotalTime(avgTimePerTask)} color="#faad14" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} color="#52c41a" />
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.status);
            return (
              <DropZone key={column.status} status={column.status} title={column.title} color={column.color} count={columnTasks.length}>
                <SortableContext
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ minHeight: 400 }}>
                    {columnTasks.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          color: '#595959',
                          padding: 40,
                          fontSize: 12,
                        }}
                      >
                        Drop tasks here
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          projectId={projectId!}
                          onTaskUpdate={(updatedTask) => {
                            setTasks((prev) =>
                              prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
                            );
                          }}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DropZone>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{
              background: '#262626',
              border: '2px solid #1890ff',
              borderRadius: 8,
              padding: 16,
              cursor: 'grabbing',
              opacity: 1,
              minWidth: 250,
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            }}>
              <h4 style={{ color: '#fff', margin: 0 }}>{activeTask.title}</h4>
              <p style={{ color: '#8c8c8c', fontSize: 12, margin: '8px 0 0 0' }}>
                {activeTask.description || 'No description'}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Modal
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTask(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateOrUpdate} layout="vertical">
          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true, message: 'Please enter task title' }]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Enter task description" />
          </Form.Item>

          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="TO_DO">To Do</Select.Option>
              <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
              <Select.Option value="DONE">Done</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskBoard;
