import React from 'react';
import { Card } from 'antd';
import { EditOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../services/taskService';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        style={{
          marginBottom: 12,
          background: '#262626',
          border: '1px solid #434343',
          cursor: 'grab',
        }}
        hoverable
        actions={[
          <DragOutlined
            key="drag"
            style={{ color: '#8c8c8c', fontSize: 16 }}
            title="Drag to move"
          />,
          <EditOutlined
            key="edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          />,
          <DeleteOutlined
            key="delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          />,
        ]}
      >
        <h4 style={{ color: '#fff', marginBottom: 8, marginTop: 0 }}>{task.title}</h4>
        {task.description && (
          <p style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
            {task.description}
          </p>
        )}
        <div style={{ fontSize: 11, color: '#595959' }}>
          {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </Card>
    </div>
  );
};

export default TaskCard;
