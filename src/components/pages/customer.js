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
  const [loading, setLoading] = useState(true);
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
  }, [customerNo]);


  console.log(customer);

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
      <div style={{ padding: 24, display: "grid", gap: 16 }}>
        {/* Header with parallax */}
        <ParallaxHeader>
          <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.4, once: false }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Space size={12} align="start">
                <Title level={3} style={{ margin: 0 }}>Customer Insights</Title>
                <Tag color="blue">{customer.customer}</Tag>
                <Tag color="default">Cluster: {customer.cluster}</Tag>
                <Tag color={churnColor}>Churn: {customer.churn}</Tag>
              </Space>
              <Link to="/customers"><ArrowLeftOutlined /> Back</Link>
            </div>
          </motion.div>
        </ParallaxHeader>

        {/* KPI strip */}
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
          <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
            <Card>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <KPI label="Total Revenue" value={formatCurrency(totals.total)} hint="All years combined" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <KPI label="Latest Year" value={formatCurrency(totals.latest)}
                       extra={<Delta pct={((totals.latest - totals.prev) / (totals.prev || 1)) * 100} />} />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <KPI label="Previous Year" value={formatCurrency(totals.prev)} />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <KPI label="Materials Priced" value={String(customer.best_price_by_material?.length || 0)} hint="Suggestions available" />
                </Col>
              </Row>
            </Card>
          </motion.div>
        </motion.div>

        {/* Overview */}
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
          <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
            <Card>
              <Descriptions size="middle" colon={false} column={{ xs: 1, sm: 2, md: 3 }} labelStyle={{ color: "rgba(0,0,0,0.65)" }}>
                <Descriptions.Item label="Customer">{customer.customer}</Descriptions.Item>
                <Descriptions.Item label="Cluster">{customer.cluster}</Descriptions.Item>
                <Descriptions.Item label="Churn"><Tag color={churnColor}>{customer.churn}</Tag></Descriptions.Item>
                <Descriptions.Item label="Purchase Details" span={3}>
                  <Text type="secondary">{customer.Purchase_details}</Text>
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
                    <Card title={<Space>{c.icon}<span>{c.title}</span></Space>}>
                      <Paragraph style={{ marginBottom: 0 }}>{c.text}</Paragraph>
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
                <Divider />
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {customer.best_price_by_material.map((item, idx) => (
                    <SuggestionRow key={idx} item={item} />
                  ))}
                </Space>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Observations & Recommendations — from array of {key,value} */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
              <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                <AnimatedKeyValueList title="Observations" data={obsList} />
              </motion.div>
            </motion.div>
          </Col>
          <Col xs={24} md={12}>
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ amount: 0.3, once: false }}>
              <motion.div variants={liftHover} initial="initial" whileHover="hover" whileTap="tap">
                <AnimatedKeyValueList title="Recommendations" data={recList} />
              </motion.div>
            </motion.div>
          </Col>
        </Row>
      </div>
    </>
  );
}

// Small components
function KPI({ label, value, hint, extra }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>{value}</Title>
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

function AnimatedKeyValueList({ title, data }) {
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
      <Card title={title}>
        <Empty description="No data available" />
      </Card>
    );
  }

  return (
    <Card title={title}>
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
                <Text strong style={{ fontSize: 14 }}>{k}</Text>
                <Paragraph style={{ margin: 0 }} type="secondary">{v}</Paragraph>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Card>
  );
}
