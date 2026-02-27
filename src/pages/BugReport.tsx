import React, { useState } from 'react';
import { Card, Form, Input, Button, Select } from 'antd';
import { BugOutlined, BulbOutlined } from '@ant-design/icons';
import { bugReportService } from '../services/bugReportService';
import { notificationService } from '../services/notificationService';

const { TextArea } = Input;

const BugReport: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'BUG_REPORT' | 'FEATURE_REQUEST'>('BUG_REPORT');

  const handleSubmit = async (values: { title: string; description: string; type: 'BUG_REPORT' | 'FEATURE_REQUEST' }) => {
    setLoading(true);
    try {
      await bugReportService.createReport(values);
      notificationService.success(
        values.type === 'BUG_REPORT' ? 'Bug report submitted' : 'Feature request submitted'
      );
      form.resetFields();
      setReportType('BUG_REPORT');
    } catch (error) {
      notificationService.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const isBug = reportType === 'BUG_REPORT';

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: 24 }}>
        {isBug ? <BugOutlined style={{ marginRight: 8 }} /> : <BulbOutlined style={{ marginRight: 8 }} />}
        {isBug ? 'Bug Report' : 'Feature Request'}
      </h1>
      <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ type: 'BUG_REPORT' }}>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select a type' }]}
          >
            <Select onChange={(value) => setReportType(value)}>
              <Select.Option value="BUG_REPORT">
                <BugOutlined style={{ marginRight: 6 }} /> Bug Report
              </Select.Option>
              <Select.Option value="FEATURE_REQUEST">
                <BulbOutlined style={{ marginRight: 6 }} /> Feature Request
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder={isBug ? 'Short summary of the issue' : 'Short summary of the feature'} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please describe the issue' }]}
          >
            <TextArea
              rows={6}
              placeholder={
                isBug
                  ? 'Steps to reproduce, expected vs actual behavior, etc.'
                  : 'Describe the feature you would like to see, why it would be useful, etc.'
              }
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isBug ? 'Submit Bug Report' : 'Submit Feature Request'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BugReport;
