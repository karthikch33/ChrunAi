import React, { useMemo, useState, useCallback } from "react";
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

import { customers as masterRows } from "./customersData";
import { useNavigate } from "react-router-dom";

// Top chart data
const chartData = [
  { name: "High_Revenue", value: 30 },
  { name: "Mixed_Revenue", value: 30 },
  { name: "Low_Revenue", value: 20 },
];

// Map clusters to revenue ranges for filtering
const sliceToRange = {
  High_Revenue: [100_000_000, Infinity],
  Mixed_Revenue: [50_000_000, 100_000_000],
  Low_Revenue: [0, 50_000_000],
};

// Example table data (replace with API)
 // or paste your 90-row array here

const COLORS = ["#1976d2", "#42a5f5", "#ef5350"];


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

export default function Home() {
  // KPI/Top pie state
  const [activeCluster, setActiveCluster] = useState("None");
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hiddenNames, setHiddenNames] = useState(new Set());

  // Table state
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  // Active slice for table filtering (null = no filter)
  const [activeSlice, setActiveSlice] = useState(null); // { name, range: [min, max] }

  const topPieData = useMemo(
    () => chartData.filter((d) => !hiddenNames.has(d.name)),
    [hiddenNames]
  );
  const topTotal = useMemo(
    () => topPieData.reduce((s, d) => s + d.value, 0),
    [topPieData]
  );

  const columns = useMemo(
    () => [
      { title: "Customer No", dataIndex: "customerNo", key: "customerNo" },
      {
        title: "Cluster",
        dataIndex: "cluster",
        key: "cluster",
        filters: [
          { text: "High_Revenue", value: "High_Revenue" },
          { text: "Mixed_Revenue", value: "Mixed_Revenue" },
          { text: "Low_Revenue", value: "Low_Revenue" },
        ],
        onFilter: (v, r) => r.cluster === v,
        render: (v) => (
          <Tag color={v === "High_Revenue" ? "blue" : v === "Low_Revenue" ? "red" : "gold"}>
            {v}
          </Tag>
        ),
      },
      {
        title: "Total Revenue",
        dataIndex: "totalRevenue",
        key: "totalRevenue",
        sorter: (a, b) => a.totalRevenue - b.totalRevenue,
        render: (val) => val.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
      },
      {
        title: "Revenue Rank In The Cluster",
        dataIndex: "rankInCluster",
        key: "rankInCluster",
        sorter: (a, b) => a.rankInCluster - b.rankInCluster,
      },
      {
        title: "Purchasing Frequency",
        dataIndex: "purchasingFreq",
        key: "purchasingFreq",
        sorter: (a, b) => a.purchasingFreq - b.purchasingFreq,
      },
      {
        title: "Detailed Analysis",
        key: "action",
        render: (_, record) => (
          <a onClick={() => navigate(`/customers/${record.customerNo}`)}>
            Open
          </a>
        ),
      },
    ],
    []
  );

  // Filter masterRows by activeSlice from the top pie
  const filteredRows = useMemo(() => {
    if (!activeSlice) return masterRows;
    const [min, max] = activeSlice.range;
    return masterRows.filter(
      (c) => c.cluster === activeSlice.name && c.totalRevenue >= min && c.totalRevenue < max
    );
  }, [activeSlice]);

  const handleTableChange = useCallback((p) => {
    setPagination({ current: p.current, pageSize: p.pageSize });
  }, []);

  // Clicking a slice on the top pie toggles the table filter
  const handlePieClickTop = useCallback((entry, index) => {
    const name = entry?.name;
    setActiveCluster(name ?? "None");
    setSelectedIndex(index);

    setPagination((pg) => ({ ...pg, current: 1 }));

    setActiveSlice((prev) => {
      if (prev && prev.name === name) return null; // toggle off if same slice
      const range = sliceToRange[name] ?? [0, Infinity];
      return { name, range };
    });
  }, []);

  // Legend toggles visibility of slices on the chart only
  const handleLegendClickTop = useCallback((e) => {
    const name = e?.value;
    setHiddenNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleKeyDownTop = useCallback(
    (evt) => {
      if (!topPieData.length) return;
      if (evt.key === "ArrowRight" || evt.key === "ArrowDown") {
        evt.preventDefault();
        setSelectedIndex((i) => (i + 1) % topPieData.length);
        const next = topPieData[(selectedIndex + 1) % topPieData.length];
        if (next) {
          setActiveCluster(next.name);
          setActiveSlice({ name: next.name, range: sliceToRange[next.name] });
          setPagination((pg) => ({ ...pg, current: 1 }));
        }
      }
      if (evt.key === "ArrowLeft" || evt.key === "ArrowUp") {
        evt.preventDefault();
        setSelectedIndex((i) => (i - 1 + topPieData.length) % topPieData.length);
        const prev = topPieData[(selectedIndex - 1 + topPieData.length) % topPieData.length];
        if (prev) {
          setActiveCluster(prev.name);
          setActiveSlice({ name: prev.name, range: sliceToRange[prev.name] });
          setPagination((pg) => ({ ...pg, current: 1 }));
        }
      }
      if (evt.key === "Enter" && selectedIndex >= 0) {
        const cur = topPieData[selectedIndex];
        if (cur) {
          setActiveCluster(cur.name);
          setActiveSlice({ name: cur.name, range: sliceToRange[cur.name] });
          setPagination((pg) => ({ ...pg, current: 1 }));
        }
      }
    },
    [topPieData, selectedIndex]
  );

  const navigate = useNavigate()


  return (
    <>
    
    <Box sx={{ p: 4, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Customer Dashboard
      </Typography>

      {/* Full-width stats row with space-between */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "stretch",
          gap: 3,             // consistent spacing between items
          flexWrap: "wrap",   // wrap on small screens
          mb: 4,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 260, maxWidth: 480 }}>
          <Card sx={{ borderRadius: "16px", boxShadow: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Total Customers
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                80
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: 260, maxWidth: 480 }}>
          <Card sx={{ borderRadius: "16px", boxShadow: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Total Revenue
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                768,810,554.24
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: 260, maxWidth: 480 }}>
          <Card sx={{ borderRadius: "16px", boxShadow: 3, height: "100%" }}>
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
                    }}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* KPI cards (optional, unchanged) */}

      {/* Single PieChart driving the Table filter */}
      <Box mt={2}>
        <Typography variant="h6" mb={1}>
          Customers per Cluster
        </Typography>
        <Typography variant="body2" mb={2}>
          Click a slice to filter the table. Total slices: {topTotal}
        </Typography>

        <Box
          sx={{
            width: "100%",
            height: 360,
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            outline: "none",
          }}
          role="region"
          aria-label="Cluster pie chart"
          tabIndex={0}
          onKeyDown={handleKeyDownTop}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={topPieData}
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
                isAnimationActive
                animationDuration={500}
                animationEasing="ease-in-out"
              >
                {topPieData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{ cursor: "pointer", transition: "opacity .2s ease" }}
                    opacity={selectedIndex >= 0 && selectedIndex !== index ? 0.6 : 1}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}`, name]} />
              <Legend
                verticalAlign="bottom"
                height={36}
                onClick={handleLegendClickTop}
                formatter={(value) => {
                  const hidden = hiddenNames.has(value);
                  return (
                    <span style={{ textDecoration: hidden ? "line-through" : "none" }}>
                      {value}
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Table filtered by the single PieChart */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Customers table
        </Typography>
        <Table
          columns={columns}
          dataSource={filteredRows}
          rowKey="key"
          pagination={{
            ...pagination,
            total: filteredRows.length,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />
      </Box>
    </Box>
    </>
  );
}
