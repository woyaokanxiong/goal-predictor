import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  List,
  Tag,
  Space,
  Popconfirm,
  message,
  Radio,
  Row,
  Col,
  Empty,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
  CoffeeOutlined,
  CarOutlined,
  ShoppingOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  BookOutlined,
  PhoneOutlined,
  TeamOutlined,
  MoneyCollectOutlined,
  GiftOutlined,
  StockOutlined,
  ClockCircleOutlined,
  MinusOutlined,
} from '@ant-design/icons'
import api from '../utils/api'
import { Category } from '../types'
import { useFinanceStore } from '../store/finance'

const { Option } = Select

const iconOptions = [
  { value: 'coffee', icon: <CoffeeOutlined />, label: '餐饮' },
  { value: 'car', icon: <CarOutlined />, label: '交通' },
  { value: 'shopping', icon: <ShoppingOutlined />, label: '购物' },
  { value: 'home', icon: <HomeOutlined />, label: '居住' },
  { value: 'medicine', icon: <MedicineBoxOutlined />, label: '医疗' },
  { value: 'book', icon: <BookOutlined />, label: '教育' },
  { value: 'phone', icon: <PhoneOutlined />, label: '通讯' },
  { value: 'team', icon: <TeamOutlined />, label: '人情' },
  { value: 'money', icon: <MoneyCollectOutlined />, label: '工资' },
  { value: 'gift', icon: <GiftOutlined />, label: '奖金' },
  { value: 'stock', icon: <StockOutlined />, label: '投资' },
  { value: 'clock', icon: <ClockCircleOutlined />, label: '兼职' },
  { value: 'tag', icon: <TagOutlined />, label: '标签' },
  { value: 'minus', icon: <MinusOutlined />, label: '其他' },
]

const defaultTags = [
  '固定收入', '额外收入', '理财收入', '灵活', '其他',
  '日常支出', '可选支出', '必要支出', '长期投资',
  '餐饮', '出行', '消费', '休闲', '住房', '健康', '学习',
  '通讯', '社交支出', '人情', '月度', '不定期'
]

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form] = Form.useForm()
  const [allTags, setAllTags] = useState<string[]>(defaultTags)

  const { refreshData } = useFinanceStore()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data.data)

      const tagsFromCategories = response.data.data
        .flatMap((cat: Category) => cat.tags || [])
        .filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index)
      setAllTags([...new Set([...defaultTags, ...tagsFromCategories])])
    } catch (error) {
      message.error('获取分类列表失败')
    }
  }

  const handleAdd = () => {
    setEditingCategory(null)
    form.resetFields()
    const defaultTagsForType = activeType === 'expense'
      ? ['日常支出', '可选支出', '必要支出']
      : ['固定收入', '额外收入']
    form.setFieldsValue({
      type: activeType,
      color: '#1890ff',
      icon: 'tag',
      tags: defaultTagsForType,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: Category) => {
    setEditingCategory(record)
    form.setFieldsValue({
      ...record,
      tags: record.tags || [],
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`)
      message.success('删除成功')
      refreshData()
      fetchCategories()
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

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, data)
        message.success('更新成功')
      } else {
        await api.post('/categories', data)
        message.success('创建成功')
      }

      setModalVisible(false)
      refreshData()
      fetchCategories()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const filteredCategories = categories.filter((cat) => cat.type === activeType)

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.value === iconName)
    return iconOption?.icon || <TagOutlined />
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>分类管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加分类
        </Button>
      </div>

      <Radio.Group
        value={activeType}
        onChange={(e) => setActiveType(e.target.value)}
        buttonStyle="solid"
        style={{ marginBottom: 24 }}
      >
        <Radio.Button value="expense">支出分类</Radio.Button>
        <Radio.Button value="income">收入分类</Radio.Button>
      </Radio.Group>

      {filteredCategories.length === 0 ? (
        <Empty description={`暂无${activeType === 'expense' ? '支出' : '收入'}分类`} />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
          dataSource={filteredCategories}
          renderItem={(category) => (
            <List.Item>
              <Card
                hoverable
                size="small"
                style={{ borderLeft: `4px solid ${category.color}` }}
                actions={
                  category.userId !== 'system'
                    ? [
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(category)}
                        />,
                        <Popconfirm
                          title="确定要删除这个分类吗？"
                          onConfirm={() => handleDelete(category.id)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]
                    : undefined
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: category.color + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: category.color,
                    }}
                  >
                    {getIconComponent(category.icon)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{category.name}</div>
                    {category.userId === 'system' && (
                      <Tag color="default">系统</Tag>
                    )}
                    {category.tags && category.tags.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {category.tags.slice(0, 3).map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                        {category.tags.length > 3 && (
                          <Tag>+{category.tags.length - 3}</Tag>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        {modalVisible && (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="type"
              label="分类类型"
              rules={[{ required: true, message: '请选择类型' }]}
            >
              <Radio.Group buttonStyle="solid" disabled={!!editingCategory}>
                <Radio.Button value="expense">支出</Radio.Button>
                <Radio.Button value="income">收入</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="name"
              label="分类名称"
              rules={[{ required: true, message: '请输入分类名称' }]}
            >
              <Input placeholder="例如：餐饮、交通" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="icon"
                  label="图标"
                  rules={[{ required: true, message: '请选择图标' }]}
                >
                  <Select placeholder="选择图标">
                    {iconOptions.map((icon) => (
                      <Option key={icon.value} value={icon.value}>
                        <Space>
                          {icon.icon}
                          {icon.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="color"
                  label="颜色"
                  rules={[{ required: true, message: '请选择颜色' }]}
                >
                  <ColorPicker showText style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="tags"
              label="标签"
              extra="请从预设标签中选择"
            >
              <Select
                mode="multiple"
                placeholder="选择标签"
                style={{ width: '100%' }}
              >
                {allTags.map((tag) => (
                  <Option key={tag} value={tag}>
                    {tag}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}