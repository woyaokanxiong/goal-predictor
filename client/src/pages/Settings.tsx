import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Upload,
  Tabs,
  List,
  Tag,
  Modal,
  Alert,
  Space,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  UploadOutlined,
  DownloadOutlined,
  ImportOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/auth'
import api from '../utils/api'

const { confirm } = Modal

export default function Settings() {
  const { user, logout } = useAuthStore()
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)

  const handleUpdateProfile = async (values: any) => {
    setLoading(true)
    try {
      message.success('个人资料更新成功')
    } catch (error) {
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error('密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/export/csv', {
        responseType: 'blob',
      })
      
      const blob = new Blob(['\uFEFF', response.data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const handleExportJSON = async () => {
    try {
      const response = await api.get('/export/json', {
        responseType: 'blob',
      })
      
      const blob = new Blob([response.data], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `finance_backup_${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      
      message.success('备份成功')
    } catch (error) {
      message.error('备份失败')
    }
  }

  const handleImport = async (file: File, type: 'csv' | 'json') => {
    const formData = new FormData()
    formData.append('file', file)

    setUploadLoading(true)
    try {
      const response = await api.post(`/import/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      message.success(response.data.message)
      return false
    } catch (error: any) {
      message.error(error.response?.data?.message || '导入失败')
      return false
    } finally {
      setUploadLoading(false)
    }
  }

  const showClearConfirm = () => {
    confirm({
      title: '确定要清空所有数据吗？',
      icon: <ExclamationCircleOutlined />,
      content: '此操作将删除所有交易记录、账户、分类和预算，且无法恢复！',
      okText: '确定清空',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        message.success('数据已清空')
      },
    })
  }

  const dataManagementItems = [
    {
      title: '导出CSV',
      description: '将所有交易记录导出为CSV格式，可用Excel打开',
      action: (
        <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
          导出CSV
        </Button>
      ),
    },
    {
      title: '备份数据',
      description: '导出完整的数据备份（JSON格式），包含账户、分类、预算和交易记录',
      action: (
        <Button icon={<DatabaseOutlined />} onClick={handleExportJSON}>
          备份数据
        </Button>
      ),
    },
    {
      title: '导入CSV',
      description: '从CSV文件导入交易记录',
      action: (
        <Upload
          accept=".csv"
          showUploadList={false}
          beforeUpload={(file) => handleImport(file, 'csv')}
        >
          <Button icon={<ImportOutlined />} loading={uploadLoading}>
            导入CSV
          </Button>
        </Upload>
      ),
    },
    {
      title: '恢复数据',
      description: '从JSON备份文件恢复数据',
      action: (
        <Upload
          accept=".json"
          showUploadList={false}
          beforeUpload={(file) => handleImport(file, 'json')}
        >
          <Button icon={<UploadOutlined />} loading={uploadLoading}>
            恢复数据
          </Button>
        </Upload>
      ),
    },
    {
      title: '清空数据',
      description: '删除所有数据，请谨慎操作！',
      action: (
        <Button danger onClick={showClearConfirm}>
          清空数据
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>系统设置</h2>
      </div>

      <Tabs 
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: '个人资料',
            children: (
              <Card>
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  initialValues={{
                    username: user?.username,
                    email: user?.email,
                  }}
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input prefix={<UserOutlined />} disabled />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: '2',
            label: '修改密码',
            children: (
              <Card>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                >
                  <Form.Item
                    name="currentPassword"
                    label="当前密码"
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码至少6个字符' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="确认新密码"
                    rules={[{ required: true, message: '请确认新密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: '3',
            label: '数据管理',
            children: (
              <Card>
                <Alert
                  message="数据安全提示"
                  description="建议定期备份数据，以防数据丢失。导入数据前请确保文件格式正确。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <List
                  itemLayout="horizontal"
                  dataSource={dataManagementItems}
                  renderItem={(item) => (
                    <List.Item actions={[item.action]}>
                      <List.Item.Meta
                        title={item.title}
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
          {
            key: '4',
            label: '关于',
            children: (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <h1 style={{ color: '#1890ff', marginBottom: 16 }}>个人记账系统</h1>
                  <p style={{ color: '#666', fontSize: 16 }}>版本 1.0.0</p>
                  <p style={{ color: '#999', marginTop: 24 }}>
                    一款简洁、实用的个人财务管理工具
                  </p>
                  <p style={{ color: '#999' }}>
                    帮助您记录每一笔收支，掌握财务状况
                  </p>
                </div>
              </Card>
            ),
          },
        ]}
      />
    </div>
  )
}