import React from 'react';
import { Card, Badge } from 'antd';
import { useDroppable } from '@dnd-kit/core';

interface DropZoneProps {
  status: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ status, title, color: _color, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{title}</span>
            <Badge count={count} style={{ backgroundColor: '#1890ff', fontSize: 12, height: 20, lineHeight: '20px', minWidth: 20 }} />
          </div>
        }
        style={{
          background: isOver ? '#262626' : '#1f1f1f',
          border: isOver ? '2px solid #1890ff' : '1px solid #303030',
          minHeight: 500,
          flex: 1,
          transition: 'all 0.2s ease',
        }}
        bodyStyle={{
          padding: '8px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          ref={setNodeRef}
          style={{
            minHeight: 400,
            flex: 1,
            borderRadius: 4,
            backgroundColor: isOver ? 'rgba(24, 144, 255, 0.05)' : 'transparent',
            transition: 'background-color 0.2s ease',
            pointerEvents: 'auto',
          }}
        >
          {children}
        </div>
      </Card>
    </div>
  );
};

export default DropZone;
