import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Descriptions, Spin, Alert } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { customers as allCustomers } from "./customersData";

const compactIN = (n) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n || 0));

function trendFlags(timeseries = []) {
  const recent = timeseries.slice(-4);
  const has = recent.length >= 2 && recent.every((p) => typeof p.value === "number");
  const delta = has ? recent[recent.length - 1].value - recent[0].value : 0;
  return {
    recent,
    declining: has && recent[0].value > recent[recent.length - 1].value,
    improving: has && recent[recent.length - 1].value > recent[0].value,
    delta,
  };
}

function buildInsights(customer, timeseries = []) {
  const cluster = String(customer?.cluster ?? "").toLowerCase();
  const { declining } = trendFlags(timeseries);

  let churnDecision = "Stable recent performance with no clear churn signals.";
  if (cluster.includes("low") || declining) {
    churnDecision = "Revenue decline observed — potential churn risk detected.";
  } else if (cluster.includes("mixed")) {
    churnDecision = "Mixed revenue patterns; monitor closely for churn indicators.";
  } else if (cluster.includes("high")) {
    churnDecision = "High-value customer; strong retention likelihood.";
  }

  let howToRetain = "Maintain engagement and reinforce product value.";
  if (declining) {
    howToRetain = "Deploy reactivation offers and personalized follow-ups to recover momentum.";
  } else if (cluster.includes("low")) {
    howToRetain = "Simplify reordering experience; offer low-commitment bundles.";
  } else if (cluster.includes("high")) {
    howToRetain = "Provide premium support and early access privileges.";
  }

  let offers = "Standard loyalty benefits and occasional discounts.";
  if (cluster.includes("mixed")) {
    offers = "Introduce combo deals and seasonal offers to stabilize demand.";
  } else if (cluster.includes("low")) {
    offers = "Reactivation coupons and bundled starter packs.";
  }

  return { churnDecision, howToRetain, offers };
}

function buildObservations(customer, timeseries = []) {
  const { declining, improving, delta } = trendFlags(timeseries);
  if (declining)
    return `Revenue dropped by ₹${delta.toLocaleString("en-IN")} in recent quarters — monitor closely.`;
  if (improving)
    return `Revenue improved by ₹${delta.toLocaleString("en-IN")} — growth momentum is positive.`;
  return `Revenue trend stable with minor fluctuations.`;
}

function buildRecommendations(customer, timeseries = []) {
  const cluster = String(customer?.cluster ?? "").toLowerCase();
  const { declining } = trendFlags(timeseries);

  if (declining) {
    return [
      "Launch a targeted reactivation campaign with limited-time incentives.",
      "Follow-up via account managers to rebuild engagement.",
    ];
  }
  if (cluster.includes("high")) {
    return [
      "Offer exclusive previews of upcoming products.",
      "Provide loyalty credits and personalized account support.",
    ];
  }
  if (cluster.includes("mixed")) {
    return [
      "Deploy quarterly promotions and measure elasticity through A/B testing.",
      "Encourage category diversification via combo deals.",
    ];
  }
  return [
    "Simplify reorder process through subscription or quick checkout.",
    "Send small-value coupons to trigger consistent reorders.",
  ];
}

export default function CustomerDetailPage() {
  const { customerNo } = useParams();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const found = allCustomers.find((c) => String(c.customerNo) === String(customerNo));
    if (found) setCustomer(found);
    else setError("Customer not found");
    setLoading(false);
  }, [customerNo]);

  const revenueByQuarter = useMemo(
    () => [
      { key: "2024-Q1", value: 1050000 },
      { key: "2024-Q2", value: 1320000 },
      { key: "2024-Q3", value: 1210000 },
      { key: "2024-Q4", value: 1480000 },
      { key: "2025-Q1", value: 1060000 },
      { key: "2025-Q2", value: 980000 },
      { key: "2025-Q3", value: 760000 },
      { key: "2025-Q4", value: 720000 },
    ],
    []
  );

  const revenueByYear = useMemo(() => {
    const map = new Map();
    for (const r of revenueByQuarter) {
      const y = r.key.split("-")[0];
      map.set(y, (map.get(y) || 0) + r.value);
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
  }, [revenueByQuarter]);

  if (loading)
    return (
      <div style={{ padding: 24 }}>
        <Spin />
      </div>
    );

  if (error)
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message={error} />
        <Link to="/customers">Back to list</Link>
      </div>
    );

  const { churnDecision, howToRetain, offers } = buildInsights(customer, revenueByQuarter);
  const observations = buildObservations(customer, revenueByQuarter);
  const recommendations = buildRecommendations(customer, revenueByQuarter);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Customer Insight Dashboard</h2>
        <Link to="/customers">Back</Link>
      </div>

      {/* Overview */}
      <Card>
        <Descriptions bordered size="small" column={3}>
          <Descriptions.Item label="Customer">{customer.customerNo}</Descriptions.Item>
          <Descriptions.Item label="Cluster">{customer.cluster}</Descriptions.Item>
          <Descriptions.Item label="Churn Risk">
            {customer.cluster === "Low_Revenue" ? "High" : "Low"}
          </Descriptions.Item>
          <Descriptions.Item label="Total Revenue" span={3}>
            ₹{Number(customer.totalRevenue).toLocaleString("en-IN")}
          </Descriptions.Item>
          <Descriptions.Item label="Rank in Cluster">{customer.rankInCluster}</Descriptions.Item>
          <Descriptions.Item label="Purchase Frequency">{customer.purchasingFreq}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Charts */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
        <Card title="Revenue by Quarter">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByQuarter}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="key" />
              <YAxis tickFormatter={compactIN} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="value" fill="#1976d2" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue by Year">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByYear}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="key" />
              <YAxis tickFormatter={compactIN} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="value" fill="#2e7d32" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Business Insights */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card title="Churn Analysis">
          <p>{churnDecision}</p>
        </Card>
        <Card title="Sales Trend">
          <p>{observations}</p>
        </Card>
        <Card title="Retention Strategy">
          <p>{howToRetain}</p>
        </Card>
        <Card title="Offers & Incentives">
          <p>{offers}</p>
        </Card>
      </div>

      {/* Recommendations */}
      <Card title="Actionable Recommendations">
        {recommendations.map((line, i) => (
          <p key={i} style={{ marginBottom: 8 }}>
            • {line}
          </p>
        ))}
      </Card>
    </div>
  );
}
