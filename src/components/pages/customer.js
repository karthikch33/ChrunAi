// CustomerDetailPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card, Skeleton, Alert, Tag, Typography, Space, Divider, Row, Col, Empty, Descriptions,
} from "antd";
import {
  ArrowDownOutlined, ArrowUpOutlined, ArrowLeftOutlined, InfoCircleOutlined,
  ShoppingOutlined, BulbOutlined, LineChartOutlined, GiftOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import ScrollProgress from "./ScrollProgress";
import ParallaxHeader from "./ParallaxHeader";

const { Title, Text, Paragraph } = Typography;

// Helpers
const compactIN = (n) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n || 0));
const formatCurrency = (n) => `$${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const sum = (arr) => arr.reduce((a, b) => a + Number(b || 0), 0);

// Motion variants
const pageFlow = { hidden: { opacity: 1 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const rise = { hidden: { y: 22, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.38, ease: "easeOut" } } };
const liftHover = {
  initial: { y: 0, rotateX: 0, rotateY: 0, opacity: 1 },
  hover: { y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.12)", transition: { type: "spring", stiffness: 260, damping: 20 } },
  tap: { scale: 0.985, y: -2, transition: { duration: 0.12 } },
}; // hover pattern

export default function CustomerDetailPage() {
  const { customerNo } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`https://churn-poc.onrender.com/customer-insights/${customerNo}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch customer data");
        return res.json();
      })
      .then((data) => active && setCustomer(data))
      .catch((err) => setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };

//     setCustomer({
//     id: "CUST-1001",
//     name: "Yash Technologies Pvt Ltd",
//     industry: "IT Services",
//     region: "Asia Pacific",
//     segment: "Enterprise",
//     onboardingDate: "2023-02-15",

//     financials: {
//       totalRevenue: 1250000,
//       currentMonthRevenue: 145000,
//       averageOrderValue: 8200,
//       lifetimeValue: 2400000,
//       churnProbability: 0.27
//     },

//     churn_analysis: `
// Customer shows moderate churn risk.
// Usage frequency dropped by 18% in last 2 months.
// Support tickets increased by 12%.
// Payment cycle extended from 30 to 45 days.
//     `,

//     trend_of_sales: `
// Q1 steady growth.
// Q2 spike due to enterprise expansion.
// Q3 slight decline (budget cuts).
// Q4 projected 12% growth based on pipeline.
//     `,

//     retention_strategies: `
// Offer volume-based discount.
// Assign dedicated account manager.
// Provide early access to new product features.
// Offer bundled pricing for enterprise tier.
//     `,

//     Retention_offers: `
// Competitor A pricing: $7800/month
// Competitor B pricing: $7500/month
// Our pricing: $8200/month
// Suggested adjustment: 5% loyalty discount.
//     `,

//     revenueDistribution: [
//       { cluster: "North America", revenue: 450000 },
//       { cluster: "Europe", revenue: 320000 },
//       { cluster: "Asia Pacific", revenue: 480000 }
//     ],

//     orders: [
//       {
//         orderId: "ORD-901",
//         date: "2025-11-01",
//         amount: 9200,
//         status: "Completed"
//       },
//       {
//         orderId: "ORD-902",
//         date: "2025-12-12",
//         amount: 8600,
//         status: "Completed"
//       },
//       {
//         orderId: "ORD-903",
//         date: "2026-01-05",
//         amount: 7900,
//         status: "Pending"
//       }
//     ],
//      best_price_by_material: [
//   {
//     material: "Steel Rod",
//     current_price: 820,
//     competitor_price: 790,
//     suggested_price: 800,
//     margin_impact: "+3.5%",
//     demand_trend: "High",
//     recommendation: "Reduce slightly to stay competitive"
//   },
//   {
//     material: "Aluminium Sheet",
//     current_price: 650,
//     competitor_price: 640,
//     suggested_price: 645,
//     margin_impact: "+2.1%",
//     demand_trend: "Medium",
//     recommendation: "Maintain with minor adjustment"
//   },
//   {
//     material: "Copper Wire",
//     current_price: 1100,
//     competitor_price: 1080,
//     suggested_price: 1075,
//     margin_impact: "-1.2%",
//     demand_trend: "Low",
//     recommendation: "Lower to avoid churn risk"
//   }
// ]
//   },
// )

  }, [customerNo]);


  const revenueByQuarter = useMemo(() => {
    if (!customer?.revenue_by_quarter) return [];
    return Object.entries(customer.revenue_by_quarter).map(([key, value]) => ({ key, value: Number(value) }));
  }, [customer]);

  const revenueByYear = useMemo(() => {
    if (!customer?.revenue_by_year) return [];
    return Object.entries(customer.revenue_by_year)
      .map(([key, value]) => ({ key, value: Number(value) }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [customer]);

  const totals = useMemo(() => {
    const yearlyValues = revenueByYear.map((d) => d.value);
    const total = sum(yearlyValues);
    const latest = yearlyValues[yearlyValues.length - 1] || 0;
    const prev = yearlyValues[yearlyValues.length - 2] || 0;
    const deltaAbs = latest - prev;
    const deltaPct = prev ? (deltaAbs / prev) * 100 : 0;
    return { total, latest, prev, deltaAbs, deltaPct };
  }, [revenueByYear]);

  const Delta = ({ pct }) => {
    const up = pct >= 0;
    const Icon = up ? ArrowUpOutlined : ArrowDownOutlined;
    return (
      <Tag color={up ? "green" : "red"} style={{ marginInlineStart: 8 }}>
        <Icon /> {Math.abs(pct).toFixed(1)}%
      </Tag>
    );
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 8 }} /></div>;
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Could not load customer" description={error} showIcon />
        <div style={{ marginTop: 12 }}>
          <Link to="/customers"><ArrowLeftOutlined /> Back to list</Link>
        </div>
      </div>
    );
  }
  if (!customer) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Customer data not found" />
        <div style={{ marginTop: 12 }}>
          <Link to="/customers"><ArrowLeftOutlined /> Back to list</Link>
        </div>
      </div>
    );
  }

  const churnColor = String(customer.churn).toLowerCase().includes("high") ? "red" : "gold";

  // Normalize observations/recommendations: prefer arrays of {key, value}; fallback to string if needed.
  const obsList = Array.isArray(customer.observation)
    ? customer.observation
    : customer.observation
      ? [{ key: "Observation", value: String(customer.observation) }]
      : [];

  const recList = Array.isArray(customer.recommendation)
    ? customer.recommendation
    : customer.recommendation
      ? [{ key: "Recommendation", value: String(customer.recommendation) }]
      : [];

  return (
    <>
      <ScrollProgress />
      <div style={{
        padding: 24, display: "grid", gap: 16, background:'rgba(249, 250, 251, 1)'
      }}>
        {/* Header with parallax */}
        <Card>
          <ParallaxHeader>
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.4, once: false }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <Space size={12} align="start">
                  <Title level={3} style={{ margin: "0 0 10px" }}>Customer Insights</Title>
                  <Tag color="blue">{customer.customer}</Tag>
                  <Tag color="default">Cluster: {customer.cluster}</Tag>
                  <Tag color={churnColor}>Churn: {customer.churn}</Tag>
                </Space>
                <Link to="/customers"><ArrowLeftOutlined /> Back</Link>
              </div>
              {/* KPI strip */}
              <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
                <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                  <Card style={{background: 'rgba(249, 250, 251, 1)'}}>
                    <Row gutter={[16, 16]} className="align-items-stretch">
                      <Col xs={24} sm={12} md={6} className="h-100">
                        <Card className="h-100">
                          <KPI label="Total Revenue" value={formatCurrency(totals.total)} hint="All years combined" icon="/revanue-detail.png" />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card className="h-100">
                          <KPI label="Latest Year" value={formatCurrency(totals.latest)}
                            extra={<Delta pct={((totals.latest - totals.prev) / (totals.prev || 1)) * 100} />} icon="/latest-year.png" />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card className="h-100">
                          <KPI label="Previous Year" value={formatCurrency(totals.prev)} icon="/previous-year.png" />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card className="h-100">
                          <KPI label="Materials Priced" value={String(customer.best_price_by_material?.length || 0)} hint="Suggestions available" icon="/material-price.png" />
                        </Card>
                      </Col>
                    </Row>
                  </Card>
                </motion.div>
              </motion.div>
            </motion.div>
          </ParallaxHeader>
        </Card>



        {/* Overview */}
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
          <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
            <Card style={{background: 'rgba(239, 246, 255, 1)'}}>
              <Title level={3} style={{ margin: "0 0 10px" }}>Purchase Details</Title>
              <Descriptions size="middle" colon={false} column={{ xs: 1, sm: 1, md: 2 }} labelStyle={{ color: "rgba(0,0,0,0.65)" }}>
                <Descriptions.Item label="Customer">{customer.customer}</Descriptions.Item>
                <Descriptions.Item label="Cluster">{customer.cluster}</Descriptions.Item>
                <Descriptions.Item label="Churn"><Tag color={churnColor}>{customer.churn}</Tag></Descriptions.Item>
                <Descriptions.Item label="Purchase Details" span={3}>
                  <Text type="secondary" className="purchase-detail-content" style={{ fontWeight: 'bold', fontSize:'20px', color:'rgba(16, 24, 40, 1)'}}>{customer.Purchase_details}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
              <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                <Card title="Revenue by Quarter" extra={<MiniLegend />}>
                  {revenueByQuarter.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueByQuarter}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="key" />
                        <YAxis tickFormatter={compactIN} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="value" fill="#1976d2" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No quarterly data" />
                  )}
                </Card>
              </motion.div>
            </motion.div>
          </Col>
          <Col xs={24} md={12}>
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
              <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                <Card title="Revenue by Year" extra={<MiniLegend />}>
                  {revenueByYear.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueByYear}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="key" />
                        <YAxis tickFormatter={compactIN} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="value" fill="#2e7d32" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No yearly data" />
                  )}
                </Card>
              </motion.div>
            </motion.div>
          </Col>
        </Row>

        {/* Insight cards with container stagger */}
        <motion.div
          variants={pageFlow}
          initial="hidden"
          whileInView="show"
          viewport={{ amount: 0.2, once: false }}
        >
          <Row gutter={[16, 16]}>
            {[
              { title: "Churn Analysis", icon: <InfoCircleOutlined />, text: customer.churn_analysis },
              { title: "Sales Trend", icon: <LineChartOutlined />, text: customer.trend_of_sales },
              { title: "Retention Strategy", icon: <BulbOutlined />, text: customer.retention_strategies },
              { title: "Competitor Pricing", icon: <GiftOutlined />, text: customer.Retention_offers },
            ].map((c, i) => (
              <Col xs={24} md={12} lg={6} key={i}>
                <motion.div variants={rise}>
                  <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                    <Card
                    title={<Space>{c.icon}<span>{c.title}</span></Space>}
                    style={{
                      height: "150px",              // fixed height (adjust as needed)
                      display: "flex",
                      flexDirection: "column"
                    }}
                    bodyStyle={{
                      flex: 1,
                      overflowY: "auto"
                    }}
                  >
                    <Paragraph style={{ marginBottom: 0 }}>
                      {c.text}
                    </Paragraph>
                  </Card>
                  </motion.div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        {/* Product combination */}
        {customer.product_combination && (
          <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
            <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
              <Card title={<Title level={5} style={{ margin: 0 }}><ShoppingOutlined /> Product Combination</Title>}>
                <Paragraph style={{ marginBottom: 0 }}>{customer.product_combination}</Paragraph>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Best price suggestions */}
        {customer.best_price_by_material?.length > 0 && (
          <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
            <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
             <Card
  title={<Title level={5} style={{ margin: 0 }}>Best Price Suggestions</Title>}
  bodyStyle={{ padding: 0 }}
>
  <Divider style={{ margin: 0 }} />

  <div style={{ padding: "16px" }}>
    {/* Header */}
    <div className="price-table-header">
      <span>Material</span>
      <span>Current</span>
      <span>Competitor</span>
      <span>Suggested</span>
      <span>Margin</span>
      <span>Demand</span>
      <span>Recommendation</span>
    </div>

    {/* Rows */}
    {customer.best_price_by_material.map((item, idx) => (
      <div className="price-table-row" key={idx}>
        <span>{item.material}</span>
        <span>{item.current_price}</span>
        <span>{item.competitor_price}</span>
        <span style={{ fontWeight: 600, color: "#1677ff" }}>
          {item.suggested_price}
        </span>
        <span
          style={{
            color: item.margin_impact.includes("-") ? "#ff4d4f" : "#52c41a"
          }}
        >
          {item.margin_impact}
        </span>
        <span>{item.demand_trend}</span>
        <span style={{ fontSize: 12, color: "#888" }}>
          {item.recommendation}
        </span>
      </div>
    ))}
  </div>
</Card>

            </motion.div>
          </motion.div>
        )}

        {/* Observations & Recommendations — from array of {key,value} */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
              <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                <AnimatedKeyValueList title="Observations" data={obsList} icon={'/observation.png'} className="observations-list" />
              </motion.div>
            </motion.div>
          </Col>
          <Col xs={24} md={12}>
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
              <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                <AnimatedKeyValueList title="Recommendations" data={recList} icon={"/recommendations.png"} className="recommendation-list" />
              </motion.div>
            </motion.div>
          </Col>
        </Row>
      </div>
    </>
  );
}

// Small components
function KPI({ label, value, hint, extra, icon }) {
  return (
    <div style={{ display: "grid", gap: 4, alignItems:'stretch', height:'100%' }}>
      <Text type="secondary" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: 'space-between',
        fontSize: 14, color: "rgba(74, 85, 101, 1)", fontWeight: 700,
        height:'100%'
      }}>{label} {icon && <img src={icon} alt="Revenue Detail" />}</Text>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Title level={4} style={{
          margin: 0, fontSize: 20, fontWeight: 700, color: "rgba(16, 24, 40, 1)"
        }}>{value}</Title>
        {extra}
      </div>
      {hint && <Text type="secondary" style={{ fontSize: 12 }}>{hint}</Text>}
    </div>
  );
}

function MiniLegend() {
  return <Text type="secondary" style={{ fontSize: 12 }}>Values in DOLLARS</Text>;
}

function SuggestionRow({ item }) {
  const price = Number(item.suggested_price || 0);
  const current_price = Number(item.current_price || 0);
  const discount = String(item.discount || "");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
      <div style={{ minWidth: 0 }}>
        <Text strong style={{ display: "block" }}>{item.material}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>Suggested</Text>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Tag color="blue">{formatCurrency(current_price)}</Tag>
        <Tag color="green">{formatCurrency(price)}</Tag>
        <Tag>{discount}&darr;</Tag>
      </div>
    </div>
  );
}

/* ---------------- Animated list for {key, value} arrays ---------------- */

function AnimatedKeyValueList({ title, data, icon, ...props }) {
  const list = {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { y: 10, opacity: 0, scale: 0.98 },
    show: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.22, ease: "easeOut" } },
    exit: { y: 6, opacity: 0, scale: 0.98, transition: { duration: 0.12 } },
  };

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <img src={icon} alt={title} />}
        {title}
      </span>}>
        <Empty description="No data available" />
      </Card>
    );
  }

  return (
    <Card {...props} title={
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <img src={icon} alt={title} style={{ width: 24, height: 24 }} />}
        {title}
      </span>
    }>
      <motion.div
        variants={list}
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.25, once: false }}
        style={{ display: "grid", gap: 12 }}
        role="list"
      >
        <AnimatePresence initial={false}>
          {data.map((row, idx) => {
            const k = row?.key ?? `Item ${idx + 1}`;
            const v = row?.value ?? "";
            return (
              <motion.div
                key={`${idx}-${k.slice(0, 30)}`}
                variants={item}
                exit="exit"
                style={{ display: "grid", gap: 4 }}
                role="listitem"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Text strong style={{ fontSize: 14 }}><span className="circle"></span>{k}</Text>  
                <Paragraph style={{ margin: 0 }} type="secondary">{v}</Paragraph>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Card>
  );
}
