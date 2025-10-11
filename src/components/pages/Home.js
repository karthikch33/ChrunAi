import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Card, CardContent, Typography, Chip, Stack } from "@mui/material";
import { Table, Tag } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { useNavigate } from "react-router-dom";

const chartColors = ["#1976d2", "#42a5f5", "#ef5350"];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius = 60, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="#1e293b"
      strokeWidth={1}
    />
  );
};

const percentageLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#0f172a" textAnchor="middle" dominantBaseline="central" fontSize={12}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const formatRevenue = (val) => {
  const str = val.toFixed(2);
  const [intPart, decimalPart] = str.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "_");
  return `${formatted}.${decimalPart}`;
};

export default function Home() {
  const navigate = useNavigate();

  // App state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCluster, setActiveCluster] = useState("None");
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hiddenNames, setHiddenNames] = useState(new Set());
  const [activeSlice, setActiveSlice] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://test-964804772271.europe-west1.run.app/clustered-data");

        const json = await res.json();
        setData(json); // Expecting array of customers
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Pie chart data based on API
  const chartData = useMemo(() => {
    if (!data.length) return [];
    const clusterMap = { high_revenue: 0, mixed_revenue: 0, low_revenue: 0 };
    data.forEach((c) => {
      const cluster = c.cluster_name.toLowerCase();
      if (clusterMap[cluster] !== undefined) clusterMap[cluster] += 1;
    });
    return Object.entries(clusterMap).map(([name, value]) => ({ name, value }));
  }, [data]);

  // Pie chart slice ranges
  const sliceToRange = {
    high_revenue: [0, Infinity],
    mixed_revenue: [0, Infinity],
    low_revenue: [0, Infinity],
  };

  const topTotal = useMemo(() => chartData.reduce((s, d) => s + d.value, 0), [chartData]);

  // Table columns
  const columns = useMemo(
    () => [
      { title: "Customer No", dataIndex: "customer", key: "customer" },
      { title: "Company Code", dataIndex: "company_code", key: "company_code" },
      {
        title: "Cluster",
        dataIndex: "cluster_name",
        key: "cluster_name",
        filters: [
          { text: "High Revenue", value: "high_revenue" },
          { text: "Mixed Revenue", value: "mixed_revenue" },
          { text: "Low Revenue", value: "low_revenue" },
        ],
        onFilter: (v, r) => r.cluster_name.toLowerCase() === v,
        render: (v) => (
          <Tag color={v === "high_revenue" ? "blue" : v === "low_revenue" ? "red" : "gold"}>{v}</Tag>
        ),
      },
      {
        title: "Total Revenue",
        dataIndex: "total_revenue",
        key: "total_revenue",
        sorter: (a, b) => a.total_revenue - b.total_revenue,
        render: (val) => formatRevenue(val),
      },
      {
        title: "Revenue Rank In Cluster",
        dataIndex: "revenue_rank_in_cluster",
        key: "revenue_rank_in_cluster",
        sorter: (a, b) => a.revenue_rank_in_cluster - b.revenue_rank_in_cluster,
      },
      {
        title: "Purchasing Frequency",
        dataIndex: "purchasing_frequency",
        key: "purchasing_frequency",
        sorter: (a, b) => a.purchasing_frequency - b.purchasing_frequency,
      },
      {
        title: "Detailed Analysis",
        key: "action",
        render: (_, record) => <a onClick={() => navigate(`/customers/${record.customer}`)}>Open</a>,
      },
    ],
    [navigate]
  );

  const filteredRows = useMemo(() => {
    if (!activeSlice) return data;
    const [min, max] = activeSlice.range;
    return data.filter(
      (c) => c.cluster_name.toLowerCase() === activeSlice.name && c.total_revenue >= min && c.total_revenue < max
    );
  }, [data, activeSlice]);

  const handleTableChange = useCallback((p) => setPagination({ current: p.current, pageSize: p.pageSize }), []);

  const handlePieClickTop = useCallback(
    (entry, index) => {
      const name = entry?.name;
      setActiveCluster(name ?? "None");
      setSelectedIndex(index);
      setPagination((pg) => ({ ...pg, current: 1 }));
      setActiveSlice((prev) => {
        if (prev && prev.name === name) return null;
        const range = sliceToRange[name] ?? [0, Infinity];
        return { name, range };
      });
    },
    []
  );

  const handleLegendClickTop = useCallback(
    (e) => {
      const name = e?.value;
      setHiddenNames((prev) => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
      });
    },
    []
  );

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5">Loading data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Customer Dashboard
      </Typography>

      {/* KPI Cards */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 4 }}>
        <Card sx={{ flex: 1, minWidth: 260, borderRadius: "16px", boxShadow: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" color="textSecondary">
              Total Customers
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {data.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 260, borderRadius: "16px", boxShadow: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" color="textSecondary">
              Total Revenue
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatRevenue(data.reduce((acc, c) => acc + c.total_revenue, 0))}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 260, borderRadius: "16px", boxShadow: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" color="textSecondary">
              Active Cluster Filter
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight="bold">
                {activeCluster}
              </Typography>
              {activeCluster !== "None" && (
                <Chip
                  label="Clear"
                  size="small"
                  color="primary"
                  onClick={() => {
                    setActiveCluster("None");
                    setSelectedIndex(-1);
                    setActiveSlice(null);
                  }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* PieChart */}
      <Box mt={2} sx={{ width: "100%", height: 360, bgcolor: "white", borderRadius: 2, boxShadow: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData.filter((d) => !hiddenNames.has(d.name))}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              dataKey="value"
              nameKey="name"
              activeIndex={hoverIndex >= 0 ? hoverIndex : selectedIndex}
              activeShape={renderActiveShape}
              label={percentageLabel}
              onClick={handlePieClickTop}
              onMouseEnter={(_, idx) => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(-1)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={chartColors[index % chartColors.length]}
                  style={{ cursor: "pointer", transition: "opacity .2s ease" }}
                  opacity={selectedIndex >= 0 && selectedIndex !== index ? 0.6 : 1}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value]} />
            <Legend
              verticalAlign="bottom"
              height={36}
              onClick={handleLegendClickTop}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Customers Table */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Customers Table
        </Typography>
        <Table
          columns={columns}
          dataSource={filteredRows}
          rowKey="customer"
          pagination={{ ...pagination, total: filteredRows.length, showSizeChanger: true }}
          onChange={handleTableChange}
        />
      </Box>
    </Box>
  );
}
