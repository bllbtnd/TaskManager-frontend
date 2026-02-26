import React, { useState } from 'react';
import { Card, Form, Input, Button } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import { bugReportService } from '../services/bugReportService';
import { notificationService } from '../services/notificationService';

const { TextArea } = Input;

const BugReport: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { title: string; description: string }) => {
    setLoading(true);
    try {
      await bugReportService.createReport(values);
      notificationService.success('Bug report submitted');
      form.resetFields();
    } catch (error) {
      notificationService.error('Failed to submit bug report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: 24 }}>
        <BugOutlined style={{ marginRight: 8 }} />
        Bug Report
      </h1>
      <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Short summary of the issue" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please describe the issue' }]}
          >
            <TextArea rows={6} placeholder="Steps to reproduce, expected vs actual behavior, etc." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Bug Report
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BugReport;
