import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Tag,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Progress,
  Statistic,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../utils/api'
import { Goal, GoalProgress } from '../types'
import { useFinanceStore } from '../store/finance'

const { TextArea } = Input

const formatAmount = (amount: number | undefined) => {
  if (amount === undefined || amount === null) {
    return '¥0.00'
  }
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

export default function Goals() {
  const [goals, setGoals] = useState<GoalProgress[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [form] = Form.useForm()

  const { refreshData } = useFinanceStore()

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const response = await api.get('/goals')
      setGoals(response.data.data)
    } catch (error) {
      message.error('获取目标列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingGoal(null)
    form.resetFields()
    form.setFieldsValue({
      startDate: dayjs(),
      currentAmount: 0,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: GoalProgress) => {
    setEditingGoal(record.goal)
    form.setFieldsValue({
      ...record.goal,
      startDate: dayjs(record.goal.startDate),
      targetDate: record.goal.targetDate ? dayjs(record.goal.targetDate) : null,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/goals/${id}`)
      message.success('删除成功')
      fetchGoals()
      refreshData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        targetDate: values.targetDate ? values.targetDate.format('YYYY-MM-DD') : undefined,
      }

      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, data)
        message.success('更新成功')
      } else {
        await api.post('/goals', data)
        message.success('添加成功')
      }

      setModalVisible(false)
      fetchGoals()
      refreshData()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleUpdateProgress = async (goal: Goal, currentAmount: number) => {
    try {
      await api.put(`/goals/${goal.id}/progress`, { currentAmount })
      message.success('进度更新成功')
      fetchGoals()
      refreshData()
    } catch (error) {
      message.error('更新进度失败')
    }
  }

  const columns = [
    {
      title: '目标名称',
      dataIndex: 'goal.name',
      key: 'name',
    },
    {
      title: '目标金额',
      dataIndex: 'goal.targetAmount',
      key: 'targetAmount',
      render: (amount: number) => formatAmount(amount),
    },
    {
      title: '当前金额',
      dataIndex: 'goal.currentAmount',
      key: 'currentAmount',
      render: (amount: number) => formatAmount(amount),
    },
    {
      title: '进度',
      key: 'progress',
      render: (_: any, record: GoalProgress) => (
        <div>
          <Progress 
            percent={Math.round(record.progress)} 
            status={record.progress >= 100 ? 'success' : 'active'}
          />
          <span style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
            {Math.round(record.progress)}%
          </span>
        </div>
      ),
    },
    {
      title: '剩余金额',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      render: (amount: number) => formatAmount(amount),
    },
    {
      title: '开始日期',
      dataIndex: 'goal.startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '预计完成日期',
      dataIndex: 'estimatedCompletionDate',
      key: 'estimatedCompletionDate',
      render: (date: string | undefined) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: GoalProgress) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个目标吗？"
            onConfirm={() => handleDelete(record.goal.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>目标管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加目标
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {goals.map((goalProgress) => (
          <Col xs={24} sm={12} md={8} key={goalProgress.goal.id}>
            <Card 
              title={goalProgress.goal.name}
              extra={
                <Tag color={goalProgress.progress >= 100 ? 'success' : 'processing'}>
                  {goalProgress.progress >= 100 ? '已完成' : '进行中'}
                </Tag>
              }
            >
              <Statistic 
                title="目标金额" 
                value={goalProgress.goal.targetAmount} 
                precision={2}
                formatter={(value) => formatAmount(Number(value))}
              />
              <Statistic 
                title="当前金额" 
                value={goalProgress.goal.currentAmount} 
                precision={2}
                formatter={(value) => formatAmount(Number(value))}
                style={{ marginTop: 16 }}
              />
              <Statistic 
                title="剩余金额" 
                value={goalProgress.remainingAmount} 
                precision={2}
                formatter={(value) => formatAmount(Number(value))}
                style={{ marginTop: 16 }}
              />
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>进度</span>
                  <span>{Math.round(goalProgress.progress)}%</span>
                </div>
                <Progress 
                  percent={Math.round(goalProgress.progress)} 
                  status={goalProgress.progress >= 100 ? 'success' : 'active'}
                />
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Button 
                  type="primary" 
                  onClick={() => handleEdit(goalProgress)}
                  style={{ flex: 1, minWidth: 80 }}
                >
                  编辑
                </Button>
                <Button 
                  onClick={() => {
                    const newAmount = prompt('请输入当前金额', goalProgress.goal.currentAmount.toString())
                    if (newAmount !== null) {
                      const amount = parseFloat(newAmount)
                      if (!isNaN(amount)) {
                        handleUpdateProgress(goalProgress.goal, amount)
                      } else {
                        message.error('请输入有效的金额')
                      }
                    }
                  }}
                  style={{ flex: 1, minWidth: 80 }}
                >
                  更新进度
                </Button>
                <Popconfirm
                  title="确定要删除这个目标吗？"
                  onConfirm={() => handleDelete(goalProgress.goal.id)}
                >
                  <Button danger style={{ flex: 1, minWidth: 80 }}>
                    删除
                  </Button>
                </Popconfirm>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Table
        columns={columns}
        dataSource={goals}
        rowKey={(record) => record.goal.id}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingGoal ? '编辑目标' : '添加目标'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        {modalVisible && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="目标名称"
              rules={[{ required: true, message: '请输入目标名称' }]}
            >
              <Input placeholder="例如：购买新手机" />
            </Form.Item>

            <Form.Item
              name="targetAmount"
              label="目标金额"
              rules={[{ required: true, message: '请输入目标金额' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="¥"
                precision={2}
                min={0.01}
                step={0.01}
                placeholder="0.00"
              />
            </Form.Item>

            <Form.Item
              name="currentAmount"
              label="当前金额"
              rules={[{ required: true, message: '请输入当前金额' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="¥"
                precision={2}
                min={0}
                step={0.01}
                placeholder="0.00"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  label="开始日期"
                  rules={[{ required: true, message: '请选择开始日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="targetDate"
                  label="目标日期"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="描述"
            >
              <TextArea rows={3} placeholder="添加目标描述..." />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}