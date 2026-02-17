// CustomerDetailPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card, Skeleton, Alert, Tag, Typography, Space, Divider, Row, Col, Empty, Descriptions,
  Table,
} from "antd";
import {
  ArrowDownOutlined, ArrowUpOutlined, ArrowLeftOutlined, InfoCircleOutlined,
  ShoppingOutlined, BulbOutlined, LineChartOutlined, GiftOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Line,
  LineChart,
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
  const [customer, setCustomer] = useState({
    "customer": "1001",
    "cluster": "low_revenue",
    "churn": "yes",
    "churn_analysis": "Revenue plummeted 98% from 2024 to 2025. Account at severe churn risk, requiring immediate intervention.",
    "retention_strategies": "Aggressive win-back, value-based pricing, executive relationship, product portfolio diversification.",
    "Retention_offers": "Targeted discounts, volume commitments, bundled solutions, premium service tiers.",
    "Purchase_details": "ReactoMax ($9.18B), CatalyPro ($7.45B), ThermoFlux ($4.18B) are frequent high-value purchases.",
    "revenue_by_year": {
        "2024": 42287622800.0,
        "2025": 665588200.0
    },
    "revenue_by_quarter": {
        "2024-Q3": 22937254500.0,
        "2024-Q4": 19350368300.0,
        "2025-Q3": 589976300.0,
        "2025-Q4": 75611900.0
    },
    "trend_of_sales": "Strong Q3-Q4 2024 performance, followed by a dramatic 98% decline in 2025, indicating severe loss of business.",
    "product_combination": "Industrial Solvent often co-purchased with Organic Reagent and Polyethylene Compound.",
    "best_price_by_material": [
        {
            "material": "ReactoMax",
            "current_price": 8140.0,
            "suggested_price": 7733.0,
            "discount": "5%"
        },
        {
            "material": "CatalyPro",
            "current_price": 5400.0,
            "suggested_price": 5130.0,
            "discount": "5%"
        },
        {
            "material": "ThermoFlux",
            "current_price": 4300.0,
            "suggested_price": 4085.0,
            "discount": "5%"
        },
        {
            "material": "HydroSil",
            "current_price": 1891.0,
            "suggested_price": 1796.45,
            "discount": "5%"
        }
    ],
    "observation": [
        {
            "key": "Critical Revenue Decline",
            "value": "Customer revenue dropped 98% from 2024 to 2025, signaling an immediate and significant loss of business."
        },
        {
            "key": "Anchor Product Reliance",
            "value": "ReactoMax and CatalyPro represented over 38% of 2024 revenue, indicating core product dependency."
        },
        {
            "key": "High-Margin Opportunities",
            "value": "Products like HydroSil (50.5% margin) and ReactoMax (46.1% margin) offer profit retention potential."
        },
        {
            "key": "Co-Purchase Synergies",
            "value": "Identified co-purchase pairs suggest bundling opportunities to expand share of wallet."
        },
        {
            "key": "Historical Cadence",
            "value": "Account historically showed consistent monthly purchasing in 2024, implying a disrupted procurement cycle."
        }
    ],
    "recommendation": [
        {
            "key": "Executive Intervention",
            "value": "Initiate immediate executive-level contact to understand the severe revenue drop and re-establish trust."
        },
        {
            "key": "Targeted Win-Back Offer",
            "value": "Propose a competitive 5% discount on anchor products (ReactoMax, CatalyPro, ThermoFlux, HydroSil) to incentivize re-engagement."
        },
        {
            "key": "Strategic Product Bundling",
            "value": "Create bundled offers for co-purchased items (e.g., Industrial Solvent, Organic Reagent) to increase wallet share."
        },
        {
            "key": "Enhanced Value Proposition",
            "value": "Articulate non-price value like supply chain reliability, technical support, and partnership benefits."
        },
        {
            "key": "ROI for Q1 2026",
            "value": "Projecting a 2% recovery of 2024's average quarterly run rate in Q1 2026 could add $200M+ revenue."
        }
    ]
});

  // useEffect(() => {
  //   let active = true;
  //   setLoading(true);
  //   setError(null);
  //   fetch(`https://churn-poc.onrender.com/customer-insights/${customerNo}`)
  //     .then((res) => {
  //       if (!res.ok) throw new Error("Failed to fetch customer data");
  //       return res.json();
  //     })
  //     .then((data) => active && setCustomer(data))
  //     .catch((err) => setError(err.message))
  //     .finally(() => active && setLoading(false));
  //   return () => { active = false; };

    
  // }, [customerNo]);


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
            <Card style={{background: 'rgba(239, 246, 255, 1)'}} className="purchase-detail-wrapper">
              <Title level={5} style={{ margin: "0 0 10px" }}>Purchase Details</Title>
              <Descriptions size="middle" colon={false} column={{ xs: 1, sm: 1, md: 2 }} labelStyle={{ color: "rgba(0,0,0,0.65)" }}>
                <Descriptions.Item label="Customer">{customer.customer}</Descriptions.Item>
                <Descriptions.Item label="Cluster">{customer.cluster}</Descriptions.Item>
                <Descriptions.Item label="Churn"><Tag color={churnColor}>{customer.churn}</Tag></Descriptions.Item>
                <Descriptions.Item label="Purchase Details" span={3} className="purchase-detail-content">
                  <Text type="secondary"  style={{ fontWeight: 'bold', fontSize:'20px', color:'rgba(16, 24, 40, 1)'}}>{customer.Purchase_details}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts */}
        <Card style={{ background:'#fff'}} title="Predictions & Analytics">
         
        
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
              <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                  <Card
                   style={{ background: "rgba(249, 250, 251, 1)" }}
                   headStyle={{ position: "relative" }}
                   title={
                     <div
                       style={{
                         textAlign: "center",
                         fontWeight: 600,
                         fontSize: 16,
                         color: "#000",
                       }}
                     >
                       Revenue by Quarter
                     </div>
                   }
                   extra={
                     <div style={{ position: "absolute", right: 24, top: 16 }}>
                       <MiniLegend />
                     </div>
                   }  
                  >
                  {revenueByQuarter.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={revenueByQuarter}
                      margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid
                        stroke="#E5E7EB"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                  
                    <XAxis
                      dataKey="key"
                      axisLine={{ stroke: "#374151", strokeWidth: 1.5 }}
                      tickLine={{ stroke: "#374151" }}
                      tick={{ fill: "#111827", fontSize: 14, fontWeight: 500 }}
                    />

                    <YAxis
                      width={80}
                      axisLine={{ stroke: "#374151", strokeWidth: 1.5 }}
                      tickLine={{ stroke: "#374151" }}
                      tickFormatter={(value) => value.toLocaleString("en-IN")}
                      tick={{ fill: "#111827", fontSize: 14, fontWeight: 500 }}
                    />
                  
                      <Tooltip
                        formatter={(v) => v.toLocaleString("en-IN")}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                        }}
                      />
                  
                      <Bar
                        dataKey="value"
                        fill="#2B8CBE"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      />
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
                  <Card 
                   style={{ background: "rgba(249, 250, 251, 1)" }}
                   headStyle={{ position: "relative" }}
                   title={
                     <div
                       style={{
                         textAlign: "center",
                         fontWeight: 600,
                         fontSize: 16,
                         color: "#374151",
                       }}
                     >
                       Revenue by Year
                     </div>
                   }
                   extra={
                     <div style={{ position: "absolute", right: 24, top: 16 }}>
                       <MiniLegend />
                     </div>
                   }  
                  >
                  {revenueByYear.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={revenueByYear}
                      margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid
                        stroke="#E5E7EB"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                  
                      <XAxis
                        dataKey="key"
                        axisLine={{ stroke: "#374151", strokeWidth: 1.5 }}
                        tickLine={{ stroke: "#374151" }}
                        tick={{ fill: "#111827", fontSize: 14, fontWeight: 500 }}
                      />
                  
                      <YAxis
                        width={90}
                        axisLine={{ stroke: "#374151", strokeWidth: 1.5 }}
                        tickLine={{ stroke: "#374151" }}
                        tickFormatter={(value) => value.toLocaleString("en-IN")}
                        tick={{ fill: "#111827", fontSize: 14, fontWeight: 500 }}
                      />
                  
                      <Tooltip
                        formatter={(v) => v.toLocaleString("en-IN")}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                        }}
                      />
                  
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2F80ED"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          stroke: "#2F80ED",
                          strokeWidth: 2,
                          fill: "#ffffff",
                        }}
                        activeDot={{
                          r: 7,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No yearly data" />
                  )}
                </Card>
              </motion.div>
            </motion.div>
          </Col>
        </Row>
        </Card>

        {/* Insight cards with container stagger */}
        <motion.div
          variants={pageFlow}
          initial="hidden"
          whileInView="show"
          viewport={{ amount: 0.2, once: false }}
        >
          <Row gutter={[16, 16]}>
            {[
              { title: "Churn Analysis", icon: <InfoCircleOutlined />, text: customer.churn_analysis, className :'bg-orange-light' },
              { title: "Sales Trend", icon: <LineChartOutlined />, text: customer.trend_of_sales, className: 'bg-blue-light' },
              { title: "Retention Strategy", icon: <BulbOutlined />, text: customer.retention_strategies, className: 'bg-blue-light' },
              { title: "Competitor Pricing", icon: <GiftOutlined />, text: customer.Retention_offers, className: 'bg-orange-light' },
            ].map((c, i) => (
              <Col xs={24} md={12} lg={12} key={i} className="h-100">
                <motion.div variants={rise}>
                  <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                    <Card className={c.className} title={<Space>{c.icon}<span>{c.title}</span></Space>}>
                      <Paragraph style={{ marginBottom: 0, fontWeight:700 }}>{c.text}</Paragraph>
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
              <Card title={<Title level={5} style={{ margin: 0 }}>Best Price Suggestions</Title>} bodyStyle={{ paddingTop: 0 }}>

                <Table
                  dataSource={customer.best_price_by_material}
                  pagination={false}
                  rowKey="material"
                  bordered={false}
                  columns={[
                    {
                      title: "Product Name",
                      dataIndex: "material",
                      key: "material",
                    },
                    {
                      title: "Current Sales Price",
                      dataIndex: "current_price",
                      key: "current_price",
                      render: (value) =>
                        formatCurrency(Number(value || 0)),
                    },
                    {
                      title: "Proposed Sales Price",
                      dataIndex: "suggested_price",
                      key: "suggested_price",
                      render: (value) => (
                        <span style={{ color: "#16A34A", fontWeight: 600 }}>
                          {formatCurrency(Number(value || 0))}
                        </span>
                      ),
                    },
                    {
                      title: "Discount %",
                      dataIndex: "discount",
                      key: "discount",
                      render: (value) => (
                        <span
                          style={{
                            background: "#FEF3C7",
                            color: "#B45309",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {value}
                        </span>
                      ),
                    }
                  ]}
                />
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
                <Text strong style={{ fontSize: 14 }}><span className="circle bg-success"></span>{k}</Text>  
                <Paragraph style={{ margin: 0 }} type="secondary">{v}</Paragraph>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Card>
  );
}
