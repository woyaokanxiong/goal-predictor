import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Button, Empty, Spin } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  TransactionOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { Transaction, CategorySummary } from '../types'
import dayjs from 'dayjs'
import { useFinanceStore } from '../store/finance'

export default function Dashboard() {
  const [hideAmount, setHideAmount] = useState(false)
  const navigate = useNavigate()
  const { dashboardData, loading, fetchDashboardData } = useFinanceStore()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatAmount = (amount: number) => {
    if (hideAmount) return '***'
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  }

  const getPieChartOption = (categories: CategorySummary[]) => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          name: '支出分类',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: categories.map((cat) => ({
            name: cat.categoryName,
            value: cat.amount,
            itemStyle: { color: cat.categoryColor },
          })),
        },
      ],
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>仪表盘</h2>
        <Button
          icon={hideAmount ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          onClick={() => setHideAmount(!hideAmount)}
        >
          {hideAmount ? '显示金额' : '隐藏金额'}
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本月收入"
              value={dashboardData?.summary?.totalIncome || 0}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              formatter={() => formatAmount(dashboardData?.summary?.totalIncome || 0)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本月支出"
              value={dashboardData?.summary?.totalExpense || 0}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              formatter={() => formatAmount(dashboardData?.summary?.totalExpense || 0)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本月结余"
              value={dashboardData?.summary?.balance || 0}
              precision={2}
              valueStyle={{ color: (dashboardData?.summary?.balance || 0) >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={<WalletOutlined />}
              formatter={() => formatAmount(dashboardData?.summary?.balance || 0)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="交易笔数"
              value={dashboardData?.summary?.transactionCount || 0}
              prefix={<TransactionOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="预收入"
              value={dashboardData?.predictions?.predictedIncome || 0}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<RiseOutlined />}
              formatter={() => formatAmount(dashboardData?.predictions?.predictedIncome || 0)}
              suffix={<div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{dashboardData?.predictions?.predictedIncomeBasis || '暂无数据'}</div>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="预支出"
              value={dashboardData?.predictions?.predictedExpense || 0}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<FallOutlined />}
              formatter={() => formatAmount(dashboardData?.predictions?.predictedExpense || 0)}
              suffix={<div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{dashboardData?.predictions?.predictedExpenseBasis || '暂无目标'}</div>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title="资产概览"
            extra={
              <Button type="link" onClick={() => navigate('/accounts')}>
                查看全部
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Statistic
                  title="总资产"
                  value={dashboardData?.accounts?.totalBalance || 0}
                  precision={2}
                  formatter={() => formatAmount(dashboardData?.accounts?.totalBalance || 0)}
                  valueStyle={{ fontSize: 32, color: '#1890ff' }}
                />
              </Col>
              {dashboardData?.accounts?.list?.slice(0, 4).map((account) => (
                <Col xs={24} sm={12} key={account.id}>
                  <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{account.name}</span>
                      <span style={{ fontWeight: 'bold', color: account.color }}>
                        {formatAmount(account.balance)}
                      </span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="支出分类 TOP5"
            extra={
              <Button type="link" onClick={() => navigate('/statistics')}>
                查看详情
              </Button>
            }
          >
            {dashboardData?.topExpenseCategories && dashboardData.topExpenseCategories.length > 0 ? (
              <ReactECharts
                option={getPieChartOption(dashboardData.topExpenseCategories)}
                style={{ height: 300 }}
              />
            ) : (
              <Empty description="暂无支出数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="最近交易"
            extra={
              <Button type="link" onClick={() => navigate('/transactions')}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={dashboardData?.recentTransactions || []}
              renderItem={(item: Transaction) => (
                <List.Item
                  actions={[
                    <Tag color={item.type === 'income' ? 'success' : 'error'}>
                      {item.type === 'income' ? '收入' : '支出'}
                    </Tag>,
                    <span style={{ 
                      color: item.type === 'income' ? '#3f8600' : '#cf1322',
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}>
                      {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount)}
                    </span>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.description || item.categoryName}
                    description={
                      <div>
                        <Tag color={item.categoryColor}>
                          {item.categoryName}
                        </Tag>
                        <span style={{ marginLeft: 8, color: '#999' }}>
                          {item.accountName}
                        </span>
                        <span style={{ marginLeft: 8, color: '#999' }}>
                          {dayjs(item.date).format('MM-DD')}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: <Empty description="暂无交易记录" /> }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}