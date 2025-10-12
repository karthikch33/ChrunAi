import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Descriptions, Spin, Alert } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Helper: compact number formatting
const compactIN = (n) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n || 0));

// Helper: format currency
const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function CustomerDetailPage() {
  const { customerNo } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);

  console.log(customer)

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`https://test-964804772271.europe-west1.run.app/customer-insights/${customerNo}`)
      .then((res) => {
        console.log(res);
        if (!res.ok) throw new Error("Failed to fetch customer data");
        return res.json();
      })
      .then((data) => setCustomer(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerNo]);

  // Convert revenue objects to arrays for charts
  const revenueByQuarter = useMemo(() => {
    if (!customer?.revenue_by_quarter) return [];
    return Object.entries(customer.revenue_by_quarter).map(([key, value]) => ({ key, value }));
  }, [customer]);

  const revenueByYear = useMemo(() => {
    if (!customer?.revenue_by_year) return [];
    return Object.entries(customer.revenue_by_year).map(([key, value]) => ({ key, value }));
  }, [customer]);

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

  if (!customer)
    return (
      <div style={{ padding: 24 }}>
        <Alert type="warning" message="Customer data not found." />
        <Link to="/customers">Back to list</Link>
      </div>
    );

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Customer Insight Dashboard</h2>
        <Link to="/customers">Back</Link>
      </div>

      {/* Overview */}
      <Card>
        <Descriptions bordered size="small" column={3}>
          <Descriptions.Item label="Customer">{customer.customer}</Descriptions.Item>
          <Descriptions.Item label="Cluster">{customer.cluster}</Descriptions.Item>
          <Descriptions.Item label="Churn">{customer.churn}</Descriptions.Item>
          <Descriptions.Item label="Total Revenue" span={3}>
            {formatCurrency(
              customer.revenue_by_year
                ? Object.values(customer.revenue_by_year).reduce((a, b) => a + b, 0)
                : 0
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Purchase Details" span={3}>
            {customer.Purchase_details}
          </Descriptions.Item>
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
              <Tooltip formatter={(v) => formatCurrency(v)} />
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
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#2e7d32" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Business Insights */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card title="Churn Analysis">
          <p>{customer.churn_analysis}</p>
        </Card>
        <Card title="Sales Trend">
          <p>{customer.trend_of_sales}</p>
        </Card>
        <Card title="Retention Strategy">
          <p>{customer.retention_strategies}</p>
        </Card>
        <Card title="Offers & Incentives">
          <p>{customer.Retention_offers}</p>
        </Card>
      </div>

      {/* Observation */}
      <Card title="Observations">
        <p>{customer.observation}</p>
      </Card>

      <Card title="Recommendations">
        <p>{customer.recommendation}</p>
      </Card>

      {/* Product combination and best price */}
      {customer.product_combination && (
        <Card title="Product Combination">
          <p>{customer.product_combination}</p>
        </Card>
      )}
      {customer.best_price_by_material?.length > 0 && (
        <Card title="Best Price Suggestions">
          {customer.best_price_by_material.map((item, idx) => (
            <p key={idx}>
              {item.material} → Suggested Price: ₹{item.suggested_price.toLocaleString("en-IN")} (Discount:{" "}
              {item.discount})
            </p>
          ))}
        </Card>
      )}
    </div>
  );
}
