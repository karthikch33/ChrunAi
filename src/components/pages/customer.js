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
import { customers as allCustomers } from "./customersData"; // <-- adjust path if needed
// Ensure styles once in your app entry: import "antd/dist/reset.css";

const compactIN = (n) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n || 0));

// Helpers to analyze recent trend
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

// Insights (uses API-provided customer.insights if available; else derives)
function buildInsights(customer, timeseries = []) {
  if (customer?.insights) {
    return {
      churnDecision: customer.insights.churnDecision ?? "",
      howToRetain: customer.insights.howToRetain ?? "",
      offers: customer.insights.offers ?? "",
    };
  }
  const cluster = String(customer?.cluster ?? "").toLowerCase();
  const { declining } = trendFlags(timeseries);

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

// Observations (API override if present)
function buildObservations(customer, timeseries = []) {
  if (customer?.insights?.observations) return customer.insights.observations;

  const { declining, improving, delta } = trendFlags(timeseries);
  if (declining) {
    return `Revenue shows a consistent decline across recent quarters (Δ ${delta.toLocaleString(
      "en-IN"
    )}). This pattern aligns with elevated churn risk for ${customer.cluster} accounts.`;
  }
  if (improving) {
    return `Revenue is improving quarter-over-quarter (Δ ${delta.toLocaleString(
      "en-IN"
    )}). ${customer.cluster} segment performance indicates positive momentum that can be reinforced.`;
  }
  if (String(customer?.cluster ?? "").toLowerCase().includes("mixed")) {
    return `Revenue trend is mixed with variability across quarters. Monitoring is advised to distinguish seasonality from structural demand changes.`;
  }
  return `Revenue remains relatively stable with no pronounced quarter-over-quarter changes observed recently.`;
}

// Recommendations (API override if present)
function buildRecommendations(customer, timeseries = []) {
  if (customer?.insights?.recommendations) return customer.insights.recommendations;

  const cluster = String(customer?.cluster ?? "").toLowerCase();
  const { declining } = trendFlags(timeseries);

  if (declining) {
    return `Deploy a 2-stage retention plan:
1) Reactivation bundle on historically co-purchased SKUs and a time-bound incentive;
2) Follow-up with reorder reminders and account manager outreach if response is weak.`;
  }
  if (cluster.includes("high")) {
    return `Offer priority support, early access to launches, and volume-based loyalty credits to protect high-value revenue.`;
  }
  if (cluster.includes("mixed")) {
    return `Stabilize demand via mix-and-match bundles and quarterly promotions tuned to seasonal spikes. Validate price elasticity with small A/B tests.`;
  }
  return `Simplify reordering, introduce low-commitment bundles, and add small win-back coupons to rebuild purchase frequency.`;
}

export default function CustomerDetailPage() {
  const { customerNo } = useParams();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);

  // Lookup (replace with fetch when API is ready)
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

  // Quarterly series (replace with API-provided series)
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
  const observations = buildObservations(customer, revenueByQuarter);
  const recommendations = buildRecommendations(customer, revenueByQuarter);

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

      {/* Narrative insights */}
      <Card>
        <h3 style={{ marginTop: 0 }}>Churn decision</h3>
        <p style={{ marginBottom: 16 }}>{churnDecision}</p>

        <h3>How to retain</h3>
        <p style={{ marginBottom: 16 }}>{howToRetain}</p>

        <h3>Offers we can provide</h3>
        <p style={{ marginBottom: 0 }}>{offers}</p>
      </Card>

      {/* Revenue by quarter */}
      {/* <Card title="Revenue by quarter">
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
      {/* <Card title="Revenue by year">
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
      </Card>  */}

      {/* Charts side by side on desktop, stacked on small screens */}
<div
  style={{
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    alignItems: "stretch",
  }}
>
  <Card title="Revenue by quarter" style={{ height: "100%" }}>
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

  <Card title="Revenue by year" style={{ height: "100%" }}>
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


      {/* Observations and Recommendations */}
      <Card title="Observations">
        <p style={{ marginBottom: 0 }}>{observations}</p>
      </Card>

      <Card title="Recommendations">
        {String(recommendations)
          .split("\n")
          .map((line, i) => (
            <p key={i} style={{ marginBottom: 12 }}>
              {line}
            </p>
          ))}
      </Card>
    </div>
  );
}
