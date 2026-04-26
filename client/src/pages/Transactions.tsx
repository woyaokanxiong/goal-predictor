import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Radio,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../utils/api'
import { Transaction, Account, Category } from '../types'
import { useFinanceStore } from '../store/finance'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

export default function Transactions() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  // 只有在需要时才创建 form 实例
  const [form] = Form.useForm()
  const [filters, setFilters] = useState({
    type: '',
    accountId: '',
    categoryId: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const { accounts, transactions, refreshData, fetchTransactions } = useFinanceStore()

  useEffect(() => {
    fetchCategories()
    // 使用 store 的 fetchTransactions 方法
    const params: any = {
      page: pagination.current,
      limit: pagination.pageSize,
    }

    if (filters.type) params.type = filters.type
    if (filters.accountId) params.accountId = filters.accountId
    if (filters.categoryId) params.categoryId = filters.categoryId
    if (filters.dateRange) {
      params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
      params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
    }

    fetchTransactions(params)
  }, [pagination.current, pagination.pageSize, filters, fetchTransactions])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data.data)
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const handleAdd = () => {
    setEditingTransaction(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'expense',
      date: dayjs(),
      currency: 'CNY',
      amount: 10.00,
      accountId: accounts.length > 0 ? accounts[0].id : '',
    })
    setModalVisible(true)
  }

  const handleEdit = (record: Transaction) => {
    setEditingTransaction(record)
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`)
      message.success('删除成功')
      refreshData()
      fetchTransactions()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      }

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, data)
        message.success('更新成功')
      } else {
        await api.post('/transactions', data)
        message.success('添加成功')
      }

      setModalVisible(false)
      // 先调用 refreshData() 确保所有数据同步更新
      await refreshData()
      // 然后重新获取交易列表
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      }

      if (filters.type) params.type = filters.type
      if (filters.accountId) params.accountId = filters.accountId
      if (filters.categoryId) params.categoryId = filters.categoryId
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
      }

      fetchTransactions(params)
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination)
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'income' ? 'success' : type === 'expense' ? 'error' : 'processing'}>
          {type === 'income' ? '收入' : type === 'expense' ? '支出' : '转账'}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (name: string, record: Transaction) => (
        <Tag color={record.categoryColor}>{name}</Tag>
      ),
    },
    {
      title: '账户',
      dataIndex: 'accountName',
      key: 'accountName',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Transaction) => (
        <span style={{ 
          color: record.type === 'income' ? '#3f8600' : '#cf1322',
          fontWeight: 'bold',
        }}>
          {record.type === 'income' ? '+' : '-'}
          ¥{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Transaction) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const filteredCategories = categories.filter(
    (cat) => cat.type === (form.getFieldValue('type') || 'expense')
  )

  useEffect(() => {
    if (accounts.length > 0 && form.getFieldValue('accountId') === undefined) {
      form.setFieldsValue({ accountId: accounts[0].id })
    }
  }, [accounts, form])

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>记账管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          记一笔
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Radio.Group
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              buttonStyle="solid"
            >
              <Radio.Button value="">全部</Radio.Button>
              <Radio.Button value="expense">支出</Radio.Button>
              <Radio.Button value="income">收入</Radio.Button>
            </Radio.Group>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择账户"
              allowClear
              style={{ width: '100%' }}
              value={filters.accountId || undefined}
              onChange={(value) => setFilters({ ...filters, accountId: value })}
            >
              {accounts.map((account) => (
                <Option key={account.id} value={account.id}>
                  {account.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: '100%' }}
              value={filters.categoryId || undefined}
              onChange={(value) => setFilters({ ...filters, categoryId: value })}
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates as any })}
            />
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title={editingTransaction ? '编辑交易' : '记一笔'}
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
              name="type"
              label="类型"
              rules={[{ required: true, message: '请选择类型' }]}
            >
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="expense">支出</Radio.Button>
                <Radio.Button value="income">收入</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="amount"
                  label="金额"
                  rules={[{ required: true, message: '请输入金额' }]}
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
              </Col>
              <Col span={12}>
                <Form.Item
                  name="date"
                  label="日期"
                  rules={[{ required: true, message: '请选择日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="accountId"
                  label="账户"
                  rules={[{ required: true, message: '请选择账户' }]}
                >
                  <Select placeholder="选择账户">
                    {accounts.map((account) => (
                      <Option key={account.id} value={account.id}>
                        {account.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="categoryId"
                  label="分类"
                  rules={[{ required: true, message: '请选择分类' }]}
                >
                  <Select placeholder="选择分类">
                    {filteredCategories.map((category) => (
                      <Option key={category.id} value={category.id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="备注"
            >
              <TextArea rows={2} placeholder="添加备注信息..." />
            </Form.Item>

            <Form.Item name="tags" label="标签">
              <Input placeholder="多个标签用逗号分隔" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}