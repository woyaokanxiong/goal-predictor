import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  ColorPicker,
  List,
  Tag,
  Space,
  Popconfirm,
  message,
  Statistic,
  Row,
  Col,
  Empty,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WalletOutlined,
  BankOutlined,
  CreditCardOutlined,
  StockOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import api from '../utils/api'
import { Account } from '../types'
import { useFinanceStore } from '../store/finance'

const { Option } = Select

const accountTypes = [
  { value: 'cash', label: '现金', icon: <WalletOutlined />, color: '#52c41a' },
  { value: 'bank', label: '银行卡', icon: <BankOutlined />, color: '#1890ff' },
  { value: 'credit', label: '信用卡', icon: <CreditCardOutlined />, color: '#ff4d4f' },
  { value: 'investment', label: '投资', icon: <StockOutlined />, color: '#722ed1' },
  { value: 'other', label: '其他', icon: <MoreOutlined />, color: '#faad14' },
]

export default function Accounts() {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [form] = Form.useForm()

  const { accounts, refreshData, fetchAccounts } = useFinanceStore()

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleAdd = () => {
    setEditingAccount(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'cash',
      currency: 'CNY',
      color: '#1890ff',
      balance: 0,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: Account) => {
    setEditingAccount(record)
    form.setFieldsValue({
      ...record,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/accounts/${id}`)
      message.success('删除成功')
      refreshData()
      fetchAccounts()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        color: typeof values.color === 'string' ? values.color : values.color.toHexString(),
      }

      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, data)
        message.success('更新成功')
      } else {
        await api.post('/accounts', data)
        message.success('创建成功')
      }

      setModalVisible(false)
      refreshData()
      fetchAccounts()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  const getAccountIcon = (type: string) => {
    const accountType = accountTypes.find((t) => t.value === type)
    return accountType?.icon || <WalletOutlined />
  }

  const getAccountTypeLabel = (type: string) => {
    return accountTypes.find((t) => t.value === type)?.label || type
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>账户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加账户
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Statistic
          title="总资产"
          value={totalBalance}
          precision={2}
          prefix="¥"
          valueStyle={{ fontSize: 36, color: '#1890ff' }}
          formatter={(value) => value?.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        />
      </Card>

      {accounts.length === 0 ? (
        <Empty description="暂无账户，请添加账户" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
          dataSource={accounts}
          renderItem={(account) => (
            <List.Item>
              <Card
                hoverable
                style={{ borderTop: `4px solid ${account.color}` }}
                actions={[
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(account)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确定要删除这个账户吗？"
                    description="删除后该账户的交易记录将保留，但账户将不再显示"
                    onConfirm={() => handleDelete(account.id)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: account.color + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: account.color,
                      }}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                  }
                  title={account.name}
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Tag color="default">{getAccountTypeLabel(account.type)}</Tag>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 'bold',
                          color: account.balance >= 0 ? '#3f8600' : '#cf1322',
                        }}
                      >
                        ¥{account.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {account.currency}
                      </div>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editingAccount ? '编辑账户' : '添加账户'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        {modalVisible && (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="账户名称"
              rules={[{ required: true, message: '请输入账户名称' }]}
            >
              <Input placeholder="例如：工资卡、现金钱包" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="账户类型"
                  rules={[{ required: true, message: '请选择账户类型' }]}
                >
                  <Select placeholder="选择类型">
                    {accountTypes.map((type) => (
                      <Option key={type.value} value={type.value}>
                        <Space>
                          {type.icon}
                          {type.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="currency"
                  label="货币"
                  rules={[{ required: true, message: '请选择货币' }]}
                >
                  <Select placeholder="选择货币">
                    <Option value="CNY">人民币 (CNY)</Option>
                    <Option value="USD">美元 (USD)</Option>
                    <Option value="EUR">欧元 (EUR)</Option>
                    <Option value="JPY">日元 (JPY)</Option>
                    <Option value="HKD">港币 (HKD)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="balance"
                  label="初始余额"
                  rules={[{ required: true, message: '请输入余额' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="¥"
                    precision={2}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="color"
                  label="颜色标识"
                  rules={[{ required: true, message: '请选择颜色' }]}
                >
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>
    </div>
  )
}