import { useState, useEffect } from 'react'
import {
  Card,
  DatePicker,
  Radio,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  Tabs,
  List,
  Tag,
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import api from '../utils/api'
import { TransactionSummary, CategorySummary, TimeSeriesData } from '../types'

const { RangePicker } = DatePicker

export default function Statistics() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [expenseCategories, setExpenseCategories] = useState<CategorySummary[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategorySummary[]>([])
  const [trendData, setTrendData] = useState<TimeSeriesData[]>([])
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')

  useEffect(() => {
    fetchStatistics()
  }, [dateRange, groupBy])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')

      const [summaryRes, expenseRes, incomeRes, trendRes] = await Promise.all([
        api.get('/statistics/summary', { params: { startDate, endDate } }),
        api.get('/statistics/by-category', { params: { startDate, endDate, type: 'expense' } }),
        api.get('/statistics/by-category', { params: { startDate, endDate, type: 'income' } }),
        api.get('/statistics/trend', { params: { startDate, endDate, groupBy } }),
      ])

      setSummary(summaryRes.data.data)
      setExpenseCategories(expenseRes.data.data.list)
      setIncomeCategories(incomeRes.data.data.list)
      setTrendData(trendRes.data.data.list)
    } catch (error) {
      console.error('Fetch statistics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPieChartOption = (categories: CategorySummary[], title: string) => {
    return {
      title: {
        text: title,
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>金额: ¥${params.value.toLocaleString()}<br/>占比: ${params.percent}%`
        },
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
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
            value: cat.amount,
            name: cat.categoryName,
            itemStyle: { color: cat.categoryColor },
          })),
        },
      ],
    }
  }

  const getTrendChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: ['收入', '支出', '结余'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.map((item) => item.date),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `¥${value}`,
        },
      },
      series: [
        {
          name: '收入',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: { focus: 'series' },
          data: trendData.map((item) => item.income),
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '支出',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: { focus: 'series' },
          data: trendData.map((item) => item.expense),
          itemStyle: { color: '#ff4d4f' },
        },
        {
          name: '结余',
          type: 'line',
          emphasis: { focus: 'series' },
          data: trendData.map((item) => item.balance),
          itemStyle: { color: '#1890ff' },
        },
      ],
    }
  }

  const tabItems = [
    {
      key: '1',
      label: '支出分析',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="支出分类占比">
              {expenseCategories.length > 0 ? (
                <ReactECharts
                  option={getPieChartOption(expenseCategories, '支出分类')}
                  style={{ height: 350 }}
                />
              ) : (
                <Empty description="暂无支出数据" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="支出分类排行">
              {expenseCategories.length > 0 ? (
                <List
                  dataSource={expenseCategories.slice(0, 10)}
                  renderItem={(item) => (
                    <List.Item>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Tag color={item.categoryColor} style={{ minWidth: 80, textAlign: 'center' }}>
                          {item.categoryName}
                        </Tag>
                        <div style={{ flex: 1, marginLeft: 16 }}>
                          <div
                            style={{
                              height: 8,
                              backgroundColor: '#f0f0f0',
                              borderRadius: 4,
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${item.percentage}%`,
                                backgroundColor: item.categoryColor,
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ marginLeft: 16, minWidth: 100, textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold' }}>¥{item.amount.toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>{item.percentage}%</div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无支出数据" />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: '2',
      label: '收入分析',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="收入分类占比">
              {incomeCategories.length > 0 ? (
                <ReactECharts
                  option={getPieChartOption(incomeCategories, '收入分类')}
                  style={{ height: 350 }}
                />
              ) : (
                <Empty description="暂无收入数据" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="收入分类排行">
              {incomeCategories.length > 0 ? (
                <List
                  dataSource={incomeCategories.slice(0, 10)}
                  renderItem={(item) => (
                    <List.Item>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Tag color={item.categoryColor} style={{ minWidth: 80, textAlign: 'center' }}>
                          {item.categoryName}
                        </Tag>
                        <div style={{ flex: 1, marginLeft: 16 }}>
                          <div
                            style={{
                              height: 8,
                              backgroundColor: '#f0f0f0',
                              borderRadius: 4,
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${item.percentage}%`,
                                backgroundColor: item.categoryColor,
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ marginLeft: 16, minWidth: 100, textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold' }}>¥{item.amount.toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>{item.percentage}%</div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无收入数据" />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: '3',
      label: '收支趋势',
      children: (
        <Card
          title="收支趋势图"
          extra={
            <Radio.Group
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="day">按日</Radio.Button>
              <Radio.Button value="week">按周</Radio.Button>
              <Radio.Button value="month">按月</Radio.Button>
            </Radio.Group>
          }
        >
          {trendData.length > 0 ? (
            <ReactECharts
              option={getTrendChartOption()}
              style={{ height: 400 }}
            />
          ) : (
            <Empty description="暂无数据" />
          )}
        </Card>
      ),
    },
  ]

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
        <h2 style={{ margin: 0 }}>统计报表</h2>
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总收入"
              value={summary?.totalIncome || 0}
              precision={2}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => `¥${(value as number).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总支出"
              value={summary?.totalExpense || 0}
              precision={2}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
              formatter={(value) => `¥${(value as number).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="净结余"
              value={summary?.balance || 0}
              precision={2}
              prefix={<WalletOutlined />}
              valueStyle={{ color: (summary?.balance || 0) >= 0 ? '#3f8600' : '#cf1322' }}
              formatter={(value) => `¥${(value as number).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" items={tabItems} />
    </div>
  )
}