import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Progress,
  List,
  Tag,
  Space,
  Popconfirm,
  message,
  Empty,
  Statistic,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons'
import api from '../utils/api'
import { Budget, BudgetProgress, Category } from '../types'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

const periodOptions = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
]

export default function Budgets() {
  const [budgets, setBudgets] = useState<BudgetProgress[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
  }, [])

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const response = await api.get('/budgets')
      setBudgets(response.data.data)
    } catch (error) {
      message.error('获取预算列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories', { params: { type: 'expense' } })
      setCategories(response.data.data)
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const handleAdd = () => {
    setEditingBudget(null)
    form.resetFields()
    form.setFieldsValue({
      period: 'monthly',
      startDate: dayjs(),
      amount: 1000,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: Budget) => {
    setEditingBudget(record)
    form.setFieldsValue({
      ...record,
      startDate: dayjs(record.startDate),
      endDate: record.endDate ? dayjs(record.endDate) : null,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}`)
      message.success('删除成功')
      fetchBudgets()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
      }

      if (editingBudget) {
        await api.put(`/budgets/${editingBudget.id}`, data)
        message.success('更新成功')
      } else {
        await api.post('/budgets', data)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchBudgets()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const getProgressStatus = (percentage: number) => {
    if (percentage >= 100) return 'exception'
    if (percentage >= 80) return 'warning'
    return 'success'
  }

  const totalBudget = budgets.reduce((sum, item) => sum + item.budget.amount, 0)
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>预算管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          设置预算
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总预算"
              value={totalBudget}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="已支出"
              value={totalSpent}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="剩余"
              value={totalRemaining}
              precision={2}
              prefix="¥"
              valueStyle={{ color: totalRemaining >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {budgets.length === 0 ? (
        <Empty description="暂无预算，请设置预算" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }}
          dataSource={budgets}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.budget.categoryName && (
                      <Tag color={item.budget.categoryColor}>
                        {item.budget.categoryName}
                      </Tag>
                    )}
                    <span>{item.budget.name}</span>
                  </div>
                }
                extra={
                  <Space>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(item.budget)}
                    />
                    <Popconfirm
                      title="确定要删除这个预算吗？"
                      onConfirm={() => handleDelete(item.budget.id)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
              >
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>预算: ¥{item.budget.amount.toLocaleString()}</span>
                    <span style={{ color: item.percentage >= 100 ? '#cf1322' : '#666' }}>
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    percent={item.percentage}
                    status={getProgressStatus(item.percentage)}
                    strokeColor={item.budget.categoryColor}
                    showInfo={false}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                    <span style={{ color: '#cf1322' }}>已用: ¥{item.spent.toLocaleString()}</span>
                    <span style={{ color: '#3f8600' }}>剩余: ¥{item.remaining.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#999' }}>
                  <div>周期: {periodOptions.find((p) => p.value === item.budget.period)?.label}</div>
                  <div>开始: {dayjs(item.budget.startDate).format('YYYY-MM-DD')}</div>
                  {item.budget.endDate && (
                    <div>结束: {dayjs(item.budget.endDate).format('YYYY-MM-DD')}</div>
                  )}
                </div>

                {item.percentage >= 100 && (
                  <div style={{ marginTop: 12, color: '#cf1322', fontSize: 12 }}>
                    <WarningOutlined /> 预算已超支
                  </div>
                )}
                {item.percentage >= 80 && item.percentage < 100 && (
                  <div style={{ marginTop: 12, color: '#faad14', fontSize: 12 }}>
                    <WarningOutlined /> 预算即将用完
                  </div>
                )}
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editingBudget ? '编辑预算' : '设置预算'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        {modalVisible && (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="预算名称"
              rules={[{ required: true, message: '请输入预算名称' }]}
            >
              <Input placeholder="例如：月度餐饮预算" />
            </Form.Item>

            <Form.Item
              name="categoryId"
              label="关联分类（可选）"
            >
              <Select placeholder="选择分类" allowClear>
                {categories.map((category) => (
                  <Option key={category.id} value={category.id}>
                    <Tag color={category.color}>{category.name}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="amount"
                  label="预算金额"
                  rules={[{ required: true, message: '请输入预算金额' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="¥"
                    precision={2}
                    min={0}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="period"
                  label="预算周期"
                  rules={[{ required: true, message: '请选择周期' }]}
                >
                  <Select placeholder="选择周期">
                    {periodOptions.map((period) => (
                      <Option key={period.value} value={period.value}>
                        {period.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

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
                  name="endDate"
                  label="结束日期（可选）"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>
    </div>
  )
}