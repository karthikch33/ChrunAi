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
import { customers as allCustomers } from './customersData'

// Compact number formatter for axes
const compactIN = (n) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n || 0));

// Insights builder: prefers API fields if present, else derives from cluster/trend
function buildInsights(customer, timeseries = []) {
  if (customer?.insights) {
    return {
      churnDecision: customer.insights.churnDecision ?? "",
      howToRetain: customer.insights.howToRetain ?? "",
      offers: customer.insights.offers ?? "",
    };
  }
  const cluster = String(customer?.cluster ?? "").toLowerCase();
  const recent = timeseries.slice(-4);
  const declining =
    recent.length >= 2 &&
    recent.every((p) => typeof p.value === "number") &&
    recent[0].value > recent[recent.length - 1].value;

  let churnDecision = "Stable recent performance with no clear churn signals.";
  if (cluster.includes("low") || declining) {
    churnDecision =
      "Significant revenue decline in recent periods, with consistent quarterly drops, indicates potential churn.";
  } else if (cluster.includes("mixed")) {
    churnDecision =
      "Mixed revenue trend with variability; monitor closely for early churn indicators.";
  } else if (cluster.includes("high")) {
    churnDecision =
      "High-value segment; protect with proactive retention and service quality.";
  }

  let howToRetain =
    "Maintain engagement cadence and reinforce value with targeted communication.";
  if (declining) {
    howToRetain =
      "Leverage frequent purchases of core SKUs; offer targeted incentives to reverse the declining revenue trend.";
  } else if (cluster.includes("low")) {
    howToRetain =
      "Reduce friction with simpler re-order flows and small-value bundles to rebuild momentum.";
  } else if (cluster.includes("high")) {
    howToRetain =
      "Provide priority support and early access to new products to sustain loyalty.";
  }

  let offers =
    "Bundled discounts on top co-purchased items and loyalty rewards for consistent orders.";
  if (cluster.includes("mixed")) {
    offers =
      "Mix-and-match bundles across adjacent categories; limited-time value packs to stabilize revenue.";
  } else if (cluster.includes("low")) {
    offers =
      "Starter bundles, free shipping thresholds, and reactivation coupons to encourage repeat purchase.";
  }

  return { churnDecision, howToRetain, offers };
}

export default function CustomerDetailPage() {
  const { customerNo } = useParams();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);

  // Lookup (swap with real API later)
  useEffect(() => {
    setLoading(true);
    setError(null);
    const found = Array.isArray(allCustomers)
      ? allCustomers.find((c) => String(c?.customerNo ?? "") === String(customerNo ?? ""))
      : null;
    if (found) {
      setCustomer(found);
      setLoading(false);
    } else {
      setError("Customer not found");
      setLoading(false);
    }
  }, [customerNo]);

  // Quarterly series (replace with API series per customer)
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

  // Yearly aggregation from quarters
  const revenueByYear = useMemo(() => {
    const map = new Map();
    for (const r of revenueByQuarter) {
      const y = String(r.key).split("-")[0];
      map.set(y, (map.get(y) || 0) + Number(r.value || 0));
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [revenueByQuarter]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message={error || "Unknown error"} />
        <div style={{ marginTop: 16 }}>
          <Link to="/customers">Back to list</Link>
        </div>
      </div>
    );
  }

  const { churnDecision, howToRetain, offers } = buildInsights(customer, revenueByQuarter);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Detailed Analysis</h2>
        <Link to="/customers">Back</Link>
      </div>

      {/* Summary */}
      <Card>
        <Descriptions title="" column={3} bordered size="small">
          <Descriptions.Item label="Customer">{customer.customerNo}</Descriptions.Item>
          <Descriptions.Item label="Cluster">{customer.cluster}</Descriptions.Item>
          <Descriptions.Item label="Churn">{customer.cluster === "Low_Revenue" ? "yes" : "no"}</Descriptions.Item>
          <Descriptions.Item label="Total Revenue" span={3}>
            {Number(customer.totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </Descriptions.Item>
          <Descriptions.Item label="Rank in Cluster">
            {customer.rankInCluster}
          </Descriptions.Item>
          <Descriptions.Item label="Purchasing Frequency">
            {customer.purchasingFreq}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Narrative blocks */}
      <Card>
        <h3 style={{ marginTop: 0 }}>Churn decision</h3>
        <p style={{ marginBottom: 16 }}>{churnDecision}</p>

        <h3>How to retain</h3>
        <p style={{ marginBottom: 16 }}>{howToRetain}</p>

        <h3>Offers we can provide</h3>
        <p style={{ marginBottom: 0 }}>{offers}</p>
      </Card>

      {/* Revenue by quarter */}
      <Card title="Revenue by quarter">
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByQuarter} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="revQtr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1976d2" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1976d2" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="key" tickMargin={8} />
              <YAxis tickFormatter={compactIN} width={70} />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString("en-IN"), "Revenue"]}
                labelFormatter={(l) => `Quarter: ${l}`}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#999" />
              <Bar dataKey="value" name="Revenue" fill="url(#revQtr)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Revenue by year */}
      <Card title="Revenue by year">
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByYear} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="revYear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2e7d32" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#2e7d32" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="key" tickMargin={8} />
              <YAxis tickFormatter={compactIN} width={70} />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString("en-IN"), "Revenue"]}
                labelFormatter={(l) => `Year: ${l}`}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#999" />
              <Bar dataKey="value" name="Revenue" fill="url(#revYear)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
