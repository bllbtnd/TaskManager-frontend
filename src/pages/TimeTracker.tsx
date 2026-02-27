import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Card, List, Typography, Tag, Spin, Empty } from 'antd';
import { ClockCircleOutlined, ProjectOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { getUserTimeLogs } from '../services/timeLogService';
import type { TimeLog } from '../services/timeLogService';
import { notificationService } from '../services/notificationService';

const { Title, Text } = Typography;

interface GroupedTimeLogs {
  [date: string]: TimeLog[];
}

const TimeTracker: React.FC = () => {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  useEffect(() => {
    fetchTimeLogs(currentMonth);
  }, [currentMonth]);

  const fetchTimeLogs = async (month: Dayjs) => {
    setLoading(true);
    try {
      const startDate = month.startOf('month').toISOString();
      const endDate = month.endOf('month').toISOString();
      const logs = await getUserTimeLogs(startDate, endDate);
      setTimeLogs(logs);
    } catch (error) {
      notificationService.error('Failed to fetch time logs');
    } finally {
      setLoading(false);
    }
  };

  const groupLogsByDate = (): GroupedTimeLogs => {
    const grouped: GroupedTimeLogs = {};
    timeLogs.forEach(log => {
      const date = dayjs(log.startTime).format('YYYY-MM-DD');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    return grouped;
  };

  const getListData = (value: Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD');
    const grouped = groupLogsByDate();
    const logs = grouped[dateKey] || [];
    
    const totalMs = logs.reduce((sum, log) => sum + log.durationMs, 0);
    
    return {
      logs,
      totalMs
    };
  };

  const dateCellRender = (value: Dayjs) => {
    const { logs, totalMs } = getListData(value);
    
    if (logs.length === 0) return null;

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <div style={{ fontSize: '12px' }}>
        <Badge 
          count={logs.length} 
          style={{ backgroundColor: '#1890ff' }}
        />
        <div style={{ marginTop: 4, color: '#52c41a' }}>
          {hours > 0 && `${hours}h `}{minutes}m
        </div>
      </div>
    );
  };

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const onPanelChange = (value: Dayjs) => {
    setCurrentMonth(value);
  };

  const onSelect = (value: Dayjs) => {
    setSelectedDate(value);
  };

  const selectedDateLogs = getListData(selectedDate).logs;
  const totalDurationForDay = selectedDateLogs.reduce((sum, log) => sum + log.durationMs, 0);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ClockCircleOutlined /> Time Tracker
      </Title>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <Card>
          <Spin spinning={loading}>
            <Calendar
              value={selectedDate}
              onSelect={onSelect}
              onPanelChange={onPanelChange}
              cellRender={dateCellRender}
            />
          </Spin>
        </Card>

        <Card 
          title={
            <div>
              <div>{selectedDate.format('MMMM D, YYYY')}</div>
              {totalDurationForDay > 0 && (
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                  Total: {formatDuration(totalDurationForDay)}
                </Text>
              )}
            </div>
          }
        >
          {selectedDateLogs.length > 0 ? (
            <List
              dataSource={selectedDateLogs}
              renderItem={(log) => (
                <List.Item style={{ padding: '12px 0' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{log.taskTitle}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag icon={<ProjectOutlined />} color="blue">
                        {log.projectName}
                      </Tag>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      <div>
                        {dayjs(log.startTime).format('HH:mm:ss')} - {dayjs(log.endTime).format('HH:mm:ss')}
                      </div>
                      <div style={{ marginTop: 4, color: '#52c41a', fontWeight: 500 }}>
                        Duration: {formatDuration(log.durationMs)}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              description="No time logged on this day" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default TimeTracker;
